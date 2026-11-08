// Nội dung CHỈNH ĐƯỢC của trang "Về chúng tôi" (trang quản trị → "Về chúng tôi", lưu vào DB).
// Đây là nội dung MẶC ĐỊNH: chưa chỉnh gì (hoặc backend chưa sẵn sàng) thì website hiển thị đúng như dưới đây.
// Cấu trúc phải khớp validator ở be/src/validators/content.validator.js.
// Dùng được cả ở server (lib/about.js) lẫn trình duyệt (trang quản trị) — KHÔNG import gì phụ thuộc server.

import { ecosystem, mission, productionStandards, profileImage, vision } from "@/data/about";
import { values } from "@/data/services";

export const ABOUT_TAG = "about";

export const aboutDefaults = {
  header: {
    eyebrow: "Hồ sơ doanh nghiệp",
    description:
      "Gia công video, hình ảnh thương mại quảng cáo tại TP.HCM — hơn 10 năm đồng hành cùng doanh nghiệp Việt.",
  },
  story: {
    eyebrow: "Câu chuyện của chúng tôi",
    titleLead: "Đối tác gia công video, hình ảnh",
    titleAccent: "toàn diện cho doanh nghiệp.",
    taglines: ["Đồng hành bền vững cùng doanh nghiệp", "Đồng hành nâng tầm giá trị doanh nghiệp"],
    paragraphs: [
      "Trần Duy Media là đơn vị chuyên gia công nội dung truyền thông, thương mại quảng cáo. Bắt đầu từ tinh thần yêu nghề, kinh nghiệm thực chiến với hơn 10 năm đồng hành chuyên sâu, chúng tôi đã triển khai thành công nhiều dự án.",
      "Chúng tôi luôn nỗ lực mỗi ngày — nơi sáng tạo, sự đổi mới không chỉ dừng ở việc phục vụ mục tiêu kinh doanh của khách hàng, mà hơn hết là sự đồng hành cùng kiến tạo và nâng tầm giá trị doanh nghiệp vững bền.",
    ],
    facts: [
      { label: "Thương hiệu", value: "Trần Duy Media" },
      { label: "Lĩnh vực", value: "Gia công video, hình ảnh thương mại quảng cáo" },
      { label: "Kinh nghiệm", value: "Hơn 10 năm thực chiến" },
      { label: "Phương châm", value: "Uy tín – Tối ưu chi phí – Tận tâm" },
    ],
    image: { src: profileImage.src, alt: profileImage.alt, pos: profileImage.pos },
  },
  core: {
    eyebrow: "Trần Duy Media",
    title: "Những giá trị cốt lõi.",
    vision: { text: vision.text, image: { src: vision.image, pos: vision.imagePos } },
    mission: { text: mission.text, image: { src: mission.image, pos: mission.imagePos } },
  },
  standards: {
    eyebrow: "Chuẩn mực sản xuất",
    titleLead: "Trần Duy Media cam kết",
    titleAccent: "chuẩn mực sản xuất.",
    intro: "Năm nguyên tắc chúng tôi giữ vững trong từng dự án, với từng khách hàng.",
    items: productionStandards.map(({ title, desc }) => ({ title, desc })),
  },
  values: {
    eyebrow: "Khách hàng tin tưởng chọn Tran Duy Media",
    titleLead: "Uy tín. Tối ưu chi phí.",
    titleAccent: "Tận tâm.",
    description:
      "Ba giá trị chúng tôi giữ trong mọi khung hình — từ buổi trao đổi đầu tiên đến file bàn giao cuối cùng.",
    items: values.map((v) => ({
      title: v.title,
      desc: v.desc,
      image: { src: v.image, pos: v.imagePos },
    })),
  },
  ecosystem: {
    eyebrow: "Hệ sinh thái dịch vụ cốt lõi",
    tagline: "6 dịch vụ - 1 ekip",
    items: ecosystem.map((e) => ({
      name: e.name,
      desc: e.desc,
      image: { src: e.src, pos: e.pos },
    })),
  },
};

/** Liên kết của từng thẻ dịch vụ — cố định (không chỉnh ở trang quản trị), theo thứ tự thẻ. */
export const ecosystemHrefs = ecosystem.map((e) => e.href);

const blank = (v) => v === undefined || v === null || (typeof v === "string" && !v.trim());

/**
 * Gộp nội dung đã lưu (DB) lên nội dung mặc định: ô nào chưa có / để trống → dùng mặc định,
 * mảng gộp theo vị trí. Nhờ vậy dữ liệu cũ vẫn dùng được khi sau này thêm trường mới, và trang không bao giờ vỡ.
 */
export function mergeAbout(def, saved) {
  if (Array.isArray(def)) {
    return def.map((d, i) => mergeAbout(d, Array.isArray(saved) ? saved[i] : undefined));
  }
  if (def && typeof def === "object") {
    const s = saved && typeof saved === "object" && !Array.isArray(saved) ? saved : {};
    return Object.fromEntries(Object.entries(def).map(([k, v]) => [k, mergeAbout(v, s[k])]));
  }
  return blank(saved) ? def : saved;
}
