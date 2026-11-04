import mongoose from "mongoose";
import {
  adminConfigured,
  adminUser,
  checkAdminCredentials,
  credentialFingerprint,
} from "#config/admin.js";
import { env } from "#config/env.js";
import { logger } from "#config/logger.js";
import { sessionRepository } from "#repositories/session.repository.js";
import {
  sessionTtl,
  sha256,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "#services/token.service.js";
import { ApiError } from "#utils/api-error.js";

const INVALID = () =>
  new ApiError(401, "ID hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.", {
    code: "INVALID_CREDENTIALS",
  });
const SESSION_EXPIRED = () =>
  new ApiError(401, "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại", {
    code: "SESSION_EXPIRED",
  });

/**
 * Cửa sổ ân hạn khi refresh token bị dùng lại NGAY sau khi xoay vòng (30 giây).
 * Trình duyệt thường gọi refresh từ nhiều nơi gần như đồng thời (nhiều tab, Next.js proxy khôi
 * phục phiên khi điều hướng + lời gọi API trong trang, hàng đợi tải tệp chạy nền) — các request
 * đó đều cầm token TRƯỚC khi bị xoay vòng một cách hợp lệ, không phải bị đánh cắp. Trong cửa sổ
 * này: cấp phiên mới thay vì thu hồi toàn bộ. Dùng lại SAU cửa sổ mới coi là bị đánh cắp.
 */
const REFRESH_REUSE_GRACE_MS = 30_000;

/**
 * TẦNG SERVICE — đăng nhập / làm mới phiên / đăng xuất cho tài khoản quản trị (cấu hình trong .env).
 * Phiên (refresh token) lưu MongoDB để thu hồi được, xoay vòng mỗi lần làm mới.
 */
export class AuthService {
  constructor(sessions = sessionRepository) {
    this.sessions = sessions;
  }

  /** Tạo phiên mới + cặp token. remember: "Ghi nhớ đăng nhập" (quyết định thời hạn phiên + kiểu cookie). */
  async #issue(user, meta, remember = true) {
    const sessionId = new mongoose.Types.ObjectId();
    const ttl = sessionTtl(remember);
    const refreshToken = signRefreshToken(String(sessionId), user.id, ttl);
    await this.sessions.create({
      _id: sessionId,
      user: user.id,
      credential: credentialFingerprint(),
      tokenHash: sha256(refreshToken),
      expiresAt: new Date(Date.now() + ttl),
      remember,
      userAgent: (meta.userAgent ?? "").slice(0, 300),
      ip: meta.ip ?? "",
    });
    return { accessToken: signAccessToken(user), refreshToken, sessionId, remember };
  }

  async login({ username, password, remember = false }, meta = {}) {
    if (!adminConfigured()) {
      logger.error("Chưa cấu hình ADMIN_ID / ADMIN_PASSWORD trong be/.env");
      throw ApiError.serviceUnavailable(
        "Tài khoản quản trị chưa được thiết lập. Vui lòng liên hệ kỹ thuật.",
        { code: "ADMIN_NOT_CONFIGURED" },
      );
    }
    if (!checkAdminCredentials(username, password)) {
      logger.warn("Đăng nhập thất bại", { username, ip: meta.ip });
      throw INVALID();
    }
    const user = adminUser();
    const tokens = await this.#issue(user, meta, remember);
    // Giới hạn số thiết bị đăng nhập cùng lúc
    const kicked = await this.sessions.revokeOldest(user.id, env.MAX_SESSIONS);
    logger.info("Đăng nhập thành công", { username, ip: meta.ip, remember, kicked });
    return { user, ...tokens };
  }

  /** Rotation: thu hồi refresh token cũ, cấp cặp token mới. */
  async refresh(refreshToken, meta = {}) {
    const payload = refreshToken && verifyRefreshToken(refreshToken);
    if (!payload || !adminConfigured()) throw SESSION_EXPIRED();

    const session = await this.sessions.findByTokenHash(sha256(refreshToken));
    if (!session || session.id !== payload.sid) throw SESSION_EXPIRED();

    // Phiên đã bị thu hồi do đăng xuất / vượt số thiết bị → chỉ đơn giản là hết hạn
    if (session.revokedAt && !session.replacedBy) throw SESSION_EXPIRED();

    // ID / mật khẩu trong .env đã đổi kể từ lúc đăng nhập → phiên không còn hợp lệ
    const user = adminUser();
    const credentialOk = session.user === user.id && session.credential === credentialFingerprint();

    if (session.revokedAt) {
      // Token ĐÃ ĐƯỢC XOAY VÒNG (có token mới thay thế) mà vẫn bị dùng lại.
      const rotatedAgoMs = Date.now() - new Date(session.revokedAt).getTime();
      if (credentialOk && rotatedAgoMs <= REFRESH_REUSE_GRACE_MS) {
        // Dùng lại ngay sau khi xoay vòng → nhiều khả năng là các request refresh chạy đồng
        // thời cầm cùng token cũ (nhiều tab / proxy + trang / tải tệp nền), không phải đánh
        // cắp: cấp một phiên mới độc lập, KHÔNG thu hồi phiên thay thế đang dùng tốt.
        logger.info("Refresh token dùng lại trong cửa sổ ân hạn — cấp phiên mới", {
          ip: meta.ip,
          rotatedAgoMs,
        });
        return { user, ...(await this.#issue(user, meta, session.remember ?? true)) };
      }
      // Ngoài cửa sổ ân hạn → có thể bị đánh cắp: huỷ mọi phiên của người dùng (mọi thiết bị)
      await this.sessions.revokeAllForUser(session.user);
      logger.warn("Phát hiện dùng lại refresh token — đã thu hồi toàn bộ phiên", { ip: meta.ip });
      throw SESSION_EXPIRED();
    }

    if (!credentialOk) {
      await this.sessions.revokeIfActive(session.id);
      throw SESSION_EXPIRED();
    }

    // Giữ nguyên lựa chọn "Ghi nhớ đăng nhập" của phiên khi xoay vòng token
    const next = await this.#issue(user, meta, session.remember ?? true);
    // Nguyên tử: chỉ một request được xoay vòng token này.
    if (!(await this.sessions.revokeIfActive(session.id, next.sessionId))) {
      // Request khác vừa xoay vòng XONG trong lúc request này đang xử lý (race đồng thời thật,
      // cả hai đều cầm token còn hiệu lực khi bắt đầu) → phiên vừa tạo vẫn hợp lệ, dùng luôn
      // thay vì báo hết phiên oan. Nếu phiên cũ bị thu hồi vì đăng xuất / vượt số thiết bị
      // (không có phiên thay thế) thì giữ nguyên hành vi hết phiên.
      const current = await this.sessions.findByTokenHash(sha256(refreshToken));
      if (current?.replacedBy) {
        logger.info("Hai request refresh đồng thời — chấp nhận cả hai phiên", { ip: meta.ip });
        return { user, ...next };
      }
      await this.sessions.revokeIfActive(String(next.sessionId));
      throw SESSION_EXPIRED();
    }
    return { user, ...next };
  }

  async logout(refreshToken) {
    if (!refreshToken) return;
    const session = await this.sessions.findByTokenHash(sha256(refreshToken));
    if (session) await this.sessions.revokeIfActive(session.id);
  }

  me(userId) {
    const user = adminUser();
    if (!adminConfigured() || userId !== user.id) throw SESSION_EXPIRED();
    return user;
  }
}

export const authService = new AuthService();
