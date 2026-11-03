import { logger } from "#config/logger.js";
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

  /** Slug duy nhất: "ten-sp", "ten-sp-2"… */
  async #uniqueSlug(wanted, exceptId) {
    let slug = wanted;
    for (let i = 2; await this.repo.slugTaken(slug, exceptId); i++) slug = `${wanted}-${i}`;
    return slug;
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
    const slug = await this.#uniqueSlug(input.slug || slugify(input.title));
    const product = await this.repo.create({ ...input, slug, order: await this.repo.nextOrder() });
    logger.info("Tạo sản phẩm", { id: product.id, slug });
    return product;
  }

  async update(id, input) {
    const before = await this.getById(id);
    const patch = { ...input };
    if (input.slug) patch.slug = await this.#uniqueSlug(input.slug, id);
    const product = await this.repo.update(id, patch);
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

  /** Xoá mềm: ẩn khỏi website & trang quản trị, giữ nguyên dữ liệu và tệp trên Cloudinary. */
  async remove(id, by) {
    if (!(await this.repo.softDelete(id, { by }))) {
      throw ApiError.notFound("Sản phẩm không còn tồn tại hoặc đã bị xoá trước đó");
    }
    logger.info("Xoá (mềm) sản phẩm", { id, by });
  }

  /** Hoàn tác xoá. Slug cũ đã bị sản phẩm khác dùng trong lúc đó → tự thêm hậu tố "-2", "-3"… */
  async restore(id, by) {
    const p = await this.repo.findDeletedById(id);
    if (!p)
      throw ApiError.notFound(
        "Đã quá thời gian hoàn tác hoặc sản phẩm đã được khôi phục trước đó.",
      );
    const product = await this.repo.restore(id, { slug: await this.#uniqueSlug(p.slug, id) });
    logger.info("Khôi phục sản phẩm", { id, by });
    return product;
  }
}

export const productService = new ProductService();
