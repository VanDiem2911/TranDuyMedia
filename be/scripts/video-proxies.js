/**
 * Tạo bản xem trước nhẹ (480p) cho MỌI video sản phẩm đã có trên Cloudinary — để công cụ "Lấy khung hình
 * từ video" ở trang quản trị tua tức thì. Video tải lên sau này được tạo tự động (media.service.js).
 *   npm run media:proxies
 * Chạy lại nhiều lần không sao: Cloudinary bỏ qua bản đã có.
 */
import { cloudinary } from "#config/cloudinary.js";
import { connectDatabase, disconnectDatabase } from "#config/database.js";
import { Product } from "#models/product.model.js";
import { VIDEO_PROXY } from "#services/media.service.js";

await connectDatabase(undefined, { retries: 1 });
try {
  const products = await Product.find({ deletedAt: null }, { slug: 1, media: 1 }).lean();
  const ids = [
    ...new Set(
      products.flatMap((p) =>
        (p.media ?? []).filter((m) => m.type === "video" && m.publicId).map((m) => m.publicId),
      ),
    ),
  ];
  console.log(`${ids.length} video — tạo bản xem trước ${VIDEO_PROXY}`);
  for (const id of ids) {
    try {
      await cloudinary.uploader.explicit(id, {
        type: "upload",
        resource_type: "video",
        eager: [{ raw_transformation: VIDEO_PROXY, format: "mp4" }],
        eager_async: true,
      });
      console.log("✓", id);
    } catch (err) {
      console.log("✗", id, err?.message ?? err?.error?.message);
    }
  }
} finally {
  await disconnectDatabase();
}
process.exit(0);
