import { Router } from "express";
import { contentController } from "#controllers/content.controller.js";
import { requireAdmin } from "#middlewares/auth.js";
import { validate } from "#middlewares/validate.js";
import { SCHEMAS, contentKeySchema } from "#validators/content.validator.js";

const router = Router();
const noStore = (_req, res, next) => (res.set("Cache-Control", "no-store"), next());
const keyParam = validate(contentKeySchema, "params");
// Kiểm tra nội dung theo schema của đúng trang (key đã được kiểm tra ở bước trước)
const contentBodyFor = (req, res, next) =>
  validate(SCHEMAS[req.validated.params.key])(req, res, next);

// Công khai: website đọc nội dung đã chỉnh của từng trang (null = dùng nội dung mặc định).
// Website tự cache theo thẻ (revalidate khi quản trị bấm Lưu) nên backend không cache thêm lớp nào.
router.get("/:key", noStore, keyParam, contentController.get);
// Quản trị: lưu toàn bộ nội dung của trang / khôi phục mặc định
router.patch("/:key", requireAdmin, noStore, keyParam, contentBodyFor, contentController.save);
router.delete("/:key", requireAdmin, noStore, keyParam, contentController.reset);

export default router;
