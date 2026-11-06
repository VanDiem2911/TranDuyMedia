/** Các tab quản trị — thêm tab mới: thêm 1 dòng ở đây + tạo trang src/app/admin/<slug>/page.js */
export const adminNav = [
  { href: "/admin", label: "Tổng quan", icon: "grid", desc: "Số liệu nhanh và hoạt động gần đây" },
  {
    href: "/admin/bookings",
    label: "Yêu cầu đặt lịch",
    icon: "inbox",
    desc: "Yêu cầu tư vấn gửi từ website",
  },
  {
    href: "/admin/products",
    label: "Sản phẩm",
    icon: "film",
    desc: "Bộ ảnh và video đã thực hiện",
  },
  {
    href: "/admin/about",
    label: "Về chúng tôi",
    icon: "note",
    desc: "Chỉnh nội dung và hình ảnh của trang Về chúng tôi",
  },
];

export const findNav = (pathname) =>
  [...adminNav]
    .sort((a, b) => b.href.length - a.href.length)
    .find((n) => (n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href))) ??
  adminNav[0];
