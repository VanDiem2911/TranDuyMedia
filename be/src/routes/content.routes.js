import { Router } from "express";
import { contentController } from "#controllers/content.controller.js";
import { requireAdmin } from "#middlewares/auth.js";
import { validate } from "#middlewares/validate.js";
import { aboutSchema } from "#validators/content.validator.js";

const router = Router();
const noStore = (_req, res, next) => (res.set("Cache-Control", "no-store"), next());

// Trang "Về chúng tôi". Công khai: website đọc nội dung đã chỉnh (null = dùng nội dung mặc định).
// Website tự cache theo thẻ (revalidate khi quản trị bấm Lưu) nên backend không cache thêm lớp nào.
router.get("/about", noStore, contentController.getAbout);
// Quản trị: lưu toàn bộ nội dung / khôi phục mặc định
router.patch("/about", requireAdmin, noStore, validate(aboutSchema), contentController.saveAbout);
router.delete("/about", requireAdmin, noStore, contentController.resetAbout);

export default router;
