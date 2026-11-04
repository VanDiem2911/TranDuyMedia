import { Router } from "express";
import { productController } from "#controllers/product.controller.js";
import { requireAdmin } from "#middlewares/auth.js";
import { validate } from "#middlewares/validate.js";
import {
  createProductSchema,
  listProductsQuerySchema,
  pinProductSchema,
  slugCheckQuerySchema,
  productIdSchema,
  productSlugSchema,
  updateProductSchema,
} from "#validators/product.validator.js";

const router = Router();
const noStore = (_req, res, next) => (res.set("Cache-Control", "no-store"), next());

// Quản trị (đặt trước "/:slug" để không bị hiểu nhầm là slug)
router.get(
  "/manage",
  requireAdmin,
  noStore,
  validate(listProductsQuerySchema, "query"),
  productController.listAll,
);
// Kiểm tra đường dẫn còn trống (đặt trước "/manage/:id")
router.get(
  "/manage/slug-check",
  requireAdmin,
  noStore,
  validate(slugCheckQuerySchema, "query"),
  productController.checkSlug,
);
router.get(
  "/manage/:id",
  requireAdmin,
  noStore,
  validate(productIdSchema, "params"),
  productController.getById,
);
router.post("/", requireAdmin, noStore, validate(createProductSchema), productController.create);
router.patch(
  "/:id",
  requireAdmin,
  noStore,
  validate(productIdSchema, "params"),
  validate(updateProductSchema),
  productController.update,
);
router.delete(
  "/:id",
  requireAdmin,
  noStore,
  validate(productIdSchema, "params"),
  productController.remove,
);
// Ghim / bỏ ghim nổi bật (tối đa 5)
router.post(
  "/:id/pin",
  requireAdmin,
  noStore,
  validate(productIdSchema, "params"),
  validate(pinProductSchema),
  productController.setPinned,
);
// Hoàn tác xoá (xoá mềm)
router.post(
  "/:id/restore",
  requireAdmin,
  noStore,
  validate(productIdSchema, "params"),
  productController.restore,
);

// Công khai: chỉ sản phẩm đang hiển thị
router.get("/", productController.listPublic);
router.get("/:slug", validate(productSlugSchema, "params"), productController.getBySlug);

export default router;
