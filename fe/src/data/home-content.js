// Nội dung CHỈNH ĐƯỢC của Trang chủ (trang quản trị → "Trang chủ", lưu vào DB).
// Đây là nội dung MẶC ĐỊNH: chưa chỉnh gì (hoặc backend chưa sẵn sàng) thì website hiển thị đúng như dưới đây.
// Dấu cách không ngắt ( ) trong tiêu đề giữ liền các từ ghép khi xuống dòng — như bản thiết kế gốc.
// Dùng được cả ở server lẫn trình duyệt (trang quản trị) — KHÔNG import gì phụ thuộc server.

import { siteConfig } from "@/config/site";
import { btsGallery } from "@/data/about";
import { btsImages } from "@/data/collections";
import { partners } from "@/data/partners";
import { processSteps, stats } from "@/data/services";

const img = (src, pos = "50% 50%") => ({ src, pos });

export const homeDefaults = {
  hero: {
    // Ảnh nền hero (tự chuyển mỗi 6 giây)
    slides: btsImages.slice(0, 4).map((s) => ({ image: img(s.src, s.pos), alt: s.alt })),
    eyebrow: ["Video production", "Studio", "Photography"],
    titleLead: "Đối tác gia công video, hình ảnh",
    titleAccent: "toàn diện cho doanh nghiệp",
    description:
      "Hơn 10 năm sản xuất video marketing, iTVC, phim doanh nghiệp, chụp ảnh quảng cáo và cho thuê studio.",
    showreelLabel: "Xem showreel 2026",
    bookingLabel: "Đặt lịch tư vấn",
  },
  showreel: {
    eyebrow: "Showreel",
    title: "Đồng hành lan tỏa giá trị cùng doanh nghiệp.",
    description:
      "Tổng hợp các dự án video marketing, iTVC, doanh nghiệp và sự kiện trong năm 2025 – 2026.",
    // Video showreel (dùng chung toàn website). src trống = dùng video mặc định trong config/site.js
    videoTitle: siteConfig.showreel.title,
    duration: siteConfig.showreel.duration,
    video: { src: "", poster: "" },
  },
  intro: {
    eyebrow: "Về Trần Duy Media",
    title: "Đồng hành trên hành trình phát triển cùng doanh nghiệp.",
    description:
      "Đơn vị chuyên gia công nội dung truyền thông, thương mại quảng cáo — bắt đầu từ tinh thần yêu nghề và kinh nghiệm thực chiến, cùng doanh nghiệp nâng tầm giá trị vững bền.",
    primaryLabel: "Câu chuyện của chúng tôi",
    secondaryLabel: "Xem dịch vụ",
    stats: stats.map(({ value, label }) => ({ value, label })),
    bigNumber: "10+",
    imageMain: {
      ...img("/images/bts/bts-05.webp", "center"),
      alt: "Ekip Trần Duy Media trên trường quay",
    },
    imageSmall: {
      ...img("/images/about-hd/studio-interview.webp", "center 55%"),
      alt: "Setup quay phỏng vấn tại studio Trần Duy Media",
    },
  },
  focus: {
    eyebrow: "Tran Duy Media",
    titleLead: "Hệ sinh thái dịch vụ",
    titleAccent: "trọng tâm.",
    tagline: "All in for production",
    primaryLabel: "Xem dịch vụ",
    showreelLabel: "Showreel",
    contactLabel: "Liên hệ tư vấn",
    moreLabel: "Xem thêm",
    // Mỗi khung = một mảng dịch vụ; href = trang dịch vụ (chọn sẵn dịch vụ trong form tư vấn)
    panels: [
      {
        name: "TVC / iTVC",
        desc: "Quảng cáo 15–60s cho TV và các nền tảng online.",
        shot: "Close-up - 85mm",
        image: img("/images/services/itvc-elip-1.webp", "center 40%"),
        href: "/dich-vu/san-xuat-itvc-viral",
      },
      {
        name: "Video ngắn 9:16",
        desc: "TikTok, Reels, Shorts — nhịp nhanh, bám xu hướng.",
        shot: "Vertical - 9:16",
        image: img("/images/clips/short-4.webp", "center 30%"),
        href: "/dich-vu/san-xuat-video-short",
      },
      {
        name: "Documentary, talkshow & testimonial",
        desc: "Câu chuyện thương hiệu, phỏng vấn, chân dung nhà sáng lập.",
        shot: "Two-shot - 3 cam",
        image: img("/images/clips/itvc-2.webp", "center 40%"),
        href: "/dich-vu/phim-doanh-nghiep-su-kien",
      },
      {
        name: "Phim doanh nghiệp",
        desc: "Profile, năng lực, nhà xưởng — phục vụ đấu thầu.",
        shot: "Wide - 24mm",
        image: img("/images/about-hd/corporate-factory.webp", "center"),
        href: "/dich-vu/phim-doanh-nghiep-su-kien",
      },
      {
        name: "Video sự kiện",
        desc: "Hội nghị, tất niên, ra mắt — highlight bàn giao trong ngày.",
        shot: "Multi-cam - Live",
        image: img("/images/about-hd/event-ballroom.webp", "center 45%"),
        href: "/dich-vu/phim-doanh-nghiep-su-kien",
      },
      {
        name: "Cho thuê studio",
        desc: "Room 24m² & 150m² — sẵn đèn, phông nền, thuê theo giờ.",
        shot: "Studio - 2 room",
        image: img("/images/about-hd/studio-hall.webp", "center"),
        href: "/dich-vu/cho-thue-studio",
      },
    ],
  },
  process: {
    eyebrow: "Quy trình làm việc",
    title: "Quy trình sản xuất.",
    description:
      "Quy trình chặt chẽ và khắt khe đảm bảo chất lượng thành phẩm, giúp bạn an tâm đồng hành cùng chúng tôi.",
    buttonLabel: "Bắt đầu với một buổi brief",
    steps: processSteps.map(({ title, desc }) => ({ title, desc })),
  },
  bts: {
    eyebrow: "Behind the scenes",
    titleLead: "Hậu trường",
    titleAccent: "sản xuất.",
    images: btsGallery.map((g) => ({ image: img(g.src, g.pos), alt: g.alt })),
  },
  partners: {
    title: "Đối tác tiêu biểu đồng hành",
    items: partners.map((p) => ({
      name: p.name,
      logo: { src: p.logo },
      w: p.w,
      big: Boolean(p.big),
    })),
  },
};

/** Nội dung showreel chỉnh được → dạng website dùng (hd / sd / poster / tiêu đề). Chưa chọn video → video mặc định. */
export function showreelMedia(sr) {
  const base = siteConfig.showreel;
  const src = sr?.video?.src;
  return {
    title: sr?.videoTitle || base.title,
    duration: sr?.duration || base.duration,
    poster: (src && sr.video.poster) || base.poster,
    hd: src || base.hd,
    sd: src || base.sd,
  };
}
