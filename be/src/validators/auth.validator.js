import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string({ error: "Vui lòng nhập ID đăng nhập" })
    .trim()
    .min(1, "Vui lòng nhập ID đăng nhập")
    .max(100),
  password: z.string({ error: "Vui lòng nhập mật khẩu" }).min(1, "Vui lòng nhập mật khẩu").max(200),
  // Ghi nhớ đăng nhập trên thiết bị này (mặc định: không — đóng trình duyệt là đăng xuất)
  remember: z.boolean().optional().default(false),
});
