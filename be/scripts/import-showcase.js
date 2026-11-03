/**
 * Nhập clip sản phẩm từ Google Drive → nén → Cloudinary → MongoDB + website.
 *
 *   npm run media:showcase                → xử lý mọi clip trong scripts/showcase.json (bỏ qua clip đã có)
 *   npm run media:showcase -- --force     → nén & tải lên lại tất cả (ghi đè trên Cloudinary)
 *   npm run media:showcase -- --only short-move-1,event-launch
 *   npm run media:showcase -- --no-db     → chỉ nén + tải lên + ghi fe/src/data/media-library.json
 *   npm run media:showcase -- --cache D:\media-cache   (mặc định: be/.cache/media hoặc MEDIA_CACHE_DIR)
 *
 * Quy trình cho mỗi clip:
 *   1. Tải tệp gốc từ Drive (tệp phải chia sẻ "Bất kỳ ai có link") vào thư mục cache — chỉ tải 1 lần.
 *   2. Nén H.264 (MP4, +faststart): ngang tối đa 1920px / dọc tối đa 1920px cao, ≤ 30 fps, CRF 22
 *      kèm trần bitrate để tệp luôn < ~95MB (giới hạn 100MB/video của Cloudinary gói Free) — vẫn sắc nét.
 *   3. Tải lên Cloudinary: <CLOUDINARY_FOLDER>/showcase/<key> (public_id cố định → chạy lại không tạo bản trùng).
 *   4. Ghi fe/src/data/media-library.json (ID Drive → link video, ảnh bìa, kích thước) — các trang dịch vụ
 *      phát clip từ đây thay cho trình phát Drive.
 *   5. Tạo / cập nhật sản phẩm (kind "video") ở MongoDB → hiện ở /san-pham (website tự làm mới sau vài phút).
 *
 * Cần: be/.env có CLOUDINARY_* và MONGODB_URI; ffmpeg (gói ffmpeg-static đã kèm, hoặc ffmpeg trong PATH).
 */
import { execFile } from "node:child_process";
import { createWriteStream, existsSync, statSync } from "node:fs";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { promisify } from "node:util";
import { cloudinary } from "#config/cloudinary.js";
import { connectDatabase, disconnectDatabase } from "#config/database.js";
import { env } from "#config/env.js";
import { Product } from "#models/product.model.js";

const run = promisify(execFile);
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const force = flag("force");
const noDb = flag("no-db");
const only = opt("only")
  ?.split(",")
  .map((s) => s.trim());
const root = path.resolve(import.meta.dirname, "..", "..");
const cacheDir = path.resolve(
  opt("cache") || process.env.MEDIA_CACHE_DIR || path.join(root, "be", ".cache", "media"),
);
const libraryFile = path.join(root, "fe", "src", "data", "media-library.json");
const manifest = JSON.parse(
  await readFile(path.join(import.meta.dirname, "showcase.json"), "utf8"),
);

const MAX_MB = 95; // giới hạn Cloudinary Free là 100MB/video
const AUDIO_KBPS = 128;

async function ffmpegPath() {
  try {
    const { default: p } = await import("ffmpeg-static");
    if (p && existsSync(p)) return p;
  } catch {
    /* không có gói → dùng ffmpeg trong PATH */
  }
  return "ffmpeg";
}
const FFMPEG = await ffmpegPath();

const mb = (bytes) => `${(bytes / 1048576).toFixed(1)}MB`;
const log = (key, msg) => console.log(`[${key}] ${msg}`);

/** Tải tệp gốc từ Drive (đã có trong cache thì bỏ qua). */
async function download(clip) {
  const file = path.join(cacheDir, `${clip.drive}.src`);
  if (existsSync(file) && statSync(file).size > 0) return file;
  log(clip.key, "tải từ Drive...");
  const res = await fetch(
    `https://drive.usercontent.google.com/download?id=${clip.drive}&export=download&confirm=t`,
  );
  const type = res.headers.get("content-type") || "";
  // Drive trả trang HTML khi tệp chưa chia sẻ công khai / bị giới hạn; .mov có thể là application/octet-stream
  if (!res.ok || type.includes("text/html")) {
    throw new Error(
      `Không tải được (HTTP ${res.status}, ${type}) — kiểm tra quyền chia sẻ của tệp trên Drive`,
    );
  }
  await pipeline(Readable.fromWeb(res.body), createWriteStream(`${file}.part`));
  await rename(`${file}.part`, file);
  log(clip.key, `đã tải ${mb(statSync(file).size)}`);
  return file;
}

