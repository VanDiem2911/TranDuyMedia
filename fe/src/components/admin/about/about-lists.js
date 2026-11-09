/**
 * Các danh sách thẻ (card) có thể THÊM / XOÁ ở trang Về chúng tôi.
 * min / max PHẢI khớp be/src/validators/content.validator.js.
 * template(): nội dung thẻ mới (quản trị viên sửa lại ngay sau khi thêm).
 */
const NEW_IMAGE = { src: "/images/bts/bts-05.webp", pos: "50% 50%" };

export const LISTS = {
  "values.items": {
    min: 1,
    max: 6,
    noun: "thẻ",
    template: () => ({
      title: "Giá trị mới",
      desc: "Mô tả ngắn về giá trị này.",
      image: { ...NEW_IMAGE },
    }),
  },
  "ecosystem.items": {
    min: 1,
    max: 12,
    noun: "thẻ",
    template: () => ({
      name: "Dịch vụ mới",
      desc: "Mô tả ngắn về dịch vụ này.",
      href: "/dich-vu",
      image: { ...NEW_IMAGE },
    }),
  },
  "standards.items": {
    min: 1,
    max: 10,
    noun: "nguyên tắc",
    template: () => ({ title: "Nguyên tắc mới", desc: "Mô tả ngắn về nguyên tắc này." }),
  },
};
