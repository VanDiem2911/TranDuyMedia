import { z } from "zod";
import { CONTENT_KEYS } from "#models/site-content.model.js";

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

/** Địa chỉ video nền banner: để trống (chưa có) hoặc https / đường dẫn trong website. */
const videoUrl = z
  .string()
  .trim()
  .max(1000)
  .refine(
    (v) => v === "" || /^https:\/\//i.test(v) || v.startsWith("/"),
    "Đường dẫn video phải dùng https",
  );

/** Ô văn bản bắt buộc có nội dung (để không làm trống / vỡ bố cục trang). */
const text = (label, max) =>
  z
    .string({ error: `Vui lòng nhập ${label}` })
    .trim()
    .min(1, `Vui lòng nhập ${label}`)
    .max(max, `${label[0].toUpperCase() + label.slice(1)} tối đa ${max} ký tự`);

const image = z.object({ src: imageUrl, pos: position.default("center") });
const list = (item, n, label) => z.array(item).length(n, `${label} phải có đúng ${n} mục`);
/** Danh sách thẻ thêm / xoá được: từ min đến max thẻ (khớp fe/src/components/admin/about/about-lists.js) */
const cards = (item, min, max, label) =>
  z.array(item).min(min, `${label} cần ít nhất ${min} mục`).max(max, `${label} tối đa ${max} mục`);

/** Trang "Về chúng tôi" — cùng cấu trúc với nội dung mặc định ở fe/src/lib/about.js. */
export const aboutSchema = z.object({
  header: z.object({
    eyebrow: text("dòng nhỏ đầu trang", 60),
    description: text("mô tả đầu trang", 300),
    // Ảnh nền đầu trang: 6 cột ảnh trôi × 3 ảnh mỗi cột
    columns: list(list(z.object({ src: imageUrl }), 3, "Mỗi cột ảnh nền"), 6, "Ảnh nền đầu trang"),
    // Nền banner: ảnh trôi hoặc video lặp. Chọn "video" thì bắt buộc đã có video.
    banner: z
      .object({
        mode: z.enum(["images", "video"], "Kiểu nền banner không hợp lệ"),
        video: z.object({ src: videoUrl, poster: videoUrl }),
      })
      .superRefine((b, ctx) => {
        if (b.mode === "video" && !b.video.src)
          ctx.addIssue({
            code: "custom",
            path: ["video", "src"],
            message: "Chưa chọn video nền cho banner",
          });
      }),
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
    items: cards(
      z.object({ title: text("tên chuẩn mực", 80), desc: text("mô tả chuẩn mực", 300) }),
      1,
      10,
      "Chuẩn mực sản xuất",
    ),
  }),
  values: z.object({
    eyebrow: text("dòng nhỏ khối khách hàng tin tưởng", 60),
    titleLead: text("tiêu đề khối khách hàng tin tưởng", 80),
    titleAccent: text("phần tiêu đề màu cam", 60),
    description: text("mô tả khối khách hàng tin tưởng", 300),
    items: cards(
      z.object({ title: text("tên giá trị", 40), desc: text("mô tả giá trị", 200), image }),
      1,
      6,
      "Khối khách hàng tin tưởng",
    ),
  }),
  ecosystem: z.object({
    eyebrow: text("dòng nhỏ hệ sinh thái", 60),
    tagline: text("khẩu hiệu hệ sinh thái", 60),
    items: cards(
      z.object({
        name: text("tên dịch vụ", 100),
        desc: text("mô tả dịch vụ", 200),
        // Liên kết của thẻ: trang trong website (bắt đầu bằng /) hoặc địa chỉ https
        href: z
          .string()
          .trim()
          .max(300)
          .regex(/^(\/(?!\/)|https:\/\/)\S*$/, "Liên kết phải bắt đầu bằng / hoặc https://")
          .default("/dich-vu"),
        image,
      }),
      1,
      12,
      "Hệ sinh thái dịch vụ",
    ),
  }),
});

/**
 * Các trang còn lại (home, services, site, products): cây nội dung tự do nhưng CÓ GIỚI HẠN —
 * độ sâu, số nút, độ dài chữ, tên khoá, và mọi ô địa chỉ (src, poster, href…) chỉ nhận đường dẫn an toàn.
 * Hình dạng đầy đủ do website tự gộp với nội dung mặc định nên thiếu / thừa trường không làm vỡ trang.
 */
const URL_KEYS = new Set(["src", "poster", "href", "link", "logo", "image", "video", "url"]);
const SAFE_URL = /^(\/(?!\/)|https:\/\/|mailto:|tel:)\S*$/i;
const MAX_DEPTH = 8;
const MAX_NODES = 4000;
const MAX_TEXT = 3000;

export const treeSchema = z.record(z.string(), z.unknown()).superRefine((root, ctx) => {
  let nodes = 0;
  const bad = (path, message) => ctx.addIssue({ code: "custom", path, message });
  const walk = (node, path, depth) => {
    if (ctx.issues.length > 5) return;
    if (++nodes > MAX_NODES) return bad(path, "Nội dung quá lớn");
    if (depth > MAX_DEPTH) return bad(path, "Nội dung lồng quá sâu");
    if (node === null || typeof node === "boolean") return;
    if (typeof node === "number")
      return Number.isFinite(node) ? undefined : bad(path, "Số không hợp lệ");
    if (typeof node === "string") {
      if (node.length > MAX_TEXT) return bad(path, `Chữ tối đa ${MAX_TEXT} ký tự`);
      const key = String(path[path.length - 1]);
      if (URL_KEYS.has(key) && node && !SAFE_URL.test(node))
        return bad(path, "Đường dẫn phải bắt đầu bằng /, https://, mailto: hoặc tel:");
      return;
    }
    if (Array.isArray(node)) {
      if (node.length > 80) return bad(path, "Danh sách quá dài");
      return node.forEach((v, i) => walk(v, [...path, i], depth + 1));
    }
    if (typeof node === "object") {
      for (const [k, v] of Object.entries(node)) {
        if (!/^[A-Za-z0-9_-]{1,40}$/.test(k)) return bad(path, "Tên trường không hợp lệ");
        walk(v, [...path, k], depth + 1);
      }
      return;
    }
    bad(path, "Kiểu dữ liệu không hợp lệ");
  };
  walk(root, [], 0);
});

/** Schema kiểm tra theo trang: Về chúng tôi chặt chẽ từng ô; các trang khác dùng cây có giới hạn. */
export const SCHEMAS = Object.fromEntries(
  CONTENT_KEYS.map((k) => [k, k === "about" ? aboutSchema : treeSchema]),
);
export const contentKeySchema = z.object({ key: z.enum(CONTENT_KEYS, "Trang không tồn tại") });
