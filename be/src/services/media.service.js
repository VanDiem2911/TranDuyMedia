import { cloudinary } from "#config/cloudinary.js";
import { env } from "#config/env.js";
import { logger } from "#config/logger.js";
import { mediaRepository } from "#repositories/media.repository.js";
import { ApiError } from "#utils/api-error.js";
import { downloadRemoteFile } from "#utils/remote-file.js";

/**
 * TẦNG SERVICE — ảnh & video. Upload lên Cloudinary rồi lưu metadata vào MongoDB (qua repository).
 * Nếu lưu DB thất bại sau khi upload → xoá file vừa upload trên Cloudinary để không bị "rác".
 */

/** Định dạng được phép khi trình duyệt tải thẳng lên Cloudinary. */
export const ALLOWED_FORMATS = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "avif",
  "gif",
  "mp4",
  "mov",
  "webm",
  "m4v",
];

/**
 * Bản xem trước NHẸ của video (480p, chất lượng thấp, vài MB) — trang quản trị dùng để tua chọn khung hình
 * tức thì thay vì tải video gốc hàng chục MB. Cloudinary tạo sẵn ngay sau khi tải lên (eager, chạy nền).
 * PHẢI khớp VIDEO_PROXY ở fe/src/components/admin/products/media-utils.js.
 */
export const VIDEO_PROXY = "c_limit,q_auto:low,w_480";

export class MediaService {
  constructor(repo = mediaRepository, storage = cloudinary) {
    this.repo = repo;
    this.storage = storage;
  }

  /** Lỗi Cloudinary → thông báo dễ hiểu (key thiếu quyền, hết dung lượng…). */
  static explain(err, fallback) {
    const msg = String(err?.message ?? err?.error?.message ?? "");
    if (/missing permissions/i.test(msg) || err?.http_code === 403) {
      return ApiError.serviceUnavailable(
        "Tài khoản Cloudinary chưa cho phép tải tệp lên. Vui lòng dùng API key có quyền upload.",
        { code: "CLOUDINARY_FORBIDDEN" },
      );
    }
    if (/file size too large/i.test(msg))
      return ApiError.payloadTooLarge("Tệp vượt quá dung lượng Cloudinary cho phép");
    return ApiError.serviceUnavailable(fallback);
  }

