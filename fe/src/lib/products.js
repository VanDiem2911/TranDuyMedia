import { cacheLife, cacheTag } from "next/cache";
import { fillTrio } from "@/lib/header-collage";
import { mediaCount } from "@/lib/media-count";

/**
 * Sản phẩm đã thực hiện — lấy từ backend (MongoDB), chỉ dùng phía server.
 * Kết quả được cache (tag "products"); trang quản trị gọi /api/revalidate sau khi thêm / sửa / xoá
 * để website cập nhật ngay. Backend lỗi → trả danh sách rỗng thay vì làm sập trang.
 */
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";
export const PRODUCTS_TAG = "products";

/** Dữ liệu API → dạng các component đang dùng (ProductCard, AlbumGallery…). */
export function toView(p) {
  const media = (p.media ?? []).map((m) => ({
    // video / link nhúng chưa có ảnh đại diện → src null: thư viện tự lấy khung hình thật của video
    // (thay vì gắn tạm một ảnh không liên quan, sai cả nội dung lẫn tỉ lệ khung).
    // Ảnh dùng BẢN GỐC trên Cloudinary: next/image thu nhỏ + nén WebP từ bản gốc đúng 1 lần → nét nhất
    // (không đi qua bản WebP nén sẵn của Cloudinary rồi mới nén thêm lần nữa).
    src: m.type === "image" ? m.url : (m.poster ?? null),
    pos: m.pos ?? "center",
    zoom: m.zoom ?? 1,
    width: m.width ?? null,
    height: m.height ?? null,
    type: m.type, // image | video | embed
    url: m.url,
    poster: m.poster,
    duration: m.duration ?? null,
    frames: m.frames ?? [],
    alt: m.alt || p.title,
  }));
  // Thư viện: video / link nhúng đứng trước, ảnh sau (ảnh bìa & cụm ảnh tiêu biểu vẫn chỉ lấy ẢNH — xem dưới)
  const images = media.length
    ? [...media.filter((m) => m.type !== "image"), ...media.filter((m) => m.type === "image")]
    : [{ src: "/images/og-image.png", pos: "center", type: "image" }];
  // Ảnh bìa (p.cover) và ảnh nổi bật (p.featured, ≤ 3) chọn RIÊNG ở trang quản trị, độc lập với nhau.
  // Bỏ trống → tự lấy từ thư viện: ẢNH trước (video chỉ hiện trong thư viện), không có ảnh → ảnh đại diện video.
  const photos = images.filter((m) => m.type === "image");
  const asView = (m) => ({
    src: m.url,
    pos: m.pos ?? "center",
    zoom: m.zoom ?? 1,
    width: m.width ?? null,
    height: m.height ?? null,
    type: "image",
    url: m.url,
    alt: m.alt || p.title,
  });
  // Chỉ có video → ảnh đại diện của từng video, rồi tới các cảnh phụ (frames) tự chụp từ video
  const scenes = images.flatMap((m) =>
    (m.frames ?? []).map((u) => ({
      src: u,
      pos: "center",
      zoom: 1,
      // Cảnh chụp từ video → cùng kích thước video: next/image tính đúng bản cần tải khi cắt khung dọc (nét)
      width: m.width,
      height: m.height,
      type: "image",
      url: u,
      alt: m.alt,
    })),
  );
  const auto = photos.length ? photos : [...images.filter((m) => m.poster), ...scenes];
  const picked = (p.featured ?? []).filter((m) => m?.url).map(asView);
  const featured = [...picked, ...auto.filter((m) => !picked.some((c) => c.src === m.src))];
  const cover = (p.cover?.url && asView(p.cover)) ??
    auto[0] ?? { src: "/images/bts/bts-05.webp", pos: "center", type: "image" };
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    category: p.category,
    summary: p.summary,
    description: p.description,
    usage: p.usage,
    setName: p.location,
    set: p.studioSet,
    kind: p.kind,
    // Số lượng hiển thị theo đúng loại tệp: "15 ảnh · 01 video", "03 video", "16 ảnh"
    count: mediaCount(media),
    cover,
    covers: fillTrio(featured.length ? featured : [cover]),
    // Sản phẩm chỉ có video (không có ảnh) → nút "Xem video" ở đầu trang + mục "Video sản phẩm"
    videoOnly: photos.length === 0 && images.some((m) => m.type !== "image"),
    images,
    // Cảnh phụ của video → thêm vào ảnh bìa ghép đầu trang cho đa dạng
    scenes: scenes.map((m) => m.src),
  };
}

