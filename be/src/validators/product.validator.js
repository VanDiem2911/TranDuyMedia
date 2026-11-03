import { z } from "zod";
import { MEDIA_ITEM_TYPES, PRODUCT_KINDS } from "#models/product.model.js";
import { objectId } from "#validators/common.validator.js";

// Điểm giữ lại khi cắt khung: từ khoá cũ hoặc "x% y%" (do công cụ cắt ảnh ở trang quản trị tạo ra)
const position = z
  .string()
  .trim()
  .regex(
    /^(center|top|bottom|left|right|\d{1,3}(\.\d{1,2})?% \d{1,3}(\.\d{1,2})?%)$/,
    "Vị trí cắt ảnh không hợp lệ",
  );
const httpsUrl = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => /^https:\/\//i.test(v) || v.startsWith("/"), "Đường dẫn tệp phải dùng https");

const mediaItem = z.object({
  type: z.enum(MEDIA_ITEM_TYPES),
  url: httpsUrl,
  publicId: z.string().max(300).nullish().default(null),
  poster: httpsUrl.nullish().default(null),
  pos: position.default("center"),
  zoom: z.number().min(1).max(4).default(1),
  width: z.number().int().positive().nullish(),
  height: z.number().int().positive().nullish(),
  duration: z.number().nonnegative().nullish(),
  frames: z.array(httpsUrl).max(4).optional(),
  alt: z.string().trim().max(300).optional().default(""),
});

const imageItem = mediaItem.extend({
  type: z.literal("image", "Ảnh đại diện / ảnh nổi bật phải là ảnh"),
});

const text = (label, max, min = 0) =>
  z
    .string({ error: `Vui lòng nhập ${label}` })
    .trim()
    .min(min, min ? `Vui lòng nhập ${label}` : undefined)
    .max(max, `${label[0].toUpperCase() + label.slice(1)} tối đa ${max} ký tự`);

const base = {
  title: text("tên sản phẩm", 120, 2),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Đường dẫn chỉ gồm chữ thường không dấu, số và dấu -")
    .max(120)
    .optional(),
  category: text("thể loại", 60, 2),
  summary: text("mô tả ngắn", 200, 5),
  description: text("mô tả chi tiết", 3000).optional().default(""),
  usage: text("ứng dụng", 300).optional().default(""),
  location: text("bối cảnh", 120).optional().default(""),
  studioSet: z.string().trim().max(60).nullish().default(null),
  kind: z.enum(PRODUCT_KINDS).default("photo"),
  media: z
    .array(mediaItem)
    .min(1, "Cần ít nhất 1 ảnh hoặc video")
    .max(60, "Mỗi sản phẩm chỉ chứa tối đa 60 ảnh và video"),
  // Ảnh đại diện (cover — thẻ sản phẩm) + ảnh nổi bật chọn RIÊNG, độc lập với nhau và với thư viện.
  // Bỏ trống → website tự lấy từ thư viện (ảnh, hoặc ảnh đại diện video nếu chỉ có video).
  cover: imageItem.nullable().default(null),
  featured: z.array(imageItem).max(3, "Tối đa 3 ảnh nổi bật").default([]),
  published: z.boolean().default(true),
};

export const createProductSchema = z.object(base);
// Cập nhật một phần: BỎ giá trị mặc định — trường không gửi lên phải giữ nguyên trong DB
// (vd. bấm ẩn/hiện chỉ gửi { published } không được xoá trắng mô tả, bối cảnh, ảnh bìa…)
export const updateProductSchema = z
  .object(
    Object.fromEntries(
      Object.entries(base).map(([k, v]) => [
        k,
        (v instanceof z.ZodDefault ? v.unwrap() : v).optional(),
      ]),
    ),
  )
  .refine((v) => Object.keys(v).length > 0, "Không có thay đổi nào");

export const productIdSchema = z.object({ id: objectId });
export const productSlugSchema = z.object({ slug: z.string().trim().toLowerCase().max(120) });
export const listProductsQuerySchema = z.object({ q: z.string().trim().max(100).optional() });
export const importMediaSchema = z.object({
  url: z
    .url("Link không hợp lệ")
    .refine((v) => /^https?:\/\//i.test(v), "Link phải bắt đầu bằng http(s)://"),
  folder: z
    .string()
    .trim()
    .regex(/^[a-z0-9/_-]*$/i)
    .max(120)
    .optional()
    .default(""),
});
