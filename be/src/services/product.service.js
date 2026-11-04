import { logger } from "#config/logger.js";
import { MAX_PINNED } from "#models/product.model.js";
import { productRepository } from "#repositories/product.repository.js";
import { MediaService, mediaService } from "#services/media.service.js";
import { ApiError } from "#utils/api-error.js";

/** "Bộ ảnh Giáng sinh!" → "bo-anh-giang-sinh" */
export const slugify = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100) || "san-pham";

/** Mọi tệp trên kho Cloudinary mà sản phẩm đang dùng → Map<public_id, "image" | "video">. */
export function assetsOf(p) {
  const out = new Map();
  const add = (url, type) => {
    const id = MediaService.publicIdOf(url);
    if (id) out.set(id, type);
  };
  for (const m of [...(p?.media ?? []), p?.cover, ...(p?.featured ?? [])].filter(Boolean)) {
    add(m.url, m.type === "video" ? "video" : "image");
    add(m.poster, "image");
    for (const f of m.frames ?? []) add(f, "image");
  }
  return out;
}

/** TẦNG SERVICE — sản phẩm đã thực hiện. */
export class ProductService {
  constructor(repo = productRepository) {
    this.repo = repo;
  }

  /**
   * Đường dẫn PHẢI là duy nhất — không tự thêm hậu tố "-2", "-3". Trùng → báo rõ đang trùng với sản phẩm nào
   * để quản trị viên tự đặt đường dẫn khác (lỗi gắn vào ô "Đường dẫn" qua details.path = "slug").
   */
  static slugTakenError(slug, owner) {
    const message = `Đường dẫn “/san-pham/${slug}” đã được dùng cho sản phẩm “${owner?.title ?? "khác"}”. Hãy đổi tên sản phẩm hoặc nhập đường dẫn khác.`;
    return ApiError.conflict(message, {
      code: "SLUG_TAKEN",
      details: [{ field: "slug", message }],
    });
  }

