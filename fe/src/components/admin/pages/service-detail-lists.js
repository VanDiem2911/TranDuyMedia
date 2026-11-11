/**
 * Danh sách thẻ thêm / xoá được ở trang Chi tiết dịch vụ (xem about-lists.js): mỗi dịch vụ có clip / ảnh dự án riêng,
 * Cho thuê studio (mục thứ 5) có ảnh của từng room. Đường dẫn gồm thứ tự dịch vụ nên được tạo cho cả 5 dịch vụ.
 */
const NEW_IMAGE = { src: "/images/bts/bts-05.webp", pos: "50% 50%" };
const image = () => ({ ...NEW_IMAGE });

export const SERVICE_DETAIL_LISTS = {};
export const SERVICE_LISTS = SERVICE_DETAIL_LISTS;

for (let i = 0; i < 5; i++) {
  SERVICE_DETAIL_LISTS[`items.${i}.works.clips`] = {
    min: 0,
    max: 24,
    noun: "clip",
    template: () => ({
      link: "https://drive.google.com/file/d/ID-TEP-DRIVE/view",
      title: "Clip mới",
      vertical: false,
      poster: image(),
    }),
  };
  SERVICE_DETAIL_LISTS[`items.${i}.works.photos`] = {
    min: 0,
    max: 7,
    noun: "ảnh",
    template: image,
  };
  for (let r = 0; r < 2; r++)
    SERVICE_DETAIL_LISTS[`items.${i}.rooms.${r}.images`] = {
      min: 1,
      max: 12,
      noun: "ảnh",
      template: image,
    };
}
