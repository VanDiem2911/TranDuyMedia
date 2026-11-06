import { siteContentService } from "#services/site-content.service.js";
import { ok } from "#utils/response.js";

const ABOUT = "about";

/** TẦNG CONTROLLER — nội dung trang tĩnh (hiện chỉ có trang Về chúng tôi). */
export const contentController = {
  async getAbout(_req, res) {
    ok(res, await siteContentService.get(ABOUT));
  },

  async saveAbout(req, res) {
    ok(res, await siteContentService.save(ABOUT, req.validated.body, req.user.id));
  },

  async resetAbout(_req, res) {
    await siteContentService.reset(ABOUT);
    res.status(204).end();
  },
};