  async #assertSlugFree(slug, exceptId) {
    const owner = await this.repo.slugOwner(slug, exceptId);
    if (owner) throw ProductService.slugTakenError(slug, owner);
  }

  /** Kiểm tra đường dẫn còn trống không (ô "Đường dẫn" ở trang quản trị kiểm tra ngay khi gõ). */
  async checkSlug(slug, exceptId) {
    const owner = await this.repo.slugOwner(slug, exceptId);
    return owner
      ? { available: false, message: ProductService.slugTakenError(slug, owner).message }
      : { available: true };
  }

  /** Lưu trùng đường dẫn cùng lúc (2 người cùng bấm Lưu) → index duy nhất chặn → báo lỗi như trên. */
  async #saveSlugSafe(slug, exceptId, write) {
    try {
      return await write();
    } catch (err) {
      if (err?.code === 11000 && err?.keyPattern?.slug)
        throw ProductService.slugTakenError(slug, await this.repo.slugOwner(slug, exceptId));
      throw err;
    }
  }

  listPublic() {
    return this.repo.list({ publishedOnly: true });
  }

  listAll({ q } = {}) {
    return this.repo.list({ q });
  }

  async getPublicBySlug(slug) {
    const p = await this.repo.findBySlug(slug, { publishedOnly: true });
    if (!p) throw ApiError.notFound("Không tìm thấy sản phẩm");
    return p;
  }

  async getById(id) {
    const p = await this.repo.findById(id);
    if (!p) throw ApiError.notFound("Sản phẩm không còn tồn tại hoặc đã bị xoá");
    return p;
  }

  async create(input) {
    const slug = input.slug || slugify(input.title);
    await this.#assertSlugFree(slug);
    const order = await this.repo.nextOrder();
    const product = await this.#saveSlugSafe(slug, null, () =>
      this.repo.create({ ...input, slug, order }),
    );
    logger.info("Tạo sản phẩm", { id: product.id, slug });
    return product;
  }

  async update(id, input) {
    const before = await this.getById(id);
    const patch = { ...input };
    if (input.slug) await this.#assertSlugFree(input.slug, id);
    const product = await this.#saveSlugSafe(input.slug, id, () => this.repo.update(id, patch));
    if (!product) throw ApiError.notFound("Sản phẩm không còn tồn tại hoặc đã bị xoá");
    this.#purgeRemoved(before, product); // chạy nền, không làm chậm việc lưu
    return product;
  }

  /**
   * Tệp vừa bị gỡ khỏi sản phẩm (ảnh / video trong thư viện, ảnh đại diện, ảnh nổi bật, ảnh đại diện &
   * cảnh phụ của video) → xoá khỏi Cloudinary để không để lại tệp thừa. Giữ lại tệp mà sản phẩm khác
   * (kể cả sản phẩm đã xoá còn khôi phục được) vẫn đang dùng.
   */
  async #purgeRemoved(before, after) {
    try {
      const removed = assetsOf(before);
      for (const id of assetsOf(after).keys()) removed.delete(id);
      if (!removed.size) return;
      const others = await this.repo.model
        .find({ _id: { $ne: before.id ?? before._id } }, { media: 1, cover: 1, featured: 1 })
        .lean();
      for (const o of others) for (const id of assetsOf(o).keys()) removed.delete(id);
      await mediaService.purge(removed);
    } catch (err) {
      logger.warn("Chưa dọn được tệp cũ của sản phẩm", { id: before.id, message: err?.message });
    }
  }

  /**
   * Ghim / bỏ ghim nổi bật (tối đa MAX_PINNED). Ghim khi đã đủ → báo thân thiện kèm tên các sản phẩm đang
   * ghim để quản trị viên biết nên bỏ ghim cái nào.
   */
  async setPinned(id, pinned) {
    const p = await this.getById(id);
    if (!pinned) return p.pinnedAt ? this.repo.update(id, { pinnedAt: null }) : p;
    if (p.pinnedAt) return p;
    const others = await this.repo.pinned(id);
    if (others.length >= MAX_PINNED) {
      throw ApiError.conflict(
        `Chỉ được tối đa ${MAX_PINNED} sản phẩm nổi bật. Hãy bỏ nổi bật một sản phẩm rồi đánh dấu “${p.title}”. Đang nổi bật: ${others.map((o) => `“${o.title}”`).join(", ")}.`,
        {
          code: "PIN_LIMIT",
          details: [{ field: "pinned", message: `Tối đa ${MAX_PINNED} sản phẩm` }],
        },
      );
    }
    logger.info("Ghim sản phẩm nổi bật", { id });
    return this.repo.update(id, { pinnedAt: new Date() });
  }

  /** Xoá mềm: ẩn khỏi website & trang quản trị, giữ nguyên dữ liệu và tệp trên Cloudinary. */
  async remove(id, by) {
    if (!(await this.repo.softDelete(id, { by }))) {
      throw ApiError.notFound("Sản phẩm không còn tồn tại hoặc đã bị xoá trước đó");
    }
    logger.info("Xoá (mềm) sản phẩm", { id, by });
  }

  /**
   * Hoàn tác xoá. Đường dẫn cũ đã bị sản phẩm khác dùng trong lúc đó → báo rõ (không tự đổi đường dẫn).
   * Sản phẩm đang ghim mà đã đủ số ghim tối đa → khôi phục ở trạng thái bỏ ghim.
   */
  async restore(id, by) {
    const p = await this.repo.findDeletedById(id);
    if (!p)
      throw ApiError.notFound(
        "Đã quá thời gian hoàn tác hoặc sản phẩm đã được khôi phục trước đó.",
      );
    const owner = await this.repo.slugOwner(p.slug, id);
    if (owner) {
      throw ApiError.conflict(
        `Không khôi phục được “${p.title}” vì đường dẫn “/san-pham/${p.slug}” hiện đã được dùng cho sản phẩm “${owner.title}”. Hãy đổi đường dẫn của sản phẩm đó rồi thử lại.`,
        { code: "SLUG_TAKEN" },
      );
    }
    const unpin = p.pinnedAt && (await this.repo.pinned(id)).length >= MAX_PINNED;
    const product = await this.repo.restore(id, unpin ? { pinnedAt: null } : {});
    logger.info("Khôi phục sản phẩm", { id, by });
    return product;
  }
}

export const productService = new ProductService();
