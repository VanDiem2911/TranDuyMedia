import { env } from "#config/env.js";
import { logger } from "#config/logger.js";
import { siteContentRepository } from "#repositories/site-content.repository.js";
import { MediaService, mediaService } from "#services/media.service.js";

/** Mọi ảnh trong cây nội dung (object có `src`) do trang này tải lên Cloudinary → Map<public_id, "image">. */
function assetsOf(data) {
  const out = new Map();
  const prefix = `${env.CLOUDINARY_FOLDER}/about/`; // chỉ đụng tệp do trang quản trị tải lên thư mục about/
  const walk = (node) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object") return;
    // src có thể là ảnh hoặc video (banner); poster là ảnh bìa của video — mỗi loại xoá bằng đúng resource_type
    for (const key of ["src", "poster"]) {
      if (typeof node[key] !== "string") continue;
      const id = MediaService.publicIdOf(node[key]);
      if (id?.startsWith(prefix))
        out.set(id, key === "src" && /\/video\/upload\//.test(node.src) ? "video" : "image");
    }
    Object.values(node).forEach(walk);
  };
  walk(data);
  return out;
}

/** TẦNG SERVICE — nội dung trang tĩnh chỉnh được từ trang quản trị. */
export class SiteContentService {
  constructor(repo = siteContentRepository) {
    this.repo = repo;
  }

  /** { data, updatedAt } hoặc null (chưa chỉnh lần nào → website dùng nội dung mặc định). */
  async get(key) {
    const doc = await this.repo.getByKey(key);
    return doc ? { data: doc.data, updatedAt: doc.updatedAt } : null;
  }

  /** Lưu toàn bộ nội dung (đã kiểm tra ở validator). */
  async save(key, data, by) {
    const before = await this.repo.getByKey(key);
    const doc = await this.repo.upsert(key, data, by);
    logger.info("Cập nhật nội dung trang", { key, by });
    this.#purgeRemoved(before?.data, data); // chạy nền, không làm chậm việc lưu
    return { data: doc.data, updatedAt: doc.updatedAt };
  }

  /** Khôi phục nội dung mặc định (xoá bản đã chỉnh). */
  async reset(key) {
    const before = await this.repo.removeByKey(key);
    logger.info("Khôi phục nội dung mặc định của trang", { key });
    if (before) this.#purgeRemoved(before.data, null);
  }

  /** Ảnh vừa bị thay / gỡ → xoá khỏi Cloudinary để không để lại tệp thừa. */
  async #purgeRemoved(before, after) {
    try {
      if (!before) return;
      const removed = assetsOf(before);
      for (const id of assetsOf(after).keys()) removed.delete(id);
      await mediaService.purge(removed);
    } catch (err) {
      logger.warn("Chưa dọn được ảnh cũ của trang", { message: err?.message });
    }
  }
}

export const siteContentService = new SiteContentService();
