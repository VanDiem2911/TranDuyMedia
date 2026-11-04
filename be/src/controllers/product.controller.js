import { productService } from "#services/product.service.js";
import { created, ok } from "#utils/response.js";

/** Dữ liệu công khai: bỏ trường nội bộ. */
const toPublic = ({ deletedAt: _d, deletedBy: _b, ...p }) => p;

export const productController = {
  // ---- Công khai (website) ----
  async listPublic(_req, res) {
    const { items } = await productService.listPublic();
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    ok(res, items.map(toPublic));
  },

  async getBySlug(req, res) {
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    ok(res, toPublic(await productService.getPublicBySlug(req.validated.params.slug)));
  },

  // ---- Quản trị ----
  async listAll(req, res) {
    const { items, total } = await productService.listAll(req.validated.query);
    ok(res, items.map(toPublic), { total });
  },

  async getById(req, res) {
    ok(res, toPublic(await productService.getById(req.validated.params.id)));
  },

  async create(req, res) {
    created(res, toPublic(await productService.create(req.validated.body)));
  },

  async update(req, res) {
    ok(res, toPublic(await productService.update(req.validated.params.id, req.validated.body)));
  },

  async remove(req, res) {
    await productService.remove(req.validated.params.id, req.user.id);
    res.status(204).end();
  },

  async checkSlug(req, res) {
    const { slug, exceptId } = req.validated.query;
    ok(res, await productService.checkSlug(slug, exceptId));
  },

  async setPinned(req, res) {
    ok(
      res,
      toPublic(await productService.setPinned(req.validated.params.id, req.validated.body.pinned)),
    );
  },

  async restore(req, res) {
    ok(res, toPublic(await productService.restore(req.validated.params.id, req.user.id)));
  },
};
