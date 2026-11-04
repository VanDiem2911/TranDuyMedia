import { env } from "#config/env.js";
import { REFRESH_TTL_MS } from "#services/token.service.js";

/**
 * Cookie chứa token — JavaScript phía trình duyệt KHÔNG đọc được (HttpOnly) → chống XSS đánh cắp token.
 *
 * | Cờ            | Giá trị                         | Lý do                                                    |
 * | ------------- | ------------------------------- | -------------------------------------------------------- |
 * | HttpOnly      | true                            | Không cho JS đọc token                                   |
 * | Secure        | true ở production (HTTPS)       | Chỉ gửi qua kết nối mã hoá                               |
 * | SameSite      | Strict                          | Không gửi kèm request từ trang khác → chống CSRF         |
 * | Path          | access: /  · refresh: /api/v1/auth | Refresh token chỉ đi tới API xác thực, không lộ ở nơi khác |
 * | Prefix        | __Host- / __Secure- (production) | Trình duyệt bắt buộc Secure, cấm ghi đè từ subdomain   |
 *
 * Cookie thứ ba `tdm_session` chỉ là CỜ "đang có phiên" (giá trị "1", không chứa token) để Next.js
 * proxy biết nên thử khôi phục phiên (GET /auth/resume) hay hiện ngay trang 403.
 *
 * "Ghi nhớ đăng nhập": có → cookie lưu lại theo JWT_REFRESH_TTL (đóng trình duyệt vẫn còn đăng nhập);
 * không → cookie PHIÊN (không Max-Age), trình duyệt tự xoá khi đóng.
 *
 * Frontend gọi API qua cùng tên miền (Next.js rewrite /api → be) nên cookie là first-party.
 */
const prod = env.cookieSecure;

export const ACCESS_COOKIE = prod ? "__Host-tdm_at" : "tdm_at";
export const REFRESH_COOKIE = prod ? "__Secure-tdm_rt" : "tdm_rt";
export const REFRESH_PATH = "/api/v1/auth";
export const SESSION_HINT_COOKIE = prod ? "__Host-tdm_session" : "tdm_session";

const base = { httpOnly: true, secure: prod, sameSite: "strict" };

export function setAuthCookies(res, { accessToken, refreshToken, remember = true }) {
  // Cookie access sống bằng refresh token (bản thân JWT bên trong vẫn hết hạn sau 15 phút):
  // nếu cookie tự mất theo JWT, request sau đó không mang token → backend báo "chưa đăng nhập"
  // thay vì "token hết hạn" → frontend không biết để làm mới phiên → báo hết phiên oan.
  const life = remember ? { maxAge: REFRESH_TTL_MS } : {}; // không ghi nhớ → cookie phiên
  res.cookie(ACCESS_COOKIE, accessToken, { ...base, path: "/", ...life });
  res.cookie(REFRESH_COOKIE, refreshToken, { ...base, path: REFRESH_PATH, ...life });
  res.cookie(SESSION_HINT_COOKIE, "1", { ...base, path: "/", ...life });
}

export function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, { ...base, path: "/" });
  res.clearCookie(REFRESH_COOKIE, { ...base, path: REFRESH_PATH });
  res.clearCookie(SESSION_HINT_COOKIE, { ...base, path: "/" });
}
