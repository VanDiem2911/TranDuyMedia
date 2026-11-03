/**
 * Ảnh xem trước trong TRANG QUẢN TRỊ (thẻ <img> thường, không qua next/image).
 * - Có `width`: tải ĐÚNG CỠ hiển thị (thumbnail, thẻ sản phẩm…) thay vì ảnh gốc vài MB:
 *   · ảnh Cloudinary → bản thu nhỏ f_auto (AVIF/WebP) q_auto:good, rộng tối đa `width`;
 *   · ảnh có sẵn trong /public (/images/…) → qua bộ tối ưu ảnh của Next (/_next/image) đúng cỡ.
 * - Không có `width`: bản WebP chất lượng cao nhất của ảnh gốc (khung cắt ảnh cần nét).
 * Website công khai dùng thẳng bản gốc qua next/image (xem lib/products.js, SmartImage).
 * Link đã có biến đổi riêng / blob: / link ngoài → giữ nguyên.
 */
const UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(?!f_|q_|c_|w_|so_)(.+)$/;

// Khớp images.imageSizes + images.deviceSizes trong next.config.mjs (Next chỉ nhận các bề rộng này)
const NEXT_WIDTHS = [
  32, 48, 64, 96, 128, 192, 256, 320, 384, 448, 512, 576, 640, 750, 828, 960, 1080, 1200, 1440,
  1600, 1920, 2048, 2560, 3840,
];

export const cdn = (url, width) => {
  if (typeof url !== "string") return url;
  if (!width) return url.replace(UPLOAD, "$1f_webp,q_auto:best/$2");
  if (UPLOAD.test(url)) return url.replace(UPLOAD, `$1f_auto,q_auto:good,c_limit,w_${width}/$2`);
  if (url.startsWith("/images/")) {
    const w = NEXT_WIDTHS.find((x) => x >= width) ?? 3840;
    return `/_next/image?url=${encodeURIComponent(url)}&w=${w}&q=90`;
  }
  return url;
};

/**
 * Ảnh object-cover trong khung boxW × boxH (điểm ảnh thật, đã nhân mật độ màn hình): tính bề rộng cần tải
 * để ảnh PHỦ KÍN khung mà không bị kéo giãn — ảnh ngang đặt vào khung dọc chỉ hiện một phần nên cần bản
 * lớn hơn bề rộng khung nhiều lần; zoom (cắt khung) nhân thêm. Biết kích thước gốc → tính đúng, không vượt
 * bản gốc; chưa biết → tải dư cho trường hợp ảnh ngang 16:9.
 */
export function coverCdn(url, { width: iw, height: ih, zoom } = {}, boxW, boxH) {
  const z = Math.min(Math.max(Number(zoom) || 1, 1), 4);
  if (iw && ih) {
    const scale = Math.max(boxW / iw, boxH / ih) * z;
    return cdn(url, Math.min(iw, Math.ceil(iw * scale)));
  }
  return cdn(url, Math.ceil(Math.max(boxW, (boxH * 16) / 9) * z));
}