  #ensureConfigured() {
    if (!env.hasCloudinary) {
      throw ApiError.serviceUnavailable(
        "Hệ thống lưu trữ ảnh / video chưa được thiết lập. Vui lòng liên hệ kỹ thuật.",
        { code: "STORAGE_NOT_CONFIGURED" },
      );
    }
  }

  /** Đẩy buffer lên Cloudinary qua stream (không ghi file tạm). Video lớn → upload theo từng phần 20MB. */
  #uploadBuffer(buffer, options) {
    // Ảnh lưu NGUYÊN BẢN GỐC (không nén lại khi tải lên) → website tự thu nhỏ & chuyển WebP từ bản gốc
    // đúng 1 lần cho từng kích thước hiển thị, giữ tối đa chi tiết.
    return new Promise((resolve, reject) => {
      const done = (err, result) => (err ? reject(err) : resolve(result));
      const chunked = options.resource_type === "video" && buffer.length > 20 * 1024 * 1024;
      const stream = chunked
        ? this.storage.uploader.upload_chunked_stream({ ...options, chunk_size: 20_000_000 }, done)
        : this.storage.uploader.upload_stream(options, done);
      stream.end(buffer);
    });
  }

  /**
   * public_id của một tệp GỐC trên kho Cloudinary của website (bỏ qua link ngoài, link YouTube / Drive,
   * link có biến đổi kiểu so_auto…) → null nếu không phải tệp của website.
   */
  static publicIdOf(url) {
    if (typeof url !== "string" || !env.CLOUDINARY_CLOUD_NAME) return null;
    const m = url.match(
      new RegExp(
        `^https://res\\.cloudinary\\.com/${env.CLOUDINARY_CLOUD_NAME}/(?:image|video)/upload/(?:v\\d+/)?(.+?)\\.[a-z0-9]+(?:\\?.*)?$`,
        "i",
      ),
    );
    const id = m?.[1];
    return id && id.startsWith(`${env.CLOUDINARY_FOLDER}/`) ? id : null;
  }

  /**
   * Xoá hẳn các tệp KHÔNG CÒN DÙNG khỏi Cloudinary + bản ghi media tương ứng (chạy nền, lỗi chỉ ghi log).
   * assets: Map<public_id, "image" | "video">
   */
  async purge(assets) {
    if (!env.hasCloudinary || !assets.size) return;
    try {
      for (const type of ["image", "video"]) {
        const ids = [...assets].filter(([, t]) => t === type).map(([id]) => id);
        for (let i = 0; i < ids.length; i += 100)
          await this.storage.api.delete_resources(ids.slice(i, i + 100), {
            resource_type: type,
            invalidate: true,
          });
      }
      await this.repo.model.deleteMany({ publicId: { $in: [...assets.keys()] } });
      logger.info("Đã xoá tệp không còn dùng", { count: assets.size });
    } catch (err) {
      logger.warn("Chưa xoá được tệp không còn dùng", {
        message: err?.message ?? err?.error?.message,
      });
    }
  }

  /** Yêu cầu Cloudinary tạo sẵn bản xem trước nhẹ cho video (chạy nền, lỗi không ảnh hưởng việc lưu). */
  makeVideoProxy(publicId) {
    return this.storage.uploader
      .explicit(publicId, {
        type: "upload",
        resource_type: "video",
        eager: [{ raw_transformation: VIDEO_PROXY, format: "mp4" }],
        eager_async: true,
      })
      .catch((err) =>
        logger.warn("Chưa tạo được bản xem trước video", { publicId, message: err?.message }),
      );
  }

  /** Ảnh đại diện của video Cloudinary: khung hình đẹp nhất, định dạng WebP. */
  static posterOf(result) {
    if (result.resource_type !== "video") return null;
    return (
      result.secure_url
        // so_auto: Cloudinary tự chọn khung hình đẹp nhất (tránh khung đen ở đầu video)
        .replace("/upload/", "/upload/so_auto,q_auto/")
        .replace(/\.[a-z0-9]+$/i, ".webp")
    );
  }

  #record(result, { target, alt = "", tags = [] }) {
    if (result.resource_type === "video") this.makeVideoProxy(result.public_id);
    return this.repo.create({
      publicId: result.public_id,
      type: result.resource_type === "video" ? "video" : "image",
      url: result.secure_url,
      poster: MediaService.posterOf(result),
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      duration: result.duration,
      folder: target,
      alt,
      tags,
    });
  }

  /**
   * Thêm tệp từ link:
   * - YouTube / Vimeo → trả về dạng nhúng (không tải về).
   * - Link ảnh / video trực tiếp → máy chủ tải về (như trình duyệt) rồi lưu lên Cloudinary như tệp upload.
   */
  async importFromUrl(url, { folder = "" } = {}) {
    const embed = MediaService.parseEmbed(url);
    if (embed) return embed;
    this.#ensureConfigured();
    const target = [env.CLOUDINARY_FOLDER, folder].filter(Boolean).join("/");

    // Máy chủ tự tải tệp về (giả lập trình duyệt) rồi đẩy lên Cloudinary như tệp upload thường —
    // nhiều trang chặn máy chủ của Cloudinary tải trực tiếp, hoặc link không có đuôi .jpg/.mp4.
    let file;
    try {
      file = await downloadRemoteFile(url, {
        maxImageMb: env.UPLOAD_MAX_IMAGE_MB,
        maxVideoMb: env.UPLOAD_MAX_VIDEO_MB,
      });
    } catch (err) {
      logger.warn("Không tải được tệp từ link", { url, message: err.message });
      throw err;
    }

    let result;
    try {
      result = await this.#uploadBuffer(file.buffer, { folder: target, resource_type: file.kind });
    } catch (err) {
      logger.warn("Cloudinary từ chối tệp tải từ link", { url, message: err?.message });
      if (/invalid image|unsupported|not a valid/i.test(String(err?.message))) {
        throw ApiError.badRequest("Tệp ở link này bị hỏng hoặc định dạng chưa được hỗ trợ.", {
          code: "IMPORT_FAILED",
        });
      }
      throw MediaService.explain(err, "Chưa lưu được tệp lên kho lưu trữ, vui lòng thử lại.");
    }
    return this.#record(result, { target });
  }

  /** YouTube / Vimeo / Google Drive → { type: "embed", url (link nhúng), poster } */
  static parseEmbed(raw) {
    let u;
    try {
      u = new URL(raw);
    } catch {
      return null;
    }
    const host = u.hostname.replace(/^www\.|^m\./, "");
    let id = null;
    if (host === "youtu.be") id = u.pathname.slice(1);
    else if (host === "youtube.com" || host === "youtube-nocookie.com")
      id =
        u.searchParams.get("v") || u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{6,})/)?.[1];
    if (id && /^[\w-]{6,20}$/.test(id)) {
      return {
        type: "embed",
        url: `https://www.youtube-nocookie.com/embed/${id}`,
        poster: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
        publicId: null,
      };
    }
    // Google Drive (đã mở quyền xem) → khung nhúng: video nặng không cần tải lên kho lưu trữ
    const drive =
      host === "drive.google.com"
        ? (u.pathname.match(/\/file\/d\/([\w-]{20,})/)?.[1] ?? u.searchParams.get("id"))
        : null;
    if (drive && /^[\w-]{20,}$/.test(drive)) {
      return {
        type: "embed",
        url: `https://drive.google.com/file/d/${drive}/preview`,
        poster: `https://drive.google.com/thumbnail?id=${drive}&sz=w1600`,
        publicId: null,
      };
    }
    const vimeo =
      host === "vimeo.com" || host === "player.vimeo.com"
        ? u.pathname.match(/(\d{6,})/)?.[1]
        : null;
    if (vimeo) {
      return {
        type: "embed",
        url: `https://player.vimeo.com/video/${vimeo}`,
        poster: null,
        publicId: null,
      };
    }
    return null;
  }

  async upload(file, { folder = "", alt = "", tags = [] } = {}) {
    this.#ensureConfigured();
    const target = [env.CLOUDINARY_FOLDER, folder].filter(Boolean).join("/");

    let result;
    try {
      result = await this.#uploadBuffer(file.buffer, {
        folder: target,
        resource_type: file.kind, // "image" | "video"
        use_filename: true,
        unique_filename: true,
        tags,
      });
    } catch (err) {
      logger.error("Upload Cloudinary thất bại", { message: err.message });
      throw MediaService.explain(err, "Không tải được tệp lên, vui lòng thử lại.");
    }

    try {
      return await this.#record(result, { target, alt, tags });
    } catch (err) {
      await this.storage.uploader
        .destroy(result.public_id, { resource_type: file.kind })
        .catch(() => {});
      throw err;
    }
  }

  /**
   * TẢI THẲNG LÊN CLOUDINARY (nhanh gấp đôi, có % tiến độ thật): trình duyệt gửi tệp trực tiếp tới Cloudinary
   * thay vì qua máy chủ này rồi mới chuyển tiếp. Máy chủ chỉ KÝ yêu cầu — API secret không rời backend,
   * chữ ký chỉ hợp lệ cho đúng thư mục + thời điểm này (Cloudinary từ chối chữ ký cũ hơn 1 giờ).
   */
  signUpload({ folder = "" } = {}) {
    this.#ensureConfigured();
    const params = {
      folder: [env.CLOUDINARY_FOLDER, folder].filter(Boolean).join("/"),
      timestamp: Math.round(Date.now() / 1000),
      unique_filename: true,
      use_filename: true,
      // Chữ ký chỉ dùng được cho ảnh / video (không cho tải HTML, SVG, tệp tuỳ ý bằng chữ ký này)
      allowed_formats: ALLOWED_FORMATS.join(","),
    };
    return {
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      apiKey: env.CLOUDINARY_API_KEY,
      params,
      signature: this.storage.utils.api_sign_request(params, env.CLOUDINARY_API_SECRET),
      chunkSize: 20 * 1024 * 1024,
    };
  }

  /**
   * Ghi nhận tệp trình duyệt vừa tải thẳng lên Cloudinary. Kiểm tra chữ ký Cloudinary trả về
   * (public_id + version ký bằng API secret) → không thể "khai" một tệp không do hệ thống này tải lên.
   */
  async confirmUpload(r) {
    this.#ensureConfigured();
    if (!this.storage.utils.verify_api_response_signature(r.public_id, r.version, r.signature)) {
      throw ApiError.badRequest("Không xác thực được tệp vừa tải lên, vui lòng thử lại.", {
        code: "INVALID_UPLOAD",
      });
    }
    const target = r.public_id.split("/").slice(0, -1).join("/");
    if (!(target + "/").startsWith(env.CLOUDINARY_FOLDER + "/")) {
      throw ApiError.badRequest("Tệp không thuộc kho lưu trữ của website.", {
        code: "INVALID_UPLOAD",
      });
    }
    // Link tự dựng từ public_id + version (đã được Cloudinary ký) — không dùng link do trình duyệt gửi lên
    const secure_url = this.storage.url(r.public_id, {
      resource_type: r.resource_type,
      type: "upload",
      version: r.version,
      format: r.format,
      secure: true,
      urlAnalytics: false, // không gắn "?_a=…" vào cuối link
    });
    const limit = r.resource_type === "video" ? env.UPLOAD_MAX_VIDEO_MB : env.UPLOAD_MAX_IMAGE_MB;
    if (r.bytes > limit * 1024 * 1024) {
      throw ApiError.payloadTooLarge(`Tệp vượt quá ${limit}MB`);
    }
    return this.#record({ ...r, secure_url }, { target });
  }

  list({ type, folder, tag, page, limit }) {
    const filter = {};
    if (type) filter.type = type;
    if (folder) filter.folder = folder;
    if (tag) filter.tags = tag;
    return this.repo.findAll({ filter, page, limit });
  }

  async getById(id) {
    const media = await this.repo.findById(id);
    if (!media) throw ApiError.notFound("Không tìm thấy file");
    return media;
  }

  async update(id, patch) {
    const media = await this.repo.update(id, patch);
    if (!media) throw ApiError.notFound("Không tìm thấy file");
    return media;
  }

  /** Xoá trên Cloudinary trước, thành công mới xoá metadata trong DB. */
  async remove(id) {
    this.#ensureConfigured();
    const media = await this.getById(id);
    const res = await this.storage.uploader.destroy(media.publicId, {
      resource_type: media.type,
      invalidate: true,
    });
    if (res.result !== "ok" && res.result !== "not found") {
      throw ApiError.serviceUnavailable("Không xoá được file trên Cloudinary");
    }
    await this.repo.delete(id);
  }
}

export const mediaService = new MediaService();
