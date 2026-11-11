import mongoose from "mongoose";

/**
 * Nội dung chỉnh sửa được của các trang trên website. Mỗi trang = 1 bản ghi (key duy nhất) chứa cả cây nội dung;
 * trường nào chưa có thì website dùng nội dung mặc định có sẵn trong mã nguồn → chưa chỉnh gì thì trang vẫn
 * hiển thị đúng như cũ.
 *   about = Về chúng tôi · home = Trang chủ · services = Dịch vụ (danh sách) · service = Chi tiết 5 dịch vụ ·
 *   site = Chân trang & liên hệ ·
 *   products = phần giới thiệu đầu trang Sản phẩm
 */
export const CONTENT_KEYS = ["about", "home", "services", "service", "site", "products"];

const siteContentSchema = new mongoose.Schema(
  {
    key: { type: String, enum: CONTENT_KEYS, required: true, unique: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    updatedBy: { type: String, default: null },
  },
  { timestamps: true, versionKey: false, minimize: false },
);

export const SiteContent =
  mongoose.models.SiteContent ?? mongoose.model("SiteContent", siteContentSchema);