/**
 * Bổ sung kích thước cho ảnh chưa có (ảnh mẫu lưu trong /public) — thư viện ảnh cần tỉ lệ thật
 * để xếp hàng ngay ngắn. Ảnh trên Cloudinary đã có sẵn width/height lúc tải lên.
 */
async function withSizes(view) {
  const missing = view.images.filter((m) => !(m.width && m.height) && m.src?.startsWith("/"));
  if (!missing.length) return view;
  const [{ default: sharp }, { join }] = await Promise.all([import("sharp"), import("node:path")]);
  await Promise.all(
    missing.map(async (m) => {
      try {
        const { width, height } = await sharp(join(process.cwd(), "public", m.src)).metadata();
        Object.assign(m, { width, height });
      } catch {
        // không đọc được → thư viện tự đo khi ảnh tải xong
      }
    }),
  );
  return view;
}

async function request(path) {
  const res = await fetch(`${BACKEND_URL}/api/v1${path}`, {
    headers: { accept: "application/json" },
    // Bộ nhớ đệm do "use cache" + cacheTag(PRODUCTS_TAG) quản lý. Không để fetch-cache của Next lưu thêm
    // một lớp không gắn tag — lớp đó khiến trang vẫn hiện dữ liệu cũ sau khi quản trị bấm Lưu.
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Backend ${res.status}`);
  return (await res.json()).data;
}

// LỖI KẾT NỐI không được cache: hàm "use cache" ném lỗi ra ngoài (Next không lưu kết quả lỗi), hàm bọc bên
// ngoài mới xử lý → backend chập chờn vài giây không làm trang bị "trống" / "404" suốt nhiều phút.
async function cachedProducts() {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  cacheLife("minutes");
  // Kích thước ảnh thật → thẻ sản phẩm chọn đúng bản ảnh đủ nét cho khung đóng sẵn
  return Promise.all(((await request("/products")) ?? []).map((p) => withSizes(toView(p))));
}

export async function getProducts() {
  try {
    return await cachedProducts();
  } catch {
    return [];
  }
}

/**
 * Sản phẩm theo slug: null CHỈ khi backend trả 404 (thật sự không có → trang 404).
 * Lỗi kết nối → ném lỗi (không cache) để trang báo lỗi tạm thời, lần tải sau tự lấy lại.
 */
export async function getProduct(slug) {
  "use cache";
  cacheTag(PRODUCTS_TAG);
  cacheLife("minutes");
  const p = await request(`/products/${encodeURIComponent(slug)}`);
  return p ? withSizes(toView(p)) : null;
}

/**
 * "Sản phẩm khác" — đề xuất tự động theo mức liên quan với sản phẩm đang xem:
 * cùng danh mục (+6) · cùng loại ảnh / video (+3) · cùng bối cảnh studio (+2) · trùng từ khoá trong
 * danh mục / tiêu đề (+1 mỗi từ). Bằng điểm → ưu tiên sản phẩm đứng gần trong danh sách (thứ tự quản trị).
 * Lấy tối đa 2 sản phẩm liên quan nhất + 1 sản phẩm khác loại (nếu có) để người xem khám phá thêm.
 */
const STOP = new Set(["và", "cho", "của", "video", "ảnh", "bộ", "-", "&", "the", "a"]);
const words = (s = "") =>
  new Set(
    s
      .toLowerCase()
      .normalize("NFC")
      .split(/[^\p{L}\p{N}]+/u)
      .filter((w) => w.length > 1 && !STOP.has(w)),
  );

export function relatedProducts(current, products, n = 3) {
  const idx = products.findIndex((x) => x.slug === current.slug);
  const key = words(`${current.category} ${current.title}`);
  const scored = products
    .filter((x) => x.slug !== current.slug)
    .map((x, i) => {
      let score = 0;
      if (x.category === current.category) score += 6;
      if (x.kind && x.kind === current.kind) score += 3;
      if (x.set && x.set === current.set) score += 2;
      for (const w of words(`${x.category} ${x.title}`)) if (key.has(w)) score += 1;
      const pos = products.indexOf(x);
      return { x, score, dist: Math.abs(pos - (idx < 0 ? i : idx)) };
    })
    .sort((a, b) => b.score - a.score || a.dist - b.dist);

  const picked = scored.slice(0, Math.max(0, n - 1)).map((s) => s.x);
  // Ô cuối: 1 sản phẩm khác loại (ảnh ↔ video) gần nhất để gợi mở thêm; không có thì lấy tiếp theo điểm
  const different = scored.find((s) => s.x.kind !== current.kind && !picked.includes(s.x));
  const next = different ?? scored.find((s) => !picked.includes(s.x));
  if (next && picked.length < n) picked.push(next.x);
  return picked;
}
