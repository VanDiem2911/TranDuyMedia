import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import { credentialFingerprint } from "#config/admin.js";
import { env } from "#config/env.js";
import { toMs } from "#utils/duration.js";

/**
 * Ký / kiểm tra JWT.
 * - Access token (ngắn hạn, mặc định 15 phút): mang sub (userId) + role, dùng cho mọi request.
 * - Refresh token (dài hạn, mặc định 7 ngày): mang sid (id phiên) + jti ngẫu nhiên; khớp với
 *   SHA-256 lưu trong DB nên có thể thu hồi bất cứ lúc nào.
 * Hai loại dùng 2 secret khác nhau + kiểm tra `typ`, issuer, audience → không dùng lẫn được.
 */
const ISSUER = "tranduymedia-api";
const AUDIENCE = "tranduymedia-web";
const ALG = "HS256";

export const ACCESS_TTL_MS = toMs(env.JWT_ACCESS_TTL);
export const REFRESH_TTL_MS = toMs(env.JWT_REFRESH_TTL);
/** Thời hạn phiên khi không chọn "Ghi nhớ đăng nhập" (không dài hơn phiên ghi nhớ). */
export const SESSION_TTL_MS = Math.min(toMs(env.SESSION_TTL), REFRESH_TTL_MS);
/** Thời hạn của một phiên theo lựa chọn "Ghi nhớ đăng nhập". */
export const sessionTtl = (remember) => (remember ? REFRESH_TTL_MS : SESSION_TTL_MS);

export const sha256 = (value) => createHash("sha256").update(value).digest("hex");

export function signAccessToken(user) {
  return jwt.sign(
    { typ: "access", role: user.role, cv: credentialFingerprint() },
    env.JWT_ACCESS_SECRET,
    {
      algorithm: ALG,
      subject: user.id,
      issuer: ISSUER,
      audience: AUDIENCE,
      expiresIn: Math.floor(ACCESS_TTL_MS / 1000),
    },
  );
}

export function signRefreshToken(sessionId, userId, ttlMs = REFRESH_TTL_MS) {
  return jwt.sign({ typ: "refresh", sid: sessionId }, env.JWT_REFRESH_SECRET, {
    algorithm: ALG,
    subject: userId,
    issuer: ISSUER,
    audience: AUDIENCE,
    jwtid: randomBytes(16).toString("hex"),
    expiresIn: Math.floor(ttlMs / 1000),
  });
}

const verify = (token, secret, typ) => {
  try {
    const payload = jwt.verify(token, secret, {
      algorithms: [ALG],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return payload.typ === typ ? payload : null;
  } catch {
    return null; // hết hạn / sai chữ ký / sai định dạng
  }
};

/** Access token chỉ hợp lệ khi ID / mật khẩu admin chưa đổi kể từ lúc cấp. */
export const verifyAccessToken = (token) => {
  const p = verify(token, env.JWT_ACCESS_SECRET, "access");
  return p && p.cv === credentialFingerprint() ? p : null;
};
export const verifyRefreshToken = (token) => verify(token, env.JWT_REFRESH_SECRET, "refresh");
