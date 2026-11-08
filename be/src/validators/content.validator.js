import { z } from "zod";

// Điểm giữ lại khi cắt khung (object-position): từ khoá hoặc "x% y%" — giống validator sản phẩm
const position = z
  .string()
  .trim()
  .regex(
    /^(center|top|bottom|left|right|\d{1,3}(\.\d{1,2})?% \d{1,3}(\.\d{1,2})?%)$/,
    "Vị trí cắt ảnh không hợp lệ",
  );
const imageUrl = z
  .string()
  .trim()
  .min(1, "Thiếu ảnh")
  .max(1000)
  .refine((v) => /^https:\/\//i.test(v) || v.startsWith("/"), "Đường dẫn ảnh phải dùng https");

/** Ô văn bản bắt buộc có nội dung (để không làm trống / vỡ bố cục trang). */
const text = (label, max) =>
  z
    .string({ error: `Vui lòng nhập ${label}` })
    .trim()
    .min(1, `Vui lòng nhập ${label}`)
    .max(max, `${label[0].toUpperCase() + label.slice(1)} tối đa ${max} ký tự`);

const image = z.object({ src: imageUrl, pos: position.default("center") });
const list = (item, n, label) => z.array(item).length(n, `${label} phải có đúng ${n} mục`);

/** Trang "Về chúng tôi" — cùng cấu trúc với nội dung mặc định ở fe/src/lib/about.js. */
export const aboutSchema = z.object({
  header: z.object({
    eyebrow: text("dòng nhỏ đầu trang", 60),
    description: text("mô tả đầu trang", 300),
  }),
  story: z.object({
    eyebrow: text("tiêu đề nhỏ phần câu chuyện", 60),
    titleLead: text("tiêu đề phần câu chuyện", 120),
    titleAccent: text("phần tiêu đề màu cam", 120),
    taglines: list(text("thông điệp", 120), 2, "Thông điệp"),
    paragraphs: list(text("đoạn giới thiệu", 800), 2, "Đoạn giới thiệu"),
    facts: list(
      z.object({ label: text("tên mục hồ sơ", 40), value: text("nội dung hồ sơ", 160) }),
      4,
      "Hồ sơ nhanh",
    ),
    image: image.extend({ alt: text("mô tả ảnh", 200) }),
  }),
  core: z.object({
    eyebrow: text("dòng nhỏ giá trị cốt lõi", 60),
    title: text("tiêu đề giá trị cốt lõi", 100),
    vision: z.object({ text: text("nội dung tầm nhìn", 400), image }),
    mission: z.object({ text: text("nội dung sứ mệnh", 400), image }),
  }),
  standards: z.object({
    eyebrow: text("dòng nhỏ chuẩn mực sản xuất", 60),
    titleLead: text("tiêu đề chuẩn mực sản xuất", 120),
    titleAccent: text("phần tiêu đề màu cam", 120),
    intro: text("câu giới thiệu chuẩn mực", 300),
    items: list(
      z.object({ title: text("tên chuẩn mực", 80), desc: text("mô tả chuẩn mực", 300) }),
      5,
      "Chuẩn mực sản xuất",
    ),
  }),
  values: z.object({
    eyebrow: text("dòng nhỏ khối khách hàng tin tưởng", 60),
    titleLead: text("tiêu đề khối khách hàng tin tưởng", 80),
    titleAccent: text("phần tiêu đề màu cam", 60),
    description: text("mô tả khối khách hàng tin tưởng", 300),
    items: list(
      z.object({ title: text("tên giá trị", 40), desc: text("mô tả giá trị", 200), image }),
      3,
      "Ba giá trị",
    ),
  }),
  ecosystem: z.object({
    eyebrow: text("dòng nhỏ hệ sinh thái", 60),
    tagline: text("khẩu hiệu hệ sinh thái", 60),
    items: list(
      z.object({ name: text("tên dịch vụ", 100), desc: text("mô tả dịch vụ", 200), image }),
      6,
      "Hệ sinh thái dịch vụ",
    ),
  }),
});
