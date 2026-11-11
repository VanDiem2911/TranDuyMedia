// Nội dung CHỈNH ĐƯỢC của phần đầu trang Sản phẩm /san-pham (trang quản trị → "Trang Sản phẩm", lưu vào DB).
// Danh sách sản phẩm quản lý ở tab "Sản phẩm" riêng. Đây là nội dung MẶC ĐỊNH của phần đầu trang.

// Nền đầu trang: 6 cột ảnh trôi so le — khung hình từ chính các sản phẩm đã thực hiện (clip & ảnh trên Drive)
const HEADER_IMAGES = [
  "/images/clips/short-3.webp",
  "/images/services/itvc-elip-1.webp",
  "/images/about-hd/event-ballroom.webp",
  "/images/clips/short-4.webp",
  "/images/clips/itvc-6.webp",
  "/images/services/itvc-elip-3.webp",
  "/images/clips/short-6.webp",
  "/images/clips/itvc-2.webp",
  "/images/about-hd/corporate-factory.webp",
  "/images/clips/short-8.webp",
  "/images/services/itvc-elip-2.webp",
  "/images/clips/itvc-9.webp",
  "/images/clips/short-2.webp",
  "/images/clips/itvc-7.webp",
  "/images/about-hd/jewelry-store.webp",
  "/images/clips/short-7.webp",
  "/images/services/itvc-elip-4.webp",
  "/images/about-hd/event-stage-girls.webp",
];

export const productsDefaults = {
  header: {
    eyebrow: "Dự án đã thực hiện",
    description:
      "Những dự án video marketing, chụp ảnh thương mại và sự kiện do Trần Duy Media thực hiện — từ ý tưởng đến hậu kỳ.",
    columns: Array.from({ length: 6 }, (_, i) =>
      [0, 1, 2].map((k) => ({ src: HEADER_IMAGES[i * 3 + k] })),
    ),
  },
};
