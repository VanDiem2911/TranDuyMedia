import { mediaService } from "#services/media.service.js";
import { created, ok } from "#utils/response.js";

/** TẦNG CONTROLLER — ảnh & video. Chỉ điều phối request → service → response. */
export const mediaController = {
  async upload(req, res) {
    created(res, await mediaService.upload(req.file, req.validated.body));
  },

  signUpload(req, res) {
    ok(res, mediaService.signUpload(req.validated.body));
  },

  async confirmUpload(req, res) {
    created(res, await mediaService.confirmUpload(req.validated.body));
  },

  async importUrl(req, res) {
    created(res, await mediaService.importFromUrl(req.validated.body.url, req.validated.body));
  },

  async list(req, res) {
    const { items, total, page, limit } = await mediaService.list(req.validated.query);
    ok(res, items, { total, page, limit, totalPages: Math.ceil(total / limit) });
  },

  async getById(req, res) {
    ok(res, await mediaService.getById(req.validated.params.id));
  },

  async update(req, res) {
    ok(res, await mediaService.update(req.validated.params.id, req.validated.body));
  },

  async remove(req, res) {
    await mediaService.remove(req.validated.params.id);
    res.status(204).end();
  },
};