/** Đọc thời lượng, kích thước hiển thị (đã tính xoay), fps từ thông tin ffmpeg in ra. */
async function probe(file) {
  const out = await run(FFMPEG, ["-hide_banner", "-i", file]).catch((e) => ({ stderr: e.stderr }));
  const text = out.stderr || "";
  const d = text.match(/Duration: (\d+):(\d+):([\d.]+)/);
  const v = text.match(/Video:.*?, (\d{2,5})x(\d{2,5})/);
  const fps = text.match(/([\d.]+) fps/);
  const rot = text.match(/rotation of (-?[\d.]+)/);
  if (!d || !v) throw new Error("Không đọc được thông tin video");
  let [w, h] = [Number(v[1]), Number(v[2])];
  if (rot && Math.abs(Number(rot[1])) % 180 === 90) [w, h] = [h, w];
  return {
    duration: Number(d[1]) * 3600 + Number(d[2]) * 60 + Number(d[3]),
    width: w,
    height: h,
    fps: fps ? Number(fps[1]) : 30,
  };
}

/** Nén cho web: H.264 + AAC, faststart, cạnh dài ≤ 1920, ≤ 30fps, CRF 22 có trần bitrate theo thời lượng. */
async function encode(clip, src) {
  const out = path.join(cacheDir, `${clip.key}.web.mp4`);
  if (!force && existsSync(out) && statSync(out).size > 0) return out;
  const info = await probe(src);
  const landscape = info.width >= info.height;
  const scale = landscape
    ? info.width > 1920
      ? "scale=1920:-2"
      : null
    : info.height > 1920
      ? "scale=-2:1920"
      : null;
  const filters = [scale, info.fps > 30.5 ? "fps=30" : null].filter(Boolean).join(",");
  // Trần bitrate: đủ nét (≤ 6–8 Mbps) nhưng tổng dung lượng không vượt MAX_MB
  const budget = Math.floor((MAX_MB * 8 * 1024) / info.duration) - AUDIO_KBPS;
  const maxrate = Math.max(1200, Math.min(landscape ? 6000 : 8000, budget));
  log(
    clip.key,
    `nén ${info.width}x${info.height} ${info.duration.toFixed(0)}s → tối đa ${maxrate}kbps...`,
  );
  await run(
    FFMPEG,
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      src,
      ...(filters ? ["-vf", filters] : []),
      // clip dài > 2 phút: preset medium (nhanh ~2 lần, cùng trần bitrate nên độ nét gần như không đổi)
      "-c:v",
      "libx264",
      "-preset",
      info.duration > 120 ? "medium" : "slow",
      "-crf",
      "22",
      "-maxrate",
      `${maxrate}k`,
      "-bufsize",
      `${maxrate * 2}k`,
      "-profile:v",
      "high",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      `${AUDIO_KBPS}k`,
      "-ac",
      "2",
      "-movflags",
      "+faststart",
      `${out}.part.mp4`,
    ],
    { maxBuffer: 1 << 26 },
  );
  await rename(`${out}.part.mp4`, out);
  log(clip.key, `đã nén ${mb(statSync(src).size)} → ${mb(statSync(out).size)}`);
  return out;
}

/** Đưa lên Cloudinary (đã có & không --force → dùng bản sẵn có). */
async function upload(clip, file) {
  const publicId = `${env.CLOUDINARY_FOLDER}/showcase/${clip.key}`;
  if (!force) {
    const found = await cloudinary.api
      .resource(publicId, { resource_type: "video" })
      .catch(() => null);
    if (found) return found;
  }
  log(clip.key, "tải lên Cloudinary...");
  return new Promise((resolve, reject) =>
    cloudinary.uploader.upload_large(
      file,
      { resource_type: "video", public_id: publicId, overwrite: true, chunk_size: 20_000_000 },
      (err, result) => (err ? reject(err) : resolve(result)),
    ),
  );
}

