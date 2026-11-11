// Nội dung CHỈNH ĐƯỢC của trang danh sách Dịch vụ /dich-vu (trang quản trị → "Dịch vụ", lưu vào DB).
// Đây là nội dung MẶC ĐỊNH: chưa chỉnh gì (hoặc backend chưa sẵn sàng) thì website hiển thị đúng như dưới đây.
// Dấu cách không ngắt ( ) trong tiêu đề giữ liền các từ ghép khi xuống dòng — như bản thiết kế gốc.
// Dùng được cả ở server lẫn trình duyệt (trang quản trị) — KHÔNG import gì phụ thuộc server.

import { faqs, packages, processSteps, services, stats } from "@/data/services";

const img = (src, pos = "50% 50%") => ({ src, pos });

export const servicesDefaults = {
  hero: {
    eyebrow: "Dịch vụ - Trần Duy Media Studio",
    titleLead: "Một ekip cho",
    titleAccent: "trọn chiến dịch hình ảnh",
    description:
      "Video short marketing, iTVC & viral, phim doanh nghiệp & sự kiện, chụp ảnh quảng cáo và cho thuê studio — năm dịch vụ bổ trợ nhau, được thực hiện bởi cùng một đội ngũ nên hình ảnh luôn đồng bộ, tiến độ rõ ràng.",
    bookingLabel: "Đặt lịch tư vấn",
    // 3 ảnh dọc so le bên phải (ảnh giữa cao nhất)
    frames: [
      { image: img("/images/clips/short-3.webp", "center 35%") },
      { image: img("/images/bts/bts-16.webp", "center 40%") },
      { image: img("/images/studio/room-1-01.webp", "center") },
    ],
    stats: stats.slice(0, 3).map(({ value, label }) => ({ value, label })),
  },
  journey: {
    eyebrow: "Quy trình sản xuất",
    titleLead: "Bảy bước, từ tiếp nhận",
    titleAccent: "đến bàn giao.",
    hint: "Rê chuột qua từng bước để xem chúng tôi làm gì ở mỗi giai đoạn.",
    steps: processSteps.map((s) => ({
      title: s.title,
      desc: s.desc,
      image: img(s.image, s.imagePos),
    })),
  },
  list: {
    eyebrow: "Dịch vụ chính",
    title: "Chọn dịch vụ phù hợp mục tiêu của bạn.",
    quoteLabel: "Nhận báo giá",
    detailLabel: "Xem chi tiết",
    // 5 dịch vụ gắn với trang con /dich-vu/[slug] nên số lượng và đường dẫn cố định; chữ + ảnh sửa được
    items: services.map((s) => ({
      slug: s.slug,
      menuDesc: s.menuDesc,
      title: s.title,
      tagline: s.tagline,
      description: s.description,
      image: img(s.image, s.imagePos),
      features: s.items.map((it) => ({ text: it.name })),
    })),
  },
  packages: {
    eyebrow: "Gói gợi ý",
    title: "Kết hợp dịch vụ theo mục tiêu kinh doanh.",
    description:
      "Ba cách SME & Startup thường bắt đầu với chúng tôi. Mọi gói đều tuỳ chỉnh được theo ngân sách.",
    popularLabel: "Phổ biến nhất",
    ctaLabel: "Tư vấn gói này",
    items: packages.map((p) => ({
      title: p.title,
      goal: p.goal,
      featured: Boolean(p.featured),
      image: img(p.image, p.pos),
      includes: p.includes.map((text) => ({ text })),
      services: p.services,
    })),
  },
  faq: {
    eyebrow: "Câu hỏi thường gặp",
    title: "Những điều khách hàng hay hỏi trước khi bắt đầu.",
    description:
      "Chưa thấy câu trả lời? Gọi hotline hoặc để lại thông tin, chúng tôi phản hồi trong 24 giờ.",
    items: faqs.map(({ q, a }) => ({ q, a })),
  },
};
