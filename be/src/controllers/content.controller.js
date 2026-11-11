import { siteContentService } from "#services/site-content.service.js";
import { ok } from "#utils/response.js";

/** TẦNG CONTROLLER — nội dung các trang chỉnh được từ trang quản trị (key = about | home | services | site | products). */
export const contentController = {
  async get(req, res) {
    ok(res, await siteContentService.get(req.validated.params.key));
  },

  async save(req, res) {
    ok(
      res,
      await siteContentService.save(req.validated.params.key, req.validated.body, req.user.id),
    );
  },

  async reset(req, res) {
    await siteContentService.reset(req.validated.params.key);
    res.status(204).end();
  },
};
