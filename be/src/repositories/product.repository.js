import { Product } from "#models/product.model.js";
import { MongoRepository } from "#repositories/base.repository.js";
import { undoable } from "#utils/undo.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Sản phẩm ghim nổi bật đứng đầu (ghim sau → trước; chưa ghim = null nằm sau cùng khi sắp giảm dần),
// còn lại theo thứ tự quản trị rồi mới nhất trước
const SORT = { pinnedAt: -1, order: 1, createdAt: -1 };

/** Repository sản phẩm — mọi truy vấn bỏ qua bản ghi đã xoá mềm. */
export class ProductRepository extends MongoRepository {
  constructor() {
    super(Product);
  }

  list({ publishedOnly = false, q, page = 1, limit = 100 } = {}) {
    const filter = { deletedAt: null };
    if (publishedOnly) filter.published = true;
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ title: rx }, { category: rx }, { slug: rx }];
    }
    return this.findAll({ filter, sort: SORT, page, limit });
  }

  findBySlug(slug, { publishedOnly = false } = {}) {
    return this.findOne({ slug, deletedAt: null, ...(publishedOnly && { published: true }) });
  }

  findById(id) {
    return this.findOne({ _id: id, deletedAt: null });
  }

  /** Sản phẩm (chưa xoá) đang dùng đường dẫn này — để báo rõ tên trong thông báo trùng. */
  slugOwner(slug, exceptId) {
    return this.model
      .findOne(
        { slug, deletedAt: null, ...(exceptId && { _id: { $ne: exceptId } }) },
        { title: 1, slug: 1 },
      )
      .lean();
  }

  /** Các sản phẩm đang ghim nổi bật (chưa xoá), ghim gần nhất trước. */
  pinned(exceptId) {
    return this.model
      .find(
        { pinnedAt: { $ne: null }, deletedAt: null, ...(exceptId && { _id: { $ne: exceptId } }) },
        { title: 1, pinnedAt: 1 },
      )
      .sort({ pinnedAt: -1 })
      .lean();
  }

  async slugTaken(slug, exceptId) {
    const doc = await this.model
      .exists({ slug, deletedAt: null, ...(exceptId && { _id: { $ne: exceptId } }) })
      .lean();
    return Boolean(doc);
  }

  async update(id, patch) {
    const doc = await this.model
      .findOneAndUpdate({ _id: id, deletedAt: null }, patch, { new: true, runValidators: true })
      .lean();
    if (!doc) return null;
    const { _id, ...rest } = doc;
    return { id: String(_id), ...rest };
  }

  async softDelete(id, { by = null } = {}) {
    const res = await this.model.updateOne(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date(), deletedBy: by } },
    );
    return res.modifiedCount === 1;
  }

  /** Sản phẩm vừa bị xoá, còn trong thời gian cho phép hoàn tác. */
  findDeletedById(id) {
    return this.findOne({ _id: id, deletedAt: undoable() });
  }

  /** Khôi phục sản phẩm đã xoá mềm (patch: thay đổi kèm theo, vd. bỏ ghim khi đã đủ số ghim). */
  async restore(id, patch = {}) {
    const doc = await this.model
      .findOneAndUpdate(
        { _id: id, deletedAt: undoable() },
        { $set: { deletedAt: null, deletedBy: null, ...patch } },
        { new: true },
      )
      .lean();
    if (!doc) return null;
    const { _id, ...rest } = doc;
    return { id: String(_id), ...rest };
  }

  /** Thống kê cho trang Tổng quan: số sản phẩm (hiển thị / ẩn) + số ảnh, video trong thư viện. */
  async stats() {
    const [row] = await this.model.aggregate([
      { $match: { deletedAt: null } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          published: { $sum: { $cond: ["$published", 1, 0] } },
          images: {
            $sum: {
              $size: { $filter: { input: "$media", cond: { $eq: ["$$this.type", "image"] } } },
            },
          },
          videos: {
            $sum: {
              $size: { $filter: { input: "$media", cond: { $ne: ["$$this.type", "image"] } } },
            },
          },
        },
      },
    ]);
    const { total = 0, published = 0, images = 0, videos = 0 } = row ?? {};
    return { total, published, hidden: total - published, images, videos };
  }

  /** Sản phẩm vừa thêm / sửa gần nhất. */
  async recentlyUpdated(limit = 4) {
    const { items } = await this.findAll({
      filter: { deletedAt: null },
      sort: { updatedAt: -1 },
      limit,
    });
    return items;
  }

  async nextOrder() {
    const last = await this.model.findOne({ deletedAt: null }).sort({ order: -1 }).lean();
    return (last?.order ?? 0) + 1;
  }
}

export const productRepository = new ProductRepository();