/**
 * Ảnh bìa: tự trích khung hình tại clip.posterAt (giây) từ VIDEO GỐC (độ phân giải cao nhất, không qua bản nén)
 * → WebP chất lượng cao (cạnh dài ≤ 2560) → Cloudinary (ảnh) — đủ nét khi làm nền tràn màn hình.
 * Không dùng ảnh bìa tự sinh của Cloudinary (so_auto): gói Free không tạo được cho video > ~40MB và hay chọn
 * nhầm màn chữ. Ảnh đã có & cùng posterAt → dùng lại (đổi posterAt trong showcase.json để chọn khung khác).
 */
const POSTER_V = 2; // tăng khi đổi cách tạo ảnh bìa → tạo lại toàn bộ
async function poster(clip, file, prev) {
  const publicId = `${env.CLOUDINARY_FOLDER}/showcase/${clip.key}-poster`;
  const at = clip.posterAt ?? 3;
  if (
    !force &&
    prev?.posterV === POSTER_V &&
    prev?.posterAt === at &&
    prev.poster?.includes(`/${clip.key}-poster`)
  )
    return prev.poster;
  const out = path.join(cacheDir, `${clip.key}.poster.webp`);
  await run(FFMPEG, [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-ss",
    String(at),
    "-i",
    file,
    "-frames:v",
    "1",
    "-vf",
    "scale='min(2560,iw)':'min(2560,ih)':force_original_aspect_ratio=decrease:flags=lanczos",
    "-c:v",
    "libwebp",
    "-quality",
    "92",
    out,
  ]);
  const r = await cloudinary.uploader.upload(out, {
    resource_type: "image",
    public_id: publicId,
    overwrite: true,
    invalidate: true,
  });
  log(clip.key, `ảnh bìa (giây ${at}) → ${r.secure_url}`);
  return r.secure_url;
}

/**
 * Ảnh tĩnh cắt từ video (stills của sản phẩm) → WebP → Cloudinary (ảnh). public_id cố định theo clip + giây
 * → chạy lại không tạo bản trùng (đã có thì dùng lại, trừ khi --force).
 */
async function still(clipKey, at) {
  const clip = manifest.clips.find((c) => c.key === clipKey);
  if (!clip) throw new Error(`Không có clip "${clipKey}" trong showcase.json`);
  const tag = String(at).replace(".", "_");
  const publicId = `${env.CLOUDINARY_FOLDER}/showcase/stills/${clipKey}-${tag}`;
  if (!force) {
    const found = await cloudinary.api.resource(publicId).catch(() => null);
    if (found) return { ...found, alt: clip.title };
  }
  const file = await encode(clip, await download(clip));
  const out = path.join(cacheDir, `${clipKey}-${tag}.still.webp`);
  await run(FFMPEG, [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-ss",
    String(at),
    "-i",
    file,
    "-frames:v",
    "1",
    "-vf",
    "scale='min(1920,iw)':'min(1920,ih)':force_original_aspect_ratio=decrease",
    "-c:v",
    "libwebp",
    "-quality",
    "88",
    out,
  ]);
  const r = await cloudinary.uploader.upload(out, {
    resource_type: "image",
    public_id: publicId,
    overwrite: true,
  });
  log(clipKey, `ảnh tĩnh giây ${at} → ${r.secure_url}`);
  return { ...r, alt: clip.title };
}

// ---------------------------------------------------------------------------------------------
if (!env.hasCloudinary) throw new Error("Chưa cấu hình CLOUDINARY_* trong be/.env");
await mkdir(cacheDir, { recursive: true });
console.log(`ffmpeg: ${FFMPEG}\ncache: ${cacheDir}`);

const library = existsSync(libraryFile) ? JSON.parse(await readFile(libraryFile, "utf8")) : {};
const assets = new Map(); // key → media item
const failed = [];

