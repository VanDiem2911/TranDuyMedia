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
    href: "/admin/products-header",
    label: "Trang Sản phẩm",
    icon: "image",
    desc: "Chỉnh phần đầu trang Sản phẩm (chữ và ảnh nền)",
  },
  {
    href: "/admin/site",
    label: "Chân trang, menu & SEO",
    icon: "phone",
    desc: "Chỉnh chân trang, liên hệ, nhãn menu, tiêu đề & mô tả trên Google",
  },
  {
    href: "/admin/home",
    label: "Trang chủ",
    icon: "home",
    desc: "Chỉnh nội dung và hình ảnh của Trang chủ",
  },
  {
    href: "/admin/services",
    label: "Dịch vụ",
    icon: "camera",
    desc: "Chỉnh nội dung và hình ảnh của trang Dịch vụ",
  },
  {
    href: "/admin/service-detail",
    label: "Chi tiết dịch vụ",
    icon: "studio",
    desc: "Chỉnh nội dung 5 trang chi tiết dịch vụ",
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
