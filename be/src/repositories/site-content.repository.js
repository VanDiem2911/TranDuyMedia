import { SiteContent } from "#models/site-content.model.js";
import { MongoRepository } from "#repositories/base.repository.js";

/** Repository nội dung trang tĩnh — mỗi trang một bản ghi theo `key`. */
export class SiteContentRepository extends MongoRepository {
  constructor() {
    super(SiteContent);
  }

  getByKey(key) {
    return this.findOne({ key });
  }

  /** Ghi đè toàn bộ nội dung của trang (tạo mới nếu chưa có). Trả về bản ghi sau khi lưu. */
  async upsert(key, data, updatedBy = null) {
    const doc = await this.model
      .findOneAndUpdate(
        { key },
        { $set: { data, updatedBy } },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
      )
      .lean();
    const { _id, ...rest } = doc;
    return { id: String(_id), ...rest };
  }

  /** Xoá nội dung đã chỉnh → trang quay về nội dung mặc định. Trả về bản ghi đã xoá (hoặc null). */
  async removeByKey(key) {
    const doc = await this.model.findOneAndDelete({ key }).lean();
    if (!doc) return null;
    const { _id, ...rest } = doc;
    return { id: String(_id), ...rest };
  }
}

export const siteContentRepository = new SiteContentRepository();
