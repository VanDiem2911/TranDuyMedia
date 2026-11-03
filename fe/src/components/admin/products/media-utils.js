/** Tiện ích cho trình quản lý ảnh / video của sản phẩm (phía trình duyệt). */
import { cdn } from "@/lib/cdn";

export const MAX_IMAGE_MB = 10;
// Khớp UPLOAD_MAX_VIDEO_MB ở backend và giới hạn gói Cloudinary (miễn phí: 100MB / video).
// Nâng gói Cloudinary → đặt NEXT_PUBLIC_UPLOAD_MAX_VIDEO_MB (fe) + UPLOAD_MAX_VIDEO_MB (be) cùng một số.
export const MAX_VIDEO_MB = Number(process.env.NEXT_PUBLIC_UPLOAD_MAX_VIDEO_MB) || 100;
export const MAX_FILES = 60; // khớp giới hạn của backend (product.validator.js)
export const ACCEPT =
  "image/jpeg,image/png,image/webp,image/avif,image/gif,video/mp4,video/quicktime,video/webm";

let seq = 0;
export const newKey = () => `m${Date.now().toString(36)}${(seq++).toString(36)}`;

/** "Bộ ảnh Giáng sinh!" → "bo-anh-giang-sinh" */
export const slugify = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);

/** YouTube / Vimeo / Google Drive → { type: "embed", url, poster } — hiển thị xem trước ngay khi dán link. */
export function parseEmbed(raw) {
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
    id = u.searchParams.get("v") || u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{6,})/)?.[1];
  if (id && /^[\w-]{6,20}$/.test(id)) {
    return {
      type: "embed",
      url: `https://www.youtube-nocookie.com/embed/${id}`,
      poster: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    };
  }
  // Google Drive (đã mở quyền "Bất kỳ ai có đường liên kết") → khung nhúng, không giới hạn dung lượng
  const drive =
    host === "drive.google.com"
      ? (u.pathname.match(/\/file\/d\/([\w-]{20,})/)?.[1] ?? u.searchParams.get("id"))
      : null;
  if (drive && /^[\w-]{20,}$/.test(drive)) {
    return {
      type: "embed",
      url: `https://drive.google.com/file/d/${drive}/preview`,
      poster: `https://drive.google.com/thumbnail?id=${drive}&sz=w1600`,
    };
  }
  const vimeo = /(^|\.)vimeo\.com$/.test(host) ? u.pathname.match(/(\d{6,})/)?.[1] : null;
  if (vimeo) return { type: "embed", url: `https://player.vimeo.com/video/${vimeo}`, poster: null };
  return null;
}

/**
 * Bản xem trước NHẸ (480p) của video trên Cloudinary — tạo sẵn khi tải lên (be: VIDEO_PROXY, phải khớp).
 * Dùng để tua chọn khung hình tức thì; khung hình được chọn vẫn chụp từ VIDEO GỐC (nét đủ độ phân giải).
 */
export const VIDEO_PROXY = "c_limit,q_auto:low,w_480";
export const proxyUrl = (url) =>
  /^https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\//.test(url ?? "")
    ? url
        .replace("/video/upload/", `/video/upload/${VIDEO_PROXY}/`)
        .replace(/\.[a-z0-9]+$/i, ".mp4")
    : null;

/** Các cảnh lấy tự động từ video: [ảnh đại diện, cảnh phụ 1, cảnh phụ 2] theo tỉ lệ thời lượng. */
export const FRAME_AT = [0.3, 0.55, 0.8];

/**
 * Chụp nhiều khung hình của MỘT video (mở video 1 lần, tua lần lượt) ở đúng độ phân giải gốc
 * → { blobs: [JPG...], width, height, duration } | null.
 * Khung đầu (≈30%, tối đa giây 15 — đầu video thường tối) làm ảnh đại diện; các khung sau là cảnh phụ cho
 * ảnh nổi bật / ảnh bìa ghép. Nét và chắc chắn có (ảnh tự tạo của Cloudinary hay lỗi với video nặng).
 */
