/**
 * Cấu hình chung của website — thông tin lấy từ hồ sơ yêu cầu (docs/demo.docx) và poster của studio.
 * Thay đổi thương hiệu, liên hệ, mạng xã hội, video showreel tại đây.
 */
/**
 * URL chính thức của website: NEXT_PUBLIC_SITE_URL → (trên Vercel) tên miền production Vercel tự cấp
 * → localhost. Giá trị sai định dạng bị bỏ qua (kèm cảnh báo) thay vì làm hỏng cả bản build.
 */
function siteUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL &&
      `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
  ];
  for (const raw of candidates) {
    if (!raw) continue;
    try {
      return new URL(raw.trim()).origin;
    } catch {
      console.warn(`[site] NEXT_PUBLIC_SITE_URL không hợp lệ: "${raw}" — dùng giá trị dự phòng`);
    }
  }
  return "http://localhost:3000";
}

export const siteConfig = {
  name: "Trần Duy Media Studio",
  shortName: "TD Media",
  tagline: "Gia công nội dung truyền thông & quảng cáo",
  description:
    "Trần Duy Media Studio – hơn 10 năm gia công video, hình ảnh toàn diện cho doanh nghiệp: video short marketing, iTVC, phim doanh nghiệp & sự kiện, chụp ảnh quảng cáo và cho thuê studio tại TP. Hồ Chí Minh.",
  // Đoạn giới thiệu ngắn ở chân trang — các từ ghép nối bằng khoảng trắng không ngắt (U+00A0) để không bị tách dòng
  footerText:
    "Trần Duy Media đối tác gia công video, hình ảnh thương mại quảng cáo và cho thuê studio uy tín cho doanh nghiệp.",
  url: siteUrl(),
  // API backend: gọi cùng tên miền, Next.js chuyển tiếp sang be/ (xem rewrites trong next.config.mjs)
  apiUrl: "/api/v1",
  locale: "vi_VN",
  lang: "vi",
  themeColor: "#0b1220",
  keywords: [
    "sản xuất video quảng cáo",
    "TVC",
    "iTVC",
    "phim doanh nghiệp",
    "video documentary",
    "video sự kiện",
    "cho thuê studio chụp ảnh",
    "studio quay video",
    "chụp ảnh thương mại",
    "chụp ảnh sự kiện",
    "video marketing",
    "Trần Duy Media",
    "Tran Duy Media", // khách hay tìm không dấu
    "Nhà Bè",
  ],
  contact: {
    phone: "097 154 2026",
    phoneRaw: "0971542026",
    phoneHref: "tel:+84971542026",
    email: "tranduymediagroup@gmail.com",
    address: "456/26 Huỳnh Tấn Phát, KP7, Nhà Bè",
    city: "TP. Hồ Chí Minh",
    workingHours: "Thứ 2 – Chủ nhật, 8:00 – 21:00",
    mapsQuery: "456/26 Huỳnh Tấn Phát, Nhà Bè, Hồ Chí Minh",
    mapsLink:
      "https://www.google.com/maps/search/?api=1&query=456%2F26+Hu%E1%BB%B3nh+T%E1%BA%A5n+Ph%C3%A1t%2C+Nh%C3%A0+B%C3%A8",
  },
  socials: {
    facebook: "https://www.facebook.com/TranDuyMedia",
    messenger: "https://m.me/TranDuyMedia",
    zalo: "https://zalo.me/0971542026",
    youtube: "https://www.youtube.com/@tranduymedia/featured",
    tiktok: "https://www.tiktok.com/@tranduymedia",
  },
  // Link bảng giá chi tiết thuê studio (PDF / Google Drive). Để null: nút "Nhận bảng giá chi tiết" mở form đặt lịch.
  studioPriceList: null, // TODO: điền link bảng giá khi khách gửi
  // Showreel 2026 — bản web nén từ file gốc 4K (public/videos, không commit) bằng `npm run video`.
  // Tự host (không dùng Google Drive) để điều khiển được: tự phát khi cuộn tới, chọn chất lượng 1080p.
  showreel: {
    title: "Showreel 2026",
    duration: "Tổng hợp dự án 2025 – 2026",
    poster: "/media/showreel-poster.webp",
    hd: "/media/showreel-1080.mp4", // máy tính / tablet
    sd: "/media/showreel-720.mp4", // điện thoại hoặc khi bật tiết kiệm dữ liệu
  },
};

// Menu chung cho header (desktop + mobile) và footer.
// Theo feedback 02/11: Về chúng tôi - Dịch vụ - Sản phẩm - Hậu trường - Liên hệ.
// Không có "Trang chủ" (logo đã là đường về trang chủ). Mục có "#" là section trên trang chủ:
// đang ở trang chủ thì cuộn mượt tới, ở trang khác thì chuyển về trang chủ rồi cuộn (SmoothScroll).
export const mainNav = [
  { label: "Về chúng tôi", href: "/gioi-thieu" },
  { label: "Dịch vụ", href: "/dich-vu" },
  { label: "Sản phẩm", href: "/san-pham" },
  { label: "Hậu trường", href: "/#hau-truong" },
  { label: "Liên hệ", href: "/#lien-he" },
];
