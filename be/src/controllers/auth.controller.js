import { authService } from "#services/auth.service.js";
import { clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from "#utils/auth-cookies.js";
import { ok } from "#utils/response.js";

const meta = (req) => ({ ip: req.ip, userAgent: req.get("user-agent") });

/** TẦNG CONTROLLER — xác thực. Token chỉ nằm trong cookie HttpOnly, KHÔNG trả trong body. */
export const authController = {
  async login(req, res) {
    const { user, accessToken, refreshToken, remember } = await authService.login(
      req.validated.body,
      meta(req),
    );
    setAuthCookies(res, { accessToken, refreshToken, remember });
    ok(res, { user });
  },

  async refresh(req, res) {
    try {
      const { user, accessToken, refreshToken, remember } = await authService.refresh(
        req.cookies?.[REFRESH_COOKIE],
        meta(req),
      );
      setAuthCookies(res, { accessToken, refreshToken, remember });
      ok(res, { user });
    } catch (err) {
      clearAuthCookies(res);
      throw err;
    }
  },

  /**
   * Khôi phục phiên khi điều hướng trang (GET, do Next.js proxy chuyển tới khi access token hết hạn):
   * xoay vòng refresh token rồi chuyển hướng về trang cũ. Thất bại → xoá cookie, về trang cũ
   * (proxy sẽ hiện 403). `next` chỉ nhận đường dẫn nội bộ → không bị lợi dụng chuyển hướng ra ngoài.
   */
  async resume(req, res) {
    const raw = String(req.query.next ?? "/admin");
    const next =
      raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\") ? raw : "/admin";
    try {
      const tokens = await authService.refresh(req.cookies?.[REFRESH_COOKIE], meta(req));
      setAuthCookies(res, tokens);
    } catch {
      clearAuthCookies(res);
    }
    res.redirect(303, next);
  },

  async logout(req, res) {
    await authService.logout(req.cookies?.[REFRESH_COOKIE]);
    clearAuthCookies(res);
    res.status(204).end();
  },

  async me(req, res) {
    ok(res, { user: await authService.me(req.user.id) });
  },
};