export function captureFrames(url, { crossOrigin = false, at = FRAME_AT, exact = false } = {}) {
  return new Promise((resolve) => {
    let settled = false;
    const v = document.createElement("video");
    const blobs = [];
    const finish = (r) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      v.removeAttribute("src");
      v.load();
      resolve(r);
    };
    const timer = setTimeout(() => finish(blobs.length ? meta(blobs) : null), 45000);
    const meta = (list) => ({
      blobs: list,
      width: v.videoWidth,
      height: v.videoHeight,
      duration: v.duration,
    });
    const times = () =>
      at.map(
        (p, i) =>
          (i === 0 && !exact ? Math.min(Math.max(v.duration * p, 1), 15) : v.duration * p) || 0,
      );
    let k = 0;
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    if (crossOrigin) v.crossOrigin = "anonymous";
    v.onloadedmetadata = () => {
      v.currentTime = times()[0];
    };
    v.onseeked = () => {
      try {
        const c = document.createElement("canvas");
        c.width = v.videoWidth;
        c.height = v.videoHeight;
        c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
        c.toBlob(
          (blob) => {
            if (blob) blobs.push(blob);
            k += 1;
            if (k < at.length) v.currentTime = times()[k];
            else finish(blobs.length ? meta(blobs) : null);
          },
          "image/jpeg",
          0.92,
        );
      } catch {
        finish(null); // video khác tên miền không cho đọc điểm ảnh (CORS)
      }
    };
    v.onerror = () => finish(null);
    v.src = url;
  });
}

/** Đoán loại link trực tiếp theo đuôi file. */
export const guessLinkType = (url) =>
  /\.(mp4|mov|webm|m4v)(\?|#|$)/i.test(url) ? "video" : "image";

/** Tệp vượt dung lượng cho phép → { name, mb, kind, limit } (hiện hộp thoại gợi ý nén), ngược lại null. */
export function oversize(file) {
  const kind = file.type.startsWith("video/")
    ? "video"
    : file.type.startsWith("image/")
      ? "image"
      : null;
  if (!kind) return null;
  const limit = kind === "video" ? MAX_VIDEO_MB : MAX_IMAGE_MB;
  const mb = file.size / 1024 / 1024;
  return mb > limit ? { name: file.name, mb, kind, limit, file } : null;
}

/** Kiểm tra tệp chọn từ máy → null nếu hợp lệ, ngược lại là câu báo lỗi. */
export function checkFile(file) {
  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");
  if (!isVideo && !isImage) return `“${file.name}” không phải ảnh hoặc video.`;
  if (!ACCEPT.split(",").includes(file.type))
    return `Định dạng của “${file.name}” chưa được hỗ trợ.`;
  const mb = file.size / 1024 / 1024;
  if (isImage && mb > MAX_IMAGE_MB)
    return `“${file.name}” nặng ${mb.toFixed(1)}MB (ảnh tối đa ${MAX_IMAGE_MB}MB).`;
  if (isVideo && mb > MAX_VIDEO_MB)
    return `“${file.name}” nặng ${mb.toFixed(0)}MB (video tối đa ${MAX_VIDEO_MB}MB).`;
  return null;
}

/** Ảnh xem trước của một mục (tệp mới dùng object URL). */
/**
 * Ảnh xem trước của một mục (tệp mới dùng object URL). Mặc định bản thu nhỏ ~480px (ô thư viện, ô ảnh
 * đại diện / nổi bật, popup chọn ảnh) — đủ nét màn hình Retina, nhẹ hơn ảnh gốc hàng chục lần.
 * width = 0 → ảnh gốc chất lượng cao (khung cắt ảnh).
 */
export const previewOf = (m, width = 480) =>
  cdn(m.type === "image" ? (m.preview ?? m.url) : (m.poster ?? null), width || undefined);

/** Địa chỉ phát của video / link nhúng (tệp mới chọn từ máy dùng object URL). */
export const playUrl = (m) => (m.source === "file" ? m.preview : m.url);

export const isImage = (m) => m.type === "image";
