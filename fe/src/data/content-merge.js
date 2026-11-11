// Gộp nội dung đã lưu (DB) lên nội dung mặc định — dùng chung cho mọi trang chỉnh được (server + trình duyệt).

const blank = (v) => v === undefined || v === null || (typeof v === "string" && !v.trim());

/**
 * Ô nào chưa có / để trống → dùng mặc định. Mảng: có bản đã lưu (thêm / xoá thẻ) thì số phần tử theo bản đã lưu,
 * chưa có thì theo mặc định. Nhờ vậy dữ liệu cũ vẫn dùng được khi sau này thêm trường mới, và trang không bao giờ vỡ.
 */
export function mergeContent(def, saved) {
  if (Array.isArray(def)) {
    const list = Array.isArray(saved) ? saved : def; // danh sách đã lưu (kể cả rỗng) thắng mặc định
    return list.map((s, i) =>
      def[i] !== undefined ? mergeContent(def[i], list === def ? undefined : s) : s,
    );
  }
  if (def && typeof def === "object") {
    const s = saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
    return Object.fromEntries(Object.entries(def).map(([k, v]) => [k, mergeContent(v, s[k])]));
  }
  return blank(saved) ? def : saved;
}
