import mongoose from "mongoose";

/** Trạng thái xử lý: Chưa giải quyết → Đang liên hệ → Đã giải quyết. */
export const BOOKING_STATUSES = ["pending", "contacting", "resolved"];

// Trạng thái của phiên bản cũ → trạng thái mới (chạy 1 lần khi khởi động, xem server.js)
export const LEGACY_STATUS_MAP = {
  new: "pending",
  contacted: "contacting",
  done: "resolved",
  cancelled: "resolved",
};

/** Yêu cầu đặt lịch tư vấn gửi từ form trên website. */
const bookingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, index: true },
    service: { type: String, default: null }, // slug dịch vụ (san-xuat-video-short…)
    date: { type: String, default: null }, // YYYY-MM-DD khách mong muốn
    budget: { type: String, default: null },
    note: { type: String, default: "", maxlength: 2000 },
    status: { type: String, enum: BOOKING_STATUSES, default: "pending", index: true },
    statusChangedAt: { type: Date, default: null },
    // Xoá mềm: bản ghi vẫn còn trong DB (khôi phục / đối soát được) nhưng ẩn khỏi mọi truy vấn
    deletedAt: { type: Date, default: null, index: true },
    deletedBy: { type: String, default: null },
  },
  { timestamps: true, versionKey: false },
);

bookingSchema.index({ createdAt: -1 });
bookingSchema.index({ status: 1, createdAt: -1 });

export const Booking = mongoose.models.Booking ?? mongoose.model("Booking", bookingSchema);
