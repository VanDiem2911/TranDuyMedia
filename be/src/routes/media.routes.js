import { Router } from "express";
import { mediaController } from "#controllers/media.controller.js";
import { requireAdmin } from "#middlewares/auth.js";
import { uploadSingle } from "#middlewares/upload.js";
import { validate } from "#middlewares/validate.js";
import { idParamSchema } from "#validators/common.validator.js";
import { importMediaSchema } from "#validators/product.validator.js";
import {
  confirmUploadSchema,
  listMediaQuerySchema,
  signUploadSchema,
  updateMediaSchema,
  uploadMediaSchema,
} from "#validators/media.validator.js";

const router = Router();

// Đọc: công khai (website hiển thị ảnh/video). Ghi / sửa / xoá: bắt buộc admin
router.post(
  "/",
  requireAdmin,
  uploadSingle("file"),
  validate(uploadMediaSchema),
  mediaController.upload,
);
// Tải thẳng từ trình duyệt lên Cloudinary: xin chữ ký → (trình duyệt tải) → xác nhận kết quả
router.post("/sign", requireAdmin, validate(signUploadSchema), mediaController.signUpload);
router.post("/confirm", requireAdmin, validate(confirmUploadSchema), mediaController.confirmUpload);
router.post("/import", requireAdmin, validate(importMediaSchema), mediaController.importUrl);
router.get("/", validate(listMediaQuerySchema, "query"), mediaController.list);
router.get("/:id", validate(idParamSchema, "params"), mediaController.getById);
router.patch(
  "/:id",
  requireAdmin,
  validate(idParamSchema, "params"),
  validate(updateMediaSchema),
  mediaController.update,
);
router.delete("/:id", requireAdmin, validate(idParamSchema, "params"), mediaController.remove);

export default router;
