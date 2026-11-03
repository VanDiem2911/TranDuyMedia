import { z } from "zod";
import { BOOKING_STATUSES as STATUSES } from "#models/booking.model.js";
import { objectId } from "#validators/common.validator.js";

// Khớp với các lựa chọn trong form ở frontend (slug trong fe/src/data/services.js — 5 dịch vụ từ 11/2026)
export const SERVICES = [
  "san-xuat-video-short",
  "san-xuat-itvc-viral",
  "phim-doanh-nghiep-su-kien",
  "chup-anh-quang-cao",
  "cho-thue-studio",
];
export const BUDGETS = ["Dưới 20 triệu", "20 – 50 triệu", "50 – 100 triệu", "Trên 100 triệu"];
export { STATUSES };

// Cùng quy tắc với frontend (fe/src/lib/validate-booking.js)
const vnPhone = z
  .string({ error: "Vui lòng nhập số điện thoại" })
  .trim()
  .min(1, "Vui lòng nhập số điện thoại")
  .transform((v) => v.replace(/[\s.()-]/g, "").replace(/^\+?84(?=\d{9,10}$)/, "0"))
  .pipe(z.string().regex(/^(0[35789]\d{8}|02\d{9})$/, "Số điện thoại chưa đúng định dạng"));

const personName = z
  .string({ error: "Vui lòng nhập họ và tên" })
  // NFC: gộp chữ + dấu tách rời (vd. "a" + "̣") thành một ký tự — bộ gõ / hệ điều hành có thể gửi dạng tách
  .transform((v) => v.normalize("NFC").replace(/\s+/g, " ").trim())
  .pipe(
    z
      .string()
      .min(1, "Vui lòng nhập họ và tên")
      .min(2, "Họ và tên quá ngắn")
      .max(60, "Họ và tên tối đa 60 ký tự")
      .regex(/^[\p{L}\p{M}\s'.-]+$/u, "Chỉ nhập chữ cái và khoảng trắng")
      .regex(/\p{L}/u, "Chỉ nhập chữ cái và khoảng trắng"),
  );

/** Body gửi từ form đặt lịch — các field tuỳ chọn để trống ("") được coi như không có. */
export const createBookingSchema = z.object({
  name: personName,
  phone: vnPhone,
  service: z
    .enum(SERVICES, "Dịch vụ không hợp lệ")
    .or(z.literal(""))
    .optional()
    .transform((v) => v || null),
  date: z.iso
    .date("Ngày không hợp lệ")
    .or(z.literal(""))
    .optional()
    .transform((v) => v || null),
  budget: z
    .enum(BUDGETS, "Ngân sách không hợp lệ")
    .or(z.literal(""))
    .optional()
    .transform((v) => v || null),
  note: z.string().trim().max(2000, "Mô tả tối đa 2000 ký tự").optional().default(""),
  // Bẫy bot (honeypot): ô ẩn với người dùng thật — bot tự điền → yêu cầu bị bỏ qua âm thầm
  website: z.string().max(200).optional().default(""),
});

export const bookingIdSchema = z.object({ id: objectId });

export const updateBookingStatusSchema = z.object({ status: z.enum(STATUSES) });

export const listBookingsQuerySchema = z.object({
  status: z.enum(STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
