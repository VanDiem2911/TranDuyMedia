/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // Chỉ bật khi production (đã có HTTPS): trình duyệt luôn dùng HTTPS trong 2 năm
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

// Backend (be/) — chỉ server Next.js biết địa chỉ này; trình duyệt luôn gọi /api/v1 cùng tên miền
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

const nextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // Ẩn nút "N" của Next ở góc màn hình khi dev (vẫn báo lỗi biên dịch / runtime)
  devIndicators: false,
  images: {
    // Chỉ WebP: AVIF nén nhỏ hơn chút nhưng giải mã nặng hơn nhiều → giật khi ảnh vừa cuộn tới
    formats: ["image/webp"],
    // MỌI ảnh nén ở chất lượng 90 (nét, gần như không mất chi tiết). Chỉ khai báo đúng 1 mức: ảnh không ghi
    // quality (mặc định 75) tự được đưa về mức gần nhất là 90 — không còn cảnh báo "unconfigured qualities".
    qualities: [90],
    // Bậc kích thước ảnh dày hơn mặc định (vd. 384 → 448 → 512 → 640 thay vì nhảy thẳng 384 → 640): SmartImage khai
    // báo đúng bề rộng cần (đã tính object-cover + mật độ điểm ảnh) → trình duyệt chọn bản vừa sát nhất, vẫn đủ nét
    // nhưng bớt tải thừa.
    imageSizes: [32, 48, 64, 96, 128, 192, 256, 320, 384, 448, 512, 576],
    deviceSizes: [640, 750, 828, 960, 1080, 1200, 1440, 1600, 1920, 2048, 2560, 3840],
    // Ảnh đã tối ưu được trình duyệt / CDN giữ 31 ngày (mặc định chỉ vài giờ) → lần sau mở trang không phải nén lại
    minimumCacheTTL: 2678400,
    // Ảnh / poster video lưu trên Cloudinary (chỉ cho phép đúng cloud của studio nếu đã cấu hình)
    remotePatterns: [
      // Ảnh đại diện video YouTube (sản phẩm dạng link nhúng)
      { protocol: "https", hostname: "img.youtube.com", pathname: "/vi/**" },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
          ? `/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/**`
          : "/**",
      },
    ],
  },
  experimental: {
    // Upload video lớn qua /api/v1 (chuyển tiếp sang backend) có thể mất vài phút
    proxyTimeout: 10 * 60 * 1000,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Trang /studio cũ (bối cảnh) → /san-pham (sản phẩm đã thực hiện)
  async redirects() {
    const map = {
      "vintage-green": "lifestyle-vintage-xanh-reu",
      "box-studio": "concept-box-studio-trang",
      rooftop: "retro-sai-gon-san-thuong",
      christmas: "bo-anh-giang-sinh",
      tet: "bo-anh-tet-xuan-men-thuong",
      "trung-thu": "bo-anh-trung-thu",
    };
    return [
      { source: "/studio", destination: "/san-pham", permanent: true },
      ...Object.entries(map).map(([from, to]) => ({
        source: `/studio/${from}`,
        destination: `/san-pham/${to}`,
        permanent: true,
      })),
      { source: "/studio/:slug", destination: "/san-pham", permanent: true },
      // Dịch vụ cũ (4 mảng) → 5 dịch vụ mới (feedback 02/11) — khớp legacyServices trong src/data/services.js
      {
        source: "/dich-vu/san-xuat-video",
        destination: "/dich-vu/san-xuat-video-short",
        permanent: true,
      },
      {
        source: "/dich-vu/chup-anh-thuong-mai",
        destination: "/dich-vu/chup-anh-quang-cao",
        permanent: true,
      },
      {
        source: "/dich-vu/chup-anh-su-kien",
        destination: "/dich-vu/phim-doanh-nghiep-su-kien",
        permanent: true,
      },
    ];
  },
  // Chuyển tiếp /api/v1/* sang backend → cookie đăng nhập là first-party (SameSite=Strict, không CORS)
  async rewrites() {
    return [{ source: "/api/v1/:path*", destination: `${BACKEND_URL}/api/v1/:path*` }];
  },
  async headers() {
    // Ảnh / video / icon tĩnh: cho trình duyệt giữ 30 ngày, hết hạn vẫn dùng bản cũ trong lúc tải bản mới
    // (mặc định Next.js là max-age=0 → mỗi lần vào trang đều hỏi lại máy chủ)
    const staticCache = [
      { key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" },
    ];
    return [
      { source: "/(.*)", headers: securityHeaders },
      { source: "/images/:path*", headers: staticCache },
      { source: "/media/:path*", headers: staticCache },
      { source: "/icons/:path*", headers: staticCache },
    ];
  },
};

export default nextConfig;
