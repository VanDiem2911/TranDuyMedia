import { randomBytes } from "node:crypto";
import { z } from "zod";

/**
 * Đọc & kiểm tra biến môi trường MỘT LẦN khi khởi động.
 * File .env được Node nạp sẵn qua cờ --env-file-if-exists (xem package.json) — không cần dotenv.
 * Thiếu / sai kiểu → dừng app ngay với thông báo rõ ràng (fail fast).
 * Key dịch vụ ngoài (MongoDB, Cloudinary) được để trống khi phát triển; bắt buộc ở production.
 */
const csv = (v) =>
  v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    HOST: z.string().default("0.0.0.0"),
    PORT: z.coerce.number().int().positive().default(4000),
    LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),

    // Origin được phép gọi API (frontend), phân tách bằng dấu phẩy
    CORS_ORIGINS: z.string().default("http://localhost:3000").transform(csv),

    // Giới hạn chung số request mỗi IP
    RATE_LIMIT_WINDOW_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(15 * 60 * 1000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(1000),

    // Số proxy tin cậy đứng trước API (Next.js rewrite = 1). Chỉ tin header X-Forwarded-For từ
    // đúng số proxy này → client không giả IP để né rate limit. API đặt sau Nginx + Next.js → 2.
    TRUST_PROXY: z.coerce.number().int().min(0).default(1),

    // ---------- MongoDB ----------
    MONGODB_URI: z.string().default(""),
    MONGODB_DB_NAME: z.string().default("tranduymedia"),

    // ---------- Cloudinary (ảnh & video) ----------
    CLOUDINARY_CLOUD_NAME: z.string().default(""),
    CLOUDINARY_API_KEY: z.string().default(""),
    CLOUDINARY_API_SECRET: z.string().default(""),
    CLOUDINARY_FOLDER: z.string().default("tranduymedia"),

    // Giới hạn dung lượng upload (MB)
    UPLOAD_MAX_IMAGE_MB: z.coerce.number().positive().default(10),
    UPLOAD_MAX_VIDEO_MB: z.coerce.number().positive().default(100),

    // ---------- Xác thực (JWT trong cookie HttpOnly) ----------
    // Chuỗi ngẫu nhiên ≥ 32 ký tự, khác nhau cho access & refresh. Tạo: npm run secret
    JWT_ACCESS_SECRET: z.string().default(""),
    JWT_REFRESH_SECRET: z.string().default(""),
    JWT_ACCESS_TTL: z.string().default("15m"),
    // Thời hạn phiên khi CÓ chọn "Ghi nhớ đăng nhập" (cookie lưu lại, đóng trình duyệt vẫn còn đăng nhập)
    JWT_REFRESH_TTL: z.string().default("7d"),
    // Thời hạn phiên khi KHÔNG chọn "Ghi nhớ đăng nhập": cookie phiên (đóng trình duyệt là đăng xuất) và phía
    // máy chủ phiên cũng chỉ sống tối đa chừng này kể từ lần dùng cuối (phòng trình duyệt khôi phục phiên cũ)
    SESSION_TTL: z.string().default("12h"),
    // Số phiên đăng nhập đồng thời tối đa (thiết bị); vượt quá → phiên cũ nhất bị đăng xuất
    MAX_SESSIONS: z.coerce.number().int().min(1).default(5),
    // Cookie Secure: mặc định bật ở production (bắt buộc HTTPS)
    COOKIE_SECURE: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === "true")),

    // ---------- Tài khoản quản trị (đăng nhập /login) ----------
    ADMIN_ID: z.string().trim().default(""),
    ADMIN_PASSWORD: z.string().default(""),
    ADMIN_NAME: z.string().default("Quản trị viên"),
  })
  .superRefine((v, ctx) => {
    if (v.NODE_ENV !== "production") return;
    for (const key of ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"]) {
      if (v[key].length < 32)
        ctx.addIssue({ code: "custom", path: [key], message: "Cần chuỗi ngẫu nhiên ≥ 32 ký tự" });
    }
    if (v.JWT_ACCESS_SECRET && v.JWT_ACCESS_SECRET === v.JWT_REFRESH_SECRET)
      ctx.addIssue({
        code: "custom",
        path: ["JWT_REFRESH_SECRET"],
        message: "Phải khác JWT_ACCESS_SECRET",
      });
    if (v.ADMIN_PASSWORD && v.ADMIN_PASSWORD.length < 12)
      ctx.addIssue({ code: "custom", path: ["ADMIN_PASSWORD"], message: "Cần ≥ 12 ký tự" });
    for (const key of [
      "ADMIN_ID",
      "ADMIN_PASSWORD",
      "MONGODB_URI",
      "CLOUDINARY_CLOUD_NAME",
      "CLOUDINARY_API_KEY",
      "CLOUDINARY_API_SECRET",
    ]) {
      if (!v[key]) ctx.addIssue({ code: "custom", path: [key], message: "Bắt buộc ở production" });
    }
  });

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Biến môi trường không hợp lệ:");
  for (const issue of parsed.error.issues)
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  process.exit(1);
}

const d = parsed.data;

// Khi phát triển mà chưa đặt secret: tạo ngẫu nhiên mỗi lần chạy (đăng nhập lại sau khi restart).
// Production bắt buộc đặt (đã kiểm tra ở trên).
const ephemeral = [];
for (const key of ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"]) {
  if (!d[key]) {
    d[key] = randomBytes(48).toString("base64url");
    ephemeral.push(key);
  }
}

export const env = Object.freeze({
  ...d,
  isProd: d.NODE_ENV === "production",
  isTest: d.NODE_ENV === "test",
  cookieSecure: d.COOKIE_SECURE ?? d.NODE_ENV === "production",
  ephemeralSecrets: ephemeral,
  hasCloudinary: Boolean(
    d.CLOUDINARY_CLOUD_NAME && d.CLOUDINARY_API_KEY && d.CLOUDINARY_API_SECRET,
  ),
});
