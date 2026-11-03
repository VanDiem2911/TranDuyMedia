import { legacyServices, services } from "@/data/services";

// Yêu cầu cũ (trước khi đổi sang 5 dịch vụ) vẫn hiện đúng tên dịch vụ lúc khách đặt
const SERVICE_TITLE = {
  ...Object.fromEntries(Object.entries(legacyServices).map(([slug, v]) => [slug, v.title])),
  ...Object.fromEntries(services.map((s) => [s.slug, s.title])),
};

export const serviceLabel = (slug) => (slug ? (SERVICE_TITLE[slug] ?? slug) : "Chưa xác định");

const dt = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
const d = new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

const full = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour12: false,
});
/** "16:41:05 · 20/10/2026" — đầy đủ giờ, phút, giây, ngày, tháng, năm */
export const formatFullDateTime = (iso) => {
  if (!iso) return "—";
  const p = Object.fromEntries(full.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return `${p.hour}:${p.minute}:${p.second} - ${p.day}/${p.month}/${p.year}`;
};

export const formatDateTime = (iso) => (iso ? dt.format(new Date(iso)) : "—");

/** "2026-11-01" → "01/11/2026" (không đổi múi giờ) */
export const formatDay = (ymd) => {
  if (!ymd) return null;
  const [y, m, day] = ymd.split("-").map(Number);
  return d.format(new Date(y, m - 1, day));
};

/** "5 phút trước", "Hôm qua"… */
export function timeAgo(iso) {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "Vừa xong";
  if (s < 3600) return `${Math.floor(s / 60)} phút trước`;
  if (s < 86400) return `${Math.floor(s / 3600)} giờ trước`;
  if (s < 172800) return "Hôm qua";
  if (s < 604800) return `${Math.floor(s / 86400)} ngày trước`;
  return d.format(new Date(iso));
}

/** 0971542026 → 0971 542 026 */
export const formatPhone = (p = "") =>
  p.length === 10 ? `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7)}` : p;
