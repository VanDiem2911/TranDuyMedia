/** Danh sách thẻ thêm / xoá được ở trang Dịch vụ (xem about-lists.js). 5 dịch vụ chính gắn với trang con nên không thêm / xoá. */
const NEW_IMAGE = { src: "/images/bts/bts-05.webp", pos: "50% 50%" };

export const SERVICES_LISTS = {
  "journey.steps": {
    min: 3,
    max: 12,
    noun: "bước",
    template: () => ({
      title: "Bước mới",
      desc: "Mô tả ngắn về bước này.",
      image: { ...NEW_IMAGE },
    }),
  },
  "packages.items": {
    min: 1,
    max: 6,
    noun: "gói",
    template: () => ({
      title: "Gói mới",
      goal: "Mục tiêu của gói này",
      featured: false,
      image: { ...NEW_IMAGE },
      includes: [
        { text: "Hạng mục thứ nhất" },
        { text: "Hạng mục thứ hai" },
        { text: "Hạng mục thứ ba" },
      ],
      services: ["san-xuat-video-short"],
    }),
  },
  "faq.items": {
    min: 1,
    max: 20,
    noun: "câu hỏi",
    template: () => ({ q: "Câu hỏi mới?", a: "Câu trả lời cho câu hỏi này." }),
  },
};