for (const clip of manifest.clips) {
  if (only && !only.includes(clip.key)) continue;
  try {
    const src = await download(clip);
    const file = await encode(clip, src);
    const r = await upload(clip, file);
    const meta = await probe(file); // bản đã nén (api.resource của Cloudinary không trả thời lượng)
    const item = {
      type: "video",
      url: r.secure_url,
      publicId: r.public_id,
      poster: await poster(clip, src, library[clip.drive]),
      pos: clip.posterPos ?? "center", // điểm giữ lại khi cắt ảnh bìa vào khung khác tỉ lệ
      width: r.width ?? meta.width,
      height: r.height ?? meta.height,
      duration: Math.round(r.duration ?? meta.duration),
      alt: clip.title,
    };
    assets.set(clip.key, item);
    library[clip.drive] = {
      key: clip.key,
      title: clip.title,
      url: item.url,
      poster: item.poster,
      width: item.width,
      height: item.height,
      duration: item.duration,
      posterAt: clip.posterAt ?? 3,
      posterV: POSTER_V,
      pos: item.pos,
    };
    log(clip.key, `xong → ${item.url}`);
  } catch (err) {
    failed.push(clip.key);
    log(clip.key, `LỖI: ${err.message}`);
  }
}

// Clip không xử lý trong lần chạy này (--only) nhưng đã có trên Cloudinary → vẫn dùng cho sản phẩm
for (const clip of manifest.clips) {
  if (assets.has(clip.key) || !library[clip.drive]) continue;
  const l = library[clip.drive];
  assets.set(clip.key, {
    type: "video",
    url: l.url,
    publicId: `${env.CLOUDINARY_FOLDER}/showcase/${clip.key}`,
    poster: l.poster,
    pos: clip.posterPos ?? "center",
    width: l.width,
    height: l.height,
    duration: l.duration,
    alt: clip.title,
  });
}

const sorted = Object.fromEntries(Object.entries(library).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(libraryFile, JSON.stringify(sorted, null, 2) + "\n");
console.log(`\nĐã ghi ${path.relative(root, libraryFile)} (${Object.keys(sorted).length} clip)`);

if (!noDb) {
  await connectDatabase(undefined, { retries: 1 });
  try {
    // Sản phẩm video xếp trước các bộ ảnh (order âm)
    for (const [i, p] of manifest.products.entries()) {
      const videos = p.clips.map((k) => assets.get(k)).filter(Boolean);
      const photos = [];
      for (const [k, at] of p.stills ?? []) {
        try {
          const r = await still(k, at);
          photos.push({
            type: "image",
            url: r.secure_url,
            publicId: r.public_id,
            width: r.width,
            height: r.height,
            alt: r.alt,
          });
        } catch (err) {
          console.log(`  ảnh tĩnh ${k}@${at} lỗi: ${err.message}`);
        }
      }
      const media = [...photos, ...videos];
      if (!videos.length) {
        console.log(`↷ ${p.slug}: chưa có clip nào trên Cloudinary — bỏ qua`);
        continue;
      }
      const { clips, stills, ...fields } = p; // eslint-disable-line no-unused-vars
      await Product.findOneAndUpdate(
        { slug: p.slug, deletedAt: null },
        { ...fields, kind: "video", media, published: true, order: -100 + i },
        { upsert: true, setDefaultsOnInsert: true },
      );
      console.log(`✓ Sản phẩm ${p.slug} (${photos.length} ảnh · ${videos.length} video)`);
    }
    // Sản phẩm video do script tạo trước đây nhưng không còn trong showcase.json → xoá mềm (khôi phục được)
    const keep = manifest.products.map((p) => p.slug);
    const stale = await Product.find({
      deletedAt: null,
      kind: "video",
      slug: { $nin: keep },
      "media.publicId": { $regex: `^${env.CLOUDINARY_FOLDER}/showcase/` },
    }).select("slug");
    for (const p of stale) {
      await Product.updateOne(
        { _id: p._id },
        { deletedAt: new Date(), deletedBy: "media:showcase" },
      );
      console.log(`✗ Ẩn sản phẩm cũ ${p.slug} (không còn trong showcase.json)`);
    }
  } finally {
    await disconnectDatabase();
  }
}

if (failed.length) {
  console.log(`\nClip lỗi: ${failed.join(", ")} — chạy lại script để thử tiếp`);
  process.exitCode = 1;
}
