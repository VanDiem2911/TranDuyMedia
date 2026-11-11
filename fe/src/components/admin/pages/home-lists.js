/** Danh sách thẻ thêm / xoá được ở Trang chủ (xem about-lists.js). min / max phải hợp lý với bố cục. */
const NEW_IMAGE = { src: "/images/bts/bts-05.webp", pos: "50% 50%" };

export const HOME_LISTS = {
  "hero.slides": {
    min: 1,
    max: 8,
    noun: "ảnh",
    template: () => ({ image: { ...NEW_IMAGE }, alt: "Ảnh hậu trường sản xuất" }),
  },
  "focus.panels": {
    min: 1,
    max: 12,
    noun: "thẻ",
    template: () => ({
      name: "Dịch vụ mới",
      desc: "Mô tả ngắn về dịch vụ này.",
      shot: "Wide - 24mm",
      image: { ...NEW_IMAGE },
      href: "/dich-vu",
    }),
  },
  "process.steps": {
    min: 1,
    max: 12,
    noun: "bước",
    template: () => ({ title: "Bước mới", desc: "Mô tả ngắn về bước này." }),
  },
  "bts.images": {
    min: 3,
    max: 36,
    noun: "ảnh",
    template: () => ({ image: { ...NEW_IMAGE }, alt: "Ảnh hậu trường sản xuất" }),
  },
  "partners.items": {
    min: 1,
    max: 24,
    noun: "đối tác",
    template: () => ({
      name: "ĐỐI TÁC MỚI",
      logo: { src: "/images/partners/ddg.webp" },
      w: 300,
      big: false,
    }),
  },
};
