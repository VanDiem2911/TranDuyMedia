/**
 * Ảnh bìa ghép trôi ở đầu trang chi tiết sản phẩm — TỰ ĐỘNG từ thư viện (ảnh + khung hình video).
 * Dùng chung cho website và các chỗ cần dựng lại đúng bố cục này.
 */

// Các vùng cắt [điểm giữ lại, mức phóng] khi có ít ảnh (vd. sản phẩm chỉ có 1 video / 1 ảnh): mỗi ô phóng vào
// một phần khác nhau của cùng một ảnh → vẫn đa dạng như sản phẩm nhiều ảnh.
export const REGIONS = [
  ["50% 22%", 1.7],
  ["20% 60%", 2.1],
  ["78% 40%", 1.9],
  ["35% 85%", 2.2],
  ["65% 12%", 2.3],
  ["50% 55%", 1.3],
  ["15% 30%", 2.4],
  ["85% 75%", 2],
  ["45% 40%", 2.6],
];

/**
 * 6 cột × 3 ô trôi so le. Đủ ảnh (≥ 6) → lấy vòng; ít ảnh → mỗi ô cắt một vùng khác nhau của các ảnh đó.
 * Trả về [[src | { src, pos, zoom }, ...], ...] cho PageHeader.columns.
 */
export function headerColumns(srcs, fallback) {
  const pool = [...new Set(srcs.length ? srcs : [fallback])];
  const tile = (n) => {
    const src = pool[n % pool.length];
    if (pool.length >= 6) return src;
    const [pos, zoom] = REGIONS[Math.floor(n / pool.length) % REGIONS.length];
    return { src, pos, zoom };
  };
  return Array.from({ length: 6 }, (_, i) => [0, 1, 2].map((k) => tile(i * 3 + k)));
}

/**
 * Cụm 3 ảnh nổi bật: thiếu ảnh (vd. sản phẩm chỉ có 1 ảnh / 1 khung hình) → lặp lại nguyên ảnh đang có
 * (giữ đúng khung cắt của ảnh) cho đủ 3 ô. Chỉ để hiển thị — không thêm gì vào thư viện.
 */
export function fillTrio(list) {
  if (!list.length || list.length >= 3) return list.slice(0, 3);
  return Array.from({ length: 3 }, (_, i) => list[i % list.length]);
}
