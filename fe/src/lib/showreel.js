import { siteConfig } from "@/config/site";

/**
 * Chọn bản showreel phù hợp thiết bị (chỉ gọi phía trình duyệt):
 * - Màn hình ≥ 768px → 1080p.
 * - Điện thoại, hoặc người dùng bật "tiết kiệm dữ liệu" → 720p.
 */
export function pickShowreelSrc(showreel = siteConfig.showreel) {
  const { hd, sd } = showreel;
  const saveData = navigator.connection?.saveData;
  const wide = window.matchMedia("(min-width: 768px)").matches;
  return wide && !saveData ? hd : sd;
}

/** Video showreel đang nằm trong trang (để popup tiếp tục đúng giây đang xem). */
export const inlineShowreel = () => document.querySelector("video[data-showreel-inline]");
