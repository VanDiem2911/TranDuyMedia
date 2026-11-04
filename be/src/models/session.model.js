import mongoose from "mongoose";

/**
 * Phiên đăng nhập = một refresh token đang hiệu lực.
 * - Chỉ lưu SHA-256 của refresh token (lộ DB cũng không dùng được token).
 * - Mỗi lần refresh: phiên cũ bị thu hồi (revokedAt, replacedBy) và tạo phiên mới (rotation).
 * - Token đã thu hồi bị dùng lại SAU cửa sổ ân hạn 30s (xem REFRESH_REUSE_GRACE_MS ở
 *   auth.service) → coi như bị đánh cắp → thu hồi toàn bộ phiên của user. Trong cửa sổ ân hạn,
 *   việc dùng lại thường là các request refresh chạy đồng thời (nhiều tab / thiết bị) → cấp
 *   phiên mới thay vì huỷ oan phiên đang dùng tốt.
 * - MongoDB tự xoá phiên hết hạn nhờ TTL index trên expiresAt.
 */
const sessionSchema = new mongoose.Schema(
  {
    user: { type: String, required: true, index: true }, // ID đăng nhập của admin
    // "Dấu vân tay" của ID + mật khẩu lúc tạo phiên → đổi mật khẩu trong .env là mọi phiên cũ hết hiệu lực
    credential: { type: String, required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    userAgent: { type: String, default: "", maxlength: 300 },
    ip: { type: String, default: "" },
    // "Ghi nhớ đăng nhập": true → cookie lưu lại theo JWT_REFRESH_TTL; false → cookie phiên + SESSION_TTL.
    // Phiên tạo trước khi có lựa chọn này coi như đã ghi nhớ (không bị đăng xuất bất ngờ khi nâng cấp).
    remember: { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false },
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session = mongoose.models.Session ?? mongoose.model("Session", sessionSchema);
