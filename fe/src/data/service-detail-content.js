// Nội dung CHỈNH ĐƯỢC của 5 trang chi tiết dịch vụ /dich-vu/[slug] (trang quản trị → "Chi tiết dịch vụ", lưu vào DB).
// Mỗi dịch vụ: đầu trang (tên, mô tả) · giới thiệu (tiêu đề, mô tả, 3 số liệu, 3 ảnh) · điểm nổi bật (chỉ Cho thuê studio) · báo giá.
// Phần "Sản phẩm thực tế" (clip), video nền đầu trang, các khối dùng chung (3 thế mạnh, đối tác, hành trình, hậu trường) giữ nguyên.
// Đây là nội dung MẶC ĐỊNH (lấy từ data/services.js): chưa chỉnh gì thì website hiển thị đúng như cũ.
// Dùng được cả ở server lẫn trình duyệt (trang quản trị) — KHÔNG import gì phụ thuộc server.

import { services } from "@/data/services";

export const PRICE_ON_REQUEST = "Liên hệ báo giá";
export const PRICING_NOTE =
  "Chi phí thay đổi theo thời lượng, số ngày quay và yêu cầu hậu kỳ — gửi báo giá chi tiết theo hạng mục trong 24 giờ.";
export const STUDIO_PRICING_NOTE =
  "Tính theo giờ và theo room, tối thiểu 2 giờ — đã gồm đèn, phông nền, đạo cụ sẵn có. Xác nhận lịch và gửi bảng giá chi tiết trong ngày.";

/** Mã tệp Google Drive từ đường dẫn chia sẻ (hoặc chính mã đó). */
export const driveId = (link = "") =>
  link.match(/\/d\/([\w-]{15,})/)?.[1] ??
  link.match(/[?&]id=([\w-]{15,})/)?.[1] ??
  (/^[\w-]{15,}$/.test(link.trim()) ? link.trim() : link);
export const driveLink = (id) => `https://drive.google.com/file/d/${id}/view`;

const norm = (p) =>
  typeof p === "string" ? { src: p, pos: "50% 50%" } : { src: p.src, pos: p.pos ?? "50% 50%" };

export const serviceDetailDefaults = {
  items: services.map((s) => {
    const i = s.accent ? s.headline.indexOf(s.accent) : -1;
    const studio = s.kind === "studio";
    return {
      slug: s.slug,
      hero: { title: s.title, description: s.heroDesc },
      overview: {
        // Tiêu đề = vế đen + vế nhấn màu cam
        headlineLead: i >= 0 ? s.headline.slice(0, i).trim() : s.headline,
        accent: i >= 0 ? s.accent : "",
        description: s.description,
        highlights: s.highlights.map(({ value, label }) => ({ value, label })),
        images: s.pool.slice(0, 3).map(norm),
      },
      features: (s.features ?? []).map(({ title, desc }) => ({ title, desc })),
      // Sản phẩm thực tế: clip (Google Drive) và / hoặc ảnh dự án — dịch vụ nào không có thì để trống
      works: {
        title: s.works?.title ?? "",
        clips: (s.works?.clips ?? []).map((c) => ({
          link: driveLink(c.id),
          title: c.title,
          vertical: Boolean(c.vertical),
          poster: norm(c.poster),
        })),
        photos: (s.works?.photos ?? []).map(norm),
      },
      // Cho thuê studio: thông tin từng room (tên, diện tích, loại phòng, mô tả, thư mục ảnh, ảnh)
      rooms: (s.rooms ?? []).map((r) => ({
        name: r.name,
        size: r.size,
        label: r.label,
        short: r.short,
        folder: r.folder,
        images: r.images.map(norm),
      })),
      pricing: {
        title: studio
          ? "Bảng giá thuê studio."
          : `Báo giá ${s.title.charAt(0).toLowerCase()}${s.title.slice(1)}.`,
        note: studio ? STUDIO_PRICING_NOTE : PRICING_NOTE,
        plans: s.pricing.plans.map((p) => ({
          name: p.name,
          desc: p.desc,
          price: p.price ?? PRICE_ON_REQUEST,
          unit: p.unit ?? "",
          featured: Boolean(p.featured),
          includes: [...p.includes],
        })),
      },
    };
  }),
};

/** Gộp nội dung chỉnh được của một dịch vụ lên dữ liệu gốc → đối tượng dịch vụ mà trang chi tiết đang dùng. */
export function applyServiceDetail(s, d) {
  if (!d) return s;
  const o = d.overview;
  return {
    ...s,
    title: d.hero.title,
    heroDesc: d.hero.description,
    headline: `${o.headlineLead} ${o.accent}`.trim(),
    accent: o.accent,
    description: o.description,
    highlights: o.highlights,
    pool: [...o.images, ...s.pool.slice(3)],
    features: s.features ? s.features.map((f, i) => ({ ...f, ...d.features[i] })) : s.features,
    works: s.works
      ? {
          ...s.works,
          title: d.works.title || s.works.title,
          clips: d.works.clips.map((c) => ({
            id: driveId(c.link),
            title: c.title,
            poster: c.poster.src,
            vertical: c.vertical,
          })),
          photos: d.works.photos.map((p) => p.src),
        }
      : s.works,
    rooms: s.rooms
      ? s.rooms.map((r, i) => {
          const x = d.rooms[i];
          return x ? { ...r, ...x, images: x.images.map((p) => p.src) } : r;
        })
      : s.rooms,
    pricing: { ...s.pricing, plans: d.pricing.plans },
    pricingTitle: d.pricing.title,
    pricingNote: d.pricing.note,
  };
}
