"use client";

import { siteConfig } from "@/config/site";
import { api, ApiError, refreshSession } from "@/lib/api";
import { toast } from "@/lib/toast";
import { MAX_IMAGE_MB, MAX_VIDEO_MB } from "./media-utils";
import { deleteJob, putJob, saveState } from "./upload-store";

/**
 * Hàng đợi lưu sản phẩm chạy NỀN: bấm "Lưu" → popup đóng ngay, việc tải tệp lên Cloudinary và ghi
 * dữ liệu diễn ra phía sau, tiến độ hiện trên toast. Người dùng vẫn thao tác tiếp được.
 * - Tệp từ máy: upload qua XHR để có % tiến độ (fetch không báo tiến độ upload).
 * - Link: backend nhập về Cloudinary (hoặc giữ dạng nhúng với YouTube / Vimeo).
 * - Lỗi: giữ lại bản nháp để "Mở lại & thử lại" mà không mất dữ liệu đã nhập.
 * - Chuyển trang trong website: vẫn tải tiếp (hàng đợi nằm ngoài component).
 * - Trang bị tải lại / đóng tab: bản nháp + tệp + phần video đã tải được lưu ở IndexedDB (upload-store.js) →
 *   lần mở website kế tiếp tự tải tiếp từ phần đang dở (UploadResumer).
 */
let jobs = [];
const listeners = new Set();
const emit = () => listeners.forEach((l) => l(jobs));
export const subscribeJobs = (fn) => {
  listeners.add(fn);
  fn(jobs);
  return () => listeners.delete(fn);
};
const setJob = (id, patch) => {
  jobs = jobs.map((j) => (j.id === id ? { ...j, ...patch } : j));
  emit();
};
export const dismissJob = (id) => {
  jobs = jobs.filter((j) => j.id !== id);
  emit();
};
export const hasRunningJobs = () => jobs.some((j) => j.status === "running");
/** "Bỏ qua" / "Mở lại & thử lại": xoá cả bản lưu tạm → lần mở website sau KHÔNG tự chạy lại bản cũ. */
export const discardJob = (id) => {
  dismissJob(id);
  deleteJob(id);
};

// Cảnh báo khi đóng tab lúc đang tải
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", (e) => {
    if (hasRunningJobs()) e.preventDefault();
  });
}

/**
 * Tải 1 tệp lên, tiến độ 0–1. Ưu tiên TẢI THẲNG lên Cloudinary (uploadDirect): tệp chỉ đi 1 chặng thay vì
 * trình duyệt → máy chủ → Cloudinary, và % tiến độ là thật tới khi Cloudinary nhận xong.
 * Mạng / trình duyệt chặn kết nối tới Cloudinary → tự chuyển sang tải qua máy chủ như trước.
 */
async function uploadFile(file, folder, onProgress, ckpt) {
  try {
    return await uploadDirect(file, folder, onProgress, ckpt);
  } catch (err) {
    // Đã gửi được một phần / tệp đã nằm trên Cloudinary (chỉ lỗi bước xác nhận) → không tải lại cả tệp qua
    // máy chủ (tránh tệp trùng); giữ điểm dừng để lần sau tải tiếp.
    if (err?.status !== 0 || err.partial) throw err;
    onProgress(0);
    return uploadViaServer(file, folder, onProgress);
  }
}

/** Gửi 1 yêu cầu multipart bằng XHR (fetch không báo tiến độ upload). onProgress nhận số byte đã gửi. */
function xhrPost(url, fd, { headers = {}, onProgress } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded);
    xhr.onerror = () => reject(new ApiError(0, null));
    xhr.onload = () => {
      let body = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300) return resolve(body);
      // Cloudinary trả { error: { message } } → mã riêng để describeError nói rõ lý do
      reject(
        new ApiError(xhr.status, {
          error: { message: body?.error?.message, code: "CLOUDINARY_UPLOAD" },
        }),
      );
    };
    xhr.send(fd);
  });
}

/**
 * Tải thẳng lên Cloudinary bằng chữ ký do backend cấp. Video > 20MB chia từng phần 20MB (chunked upload
 * của Cloudinary) — mỗi phần lỗi mạng được thử lại 2 lần, không phải tải lại từ đầu.
 * Xong → báo backend xác nhận (kiểm chữ ký kết quả + ghi metadata), trả về đúng dạng như tải qua máy chủ.
 * ckpt { upId, next, save(next) }: tải tiếp từ phần thứ `next` của lần tải có mã upId (sau khi trang tải lại);
 * mỗi phần xong gọi save() để ghi lại điểm dừng.
 */
async function uploadDirect(file, folder, onProgress, ckpt) {
  const sign = (await api("/media/sign", { method: "POST", body: { folder } })).data;
  const kind = file.type.startsWith("video/") ? "video" : "image";
  const url = `https://api.cloudinary.com/v1_1/${sign.cloudName}/${kind}/upload`;
  const form = (blob) => {
    const fd = new FormData();
    fd.append("file", blob, file.name);
    fd.append("api_key", sign.apiKey);
    fd.append("signature", sign.signature);
    for (const [k, v] of Object.entries(sign.params)) fd.append(k, String(v));
    return fd;
  };
  const send = async (blob, headers, base) => {
    for (let attempt = 0; ; attempt++) {
      try {
        return await xhrPost(url, form(blob), {
          headers,
          onProgress: (b) => onProgress(Math.min(0.99, (base + b) / file.size)),
        });
      } catch (err) {
        if (err.status !== 0 || attempt >= 2) throw err;
      }
    }
  };

  let r;
  const mark = (err) => {
    err.partial = true;
    return err;
  };
  if (file.size <= sign.chunkSize) r = await send(file, {}, 0);
  else {
    const id = ckpt?.upId ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    const parts = Math.ceil(file.size / sign.chunkSize);
    for (let k = ckpt?.next ?? 0; k < parts; k++) {
      const start = k * sign.chunkSize;
      const end = Math.min(start + sign.chunkSize, file.size);
      try {
        r = await send(
          file.slice(start, end),
          { "X-Unique-Upload-Id": id, "Content-Range": `bytes ${start}-${end - 1}/${file.size}` },
          start,
        );
      } catch (err) {
        throw k > 0 ? mark(err) : err;
      }
      if (k < parts - 1) await ckpt?.save({ upId: id, next: k + 1 });
    }
  }
  const body = {
    public_id: r.public_id,
    version: r.version,
    signature: r.signature,
    resource_type: r.resource_type,
    secure_url: r.secure_url,
    format: r.format,
    bytes: r.bytes,
    width: r.width,
    height: r.height,
    duration: r.duration,
  };
  // Tệp đã lên Cloudinary → bước xác nhận lỗi mạng thì thử lại (không tải lại tệp)
  for (let attempt = 0; ; attempt++) {
    try {
      const res = (await api("/media/confirm", { method: "POST", body })).data;
      onProgress(1);
      return res;
    } catch (err) {
      if (err?.status !== 0 || attempt >= 3) throw mark(err);
      await new Promise((ok) => setTimeout(ok, 1500 * (attempt + 1)));
    }
  }
}

/** Tải qua máy chủ (cách cũ, dự phòng). Hết hạn phiên → làm mới (dùng chung với lib/api) rồi thử lại 1 lần. */
function uploadViaServer(file, folder, onProgress, retried = false) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${siteConfig.apiUrl}/media`);
    xhr.withCredentials = true;
    xhr.setRequestHeader("X-Requested-With", "fetch");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onerror = () => reject(new ApiError(0, null));
    xhr.onload = async () => {
      let body = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {}
      if (
        xhr.status === 401 &&
        ["TOKEN_EXPIRED", "UNAUTHENTICATED"].includes(body?.error?.code) &&
        !retried &&
        (await refreshSession())
      ) {
        return uploadViaServer(file, folder, onProgress, true).then(resolve, reject);
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(body.data);
      else reject(new ApiError(xhr.status, body));
    };
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);
    xhr.send(fd);
  });
}

/** Chạy tối đa `limit` tác vụ song song. */
async function pool(tasks, limit = 3) {
  const out = new Array(tasks.length);
  let i = 0;
  const worker = async () => {
    while (i < tasks.length) {
      const k = i++;
      out[k] = await tasks[k]();
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return out;
}

/** Lỗi → câu thông báo dễ hiểu cho người dùng. */
export function describeError(err) {
  // Nêu đúng lý do đầu tiên backend trả về (vd. "Tối đa 60 tệp") thay vì câu chung chung
  if (err?.code === "VALIDATION_ERROR")
    return err.details?.[0]?.message
      ? `Thông tin chưa hợp lệ: ${err.details[0].message}.`
      : "Thông tin chưa hợp lệ, vui lòng kiểm tra lại.";
  if (["CLOUDINARY_FORBIDDEN", "IMPORT_FAILED", "STORAGE_NOT_CONFIGURED"].includes(err?.code))
    return err.message;
  // Lỗi Cloudinary khi tải thẳng (vd. vượt dung lượng gói Cloudinary, chữ ký hết hạn)
  if (err?.code === "CLOUDINARY_UPLOAD") {
    if (/file size too large/i.test(err.message))
      return `Tệp vượt quá dung lượng cho phép (video ≤ ${MAX_VIDEO_MB}MB, ảnh ≤ ${MAX_IMAGE_MB}MB).`;
    if (/stale request|signature/i.test(err.message))
      return "Phiên tải tệp đã hết hạn, vui lòng bấm thử lại.";
    return "Kho lưu trữ chưa nhận được tệp, vui lòng thử lại.";
  }
  if (err?.status === 413)
    return /link/i.test(err.message ?? "")
      ? err.message // tệp từ link quá nặng — backend đã nói rõ giới hạn
      : `Có tệp vượt quá dung lượng cho phép (ảnh ≤ ${MAX_IMAGE_MB}MB, video ≤ ${MAX_VIDEO_MB}MB).`;
  if (err?.status === 401) return "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.";
  if (err?.status === 404) return "Sản phẩm không còn tồn tại hoặc đã bị xoá.";
  if (err?.status === 0) return "Mất kết nối mạng. Vui lòng kiểm tra rồi thử lại.";
  return err?.message || "Đã có lỗi xảy ra, vui lòng thử lại.";
}

/** Báo website làm mới dữ liệu sản phẩm ngay (không phải chờ cache hết hạn). */
export const revalidateSite = () =>
  fetch("/api/revalidate", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-Requested-With": "fetch" },
    body: JSON.stringify({ tag: "products" }),
  }).catch(() => {});

/**
 * Lưu sản phẩm ở chế độ nền.
 * draft: { id?, form, media: [{ source: "existing"|"file"|"link", file?, url?, ... }], cover?, featured? }
 * cover (ảnh đại diện) / featured (ảnh nổi bật): như media, thêm source "ref" = dùng lại kết quả tải lên của mục thư viện
 * có key = ref (không tải cùng một tệp 2 lần); mục đó đã bị gỡ → tải bản sao tệp / link đi kèm.
 */
export function saveProductInBackground(draft, { onDone, resume } = {}) {
  const isEdit = Boolean(draft.id);
  const name = draft.form.title.trim();
  draft.startedAt ??= Date.now();
  const id = resume?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  // Bản ghi tải tiếp: tệp nào đã tải xong (results) + phần video đang dở (chunks), theo key của từng mục
  const record = resume ?? { id, savedAt: Date.now(), draft, results: {}, chunks: {} };
  const persist = () => saveState(id, { results: record.results, chunks: record.chunks });
  // Ảnh đại diện + ảnh nổi bật xử lý chung một danh sách, tách lại khi gửi lên
  const covers = [draft.cover, ...(draft.featured ?? [])].filter(Boolean);
  const mediaKeys = new Set(draft.media.map((m) => m.key));
  const orphanRef = (c) => c.source === "ref" && !mediaKeys.has(c.ref);
  const pending = [
    ...draft.media.filter((m) => m.source !== "existing"),
    ...covers.filter((c) => c.source === "file" || c.source === "link" || orphanRef(c)),
  ];
  const toastId = toast.loading(
    pending.length ? `Đang tải ${pending.length} tệp lên…` : "Đang lưu thay đổi…",
    {
      title: `${resume ? "Đang tải tiếp" : isEdit ? "Đang cập nhật" : "Đang tạo"} “${name}”`,
      progress: pending.length ? 0 : undefined,
    },
  );
  jobs = [...jobs, { id, name, isEdit, status: "running", draft, progress: 0 }];
  emit();

  const work = async () => {
    try {
      if (pending.length && !resume)
        await putJob({ id, savedAt: Date.now(), draft, results: {}, chunks: {} });
      const folder = `products/${draft.form.slug || "moi"}`;
      const progress = pending.map((m) => (record.results[m.key] ? 1 : 0));
      // Tiến độ tính theo DUNG LƯỢNG (video nặng chiếm phần lớn thời gian) + tốc độ mạng & thời gian còn lại,
      // để người dùng thấy việc tải vẫn đang chạy chứ không bị treo.
      const sizes = pending.map((m) => m.file?.size || 1024 * 1024);
      const total = sizes.reduce((a, b) => a + b, 0);
      let started = 0;
      let baseSent = 0; // phần đã tải TRƯỚC khi tải tiếp → không tính vào tốc độ hiện tại
      const mb = (b) => (b / 1024 / 1024).toFixed(b < 10 * 1024 * 1024 ? 1 : 0);
      const eta = (s) =>
        s < 60 ? `${Math.max(1, Math.round(s))} giây` : `${Math.ceil(s / 60)} phút`;
      const report = () => {
        const sent = progress.reduce((a, x, k) => a + x * sizes[k], 0);
        if (!started) {
          started = Date.now();
          baseSent = sent;
        }
        const p = total ? sent / total : 1;
        const done = progress.filter((x) => x >= 1).length;
        const secs = (Date.now() - started) / 1000;
        const rate = secs > 2 ? (sent - baseSent) / secs : 0;
        setJob(id, { progress: p });
        toast.update(toastId, {
          progress: p * 0.95,
          message:
            `Đã tải ${done}/${pending.length} tệp - ${mb(sent)}/${mb(total)}MB (${Math.round(p * 100)}%)` +
            (rate && p < 1 ? ` - ${mb(rate)}MB/s, còn khoảng ${eta((total - sent) / rate)}` : "…"),
        });
      };

      const send = (m) => async () => {
        if (!pending.includes(m)) return m;
        if (record.results[m.key]) return { ...m, ...record.results[m.key] }; // đã tải xong trước khi gián đoạn
        const k = pending.indexOf(m);
        const ckpt = {
          ...record.chunks[m.key],
          save: (c) => {
            record.chunks[m.key] = c;
            return persist();
          },
        };
        const file = m.source === "ref" ? (m.fallback === "file" ? m.file : null) : m.file;
        const res =
          m.source === "file" || file
            ? await uploadFile(file ?? m.file, folder, (p) => ((progress[k] = p), report()), ckpt)
            : (await api("/media/import", { method: "POST", body: { url: m.url, folder } })).data;
        // Video: ảnh đại diện chụp sẵn ở trình duyệt (nét, chắc chắn có) ưu tiên hơn ảnh Cloudinary tự tạo
        const poster = m.posterFile
          ? (await uploadFile(m.posterFile, folder, () => {}).catch(() => null))?.url
          : null;
        // + các cảnh phụ (frames) chụp sẵn → ảnh nổi bật / ảnh bìa ghép tự động của sản phẩm chỉ có video
        const frames = [];
        for (const f of m.frameFiles ?? []) {
          const u = (await uploadFile(f, folder, () => {}).catch(() => null))?.url;
          if (u) frames.push(u);
        }
        progress[k] = 1;
        report();
        const done = {
          type: res.type,
          url: res.url,
          publicId: res.publicId ?? null,
          poster: poster ?? res.poster ?? null,
          width: res.width ?? m.width,
          height: res.height ?? m.height,
          duration: res.duration ?? m.duration,
          ...(frames.length && { frames }),
        };
        record.results[m.key] = done;
        delete record.chunks[m.key];
        await persist();
        return { ...m, ...done };
      };
      const uploaded = await pool(draft.media.map(send));
      const byKey = new Map(uploaded.map((m) => [m.key, m]));
      const coverDone = await pool(covers.map(send));
      // Ảnh chọn từ thư viện → lấy đúng tệp vừa tải lên của mục đó, giữ khung cắt riêng của ảnh này
      const coverItems = coverDone.map((c) => {
        const lib = c.source === "ref" && !pending.includes(c) ? byKey.get(c.ref) : null;
        return lib ? { ...lib, pos: c.pos, zoom: c.zoom, alt: c.alt } : c;
      });

      toast.update(toastId, { progress: 0.97, message: "Đang lưu thông tin sản phẩm…" });
      // Tự nhận dạng loại sản phẩm: video nhiều hơn ảnh → "video", ngược lại "photo"
      const videos = uploaded.filter((m) => m.type !== "image").length;
      const toItem = (m) => ({
        type: m.type,
        url: m.url,
        publicId: m.publicId ?? null,
        poster: m.poster ?? null,
        pos: m.pos ?? "center",
        zoom: m.zoom ?? 1,
        ...(m.width && { width: m.width }),
        ...(m.height && { height: m.height }),
        // Thời lượng: giữ lại khi lưu (thống kê "Tổng thời lượng" + nhãn giây trên khung video)
        ...(m.duration && { duration: Math.round(m.duration * 10) / 10 }),
        // Cảnh phụ của video (chỉ link đã tải lên — bỏ link xem trước blob: chưa tải)
        ...(m.frames?.some((u) => u.startsWith("https://")) && {
          frames: m.frames.filter((u) => u.startsWith("https://")),
        }),
        alt: m.alt ?? "",
      });
      const body = {
        ...draft.form,
        kind: videos > uploaded.length - videos ? "video" : "photo",
        media: uploaded.map(toItem),
        cover: (() => {
          const c = draft.cover && coverItems[0];
          return c?.url && c.type === "image" ? toItem(c) : null;
        })(),
        featured: coverItems
          .slice(draft.cover ? 1 : 0)
          .filter((c) => c.url && c.type === "image")
          .map(toItem),
      };
      if (!body.slug) delete body.slug;
      // Tạo mới: lần trước có thể đã tạo xong nhưng mất phản hồi (mất mạng / tải lại trang) → tìm sản phẩm
      // cùng đường dẫn tạo sau mốc bắt đầu lưu; có rồi thì dùng luôn, không tạo trùng.
      const created =
        !isEdit && body.slug
          ? (
              await api(`/products/manage?q=${encodeURIComponent(body.slug)}`).catch(() => null)
            )?.data?.find(
              (x) => x.slug === body.slug && new Date(x.createdAt) >= draft.startedAt - 60_000,
            )
          : null;
      const res = isEdit
        ? await api(`/products/${draft.id}`, { method: "PATCH", body })
        : created
          ? { data: created }
          : await api("/products", { method: "POST", body });
      await deleteJob(id);
      await revalidateSite();

      dismissJob(id);
      toast.update(toastId, {
        type: "success",
        title: isEdit ? "Đã cập nhật sản phẩm" : "Đã tạo sản phẩm",
        message: `“${res.data.title}” ${res.data.published ? "đã hiển thị trên website." : "đã được lưu (đang ẩn)."}`,
        progress: undefined,
      });
      onDone?.(res.data);
      if (!onDone) window.dispatchEvent(new CustomEvent("tdm:product-saved"));
    } catch (err) {
      // Mất mạng / hết phiên đăng nhập → giữ bản ghi để tự tải tiếp lần sau (sau khi đăng nhập lại);
      // lỗi khác (dữ liệu không hợp lệ…) → bỏ, dùng "Mở lại & thử lại" như cũ
      if (![0, 401, 403].includes(err?.status)) await deleteJob(id);
      // Bản nháp để "Mở lại & thử lại": tệp đã tải lên thành công → chuyển thành tệp có sẵn (không tải lại,
      // không sinh tệp trùng trên kho lưu trữ)
      const reuse = (m) =>
        m && record.results[m.key]
          ? {
              ...m,
              ...record.results[m.key],
              source: "existing",
              file: undefined,
              posterFile: undefined,
              frameFiles: undefined,
            }
          : m;
      setJob(id, {
        status: "failed",
        error: describeError(err),
        draft: {
          ...draft,
          media: draft.media.map(reuse),
          cover: reuse(draft.cover),
          featured: (draft.featured ?? []).map(reuse),
        },
      });
      toast.update(toastId, {
        type: "error",
        title: isEdit ? "Chưa cập nhật được sản phẩm" : "Chưa tạo được sản phẩm",
        message: `${describeError(err)} Bản nháp đã được giữ lại để bạn thử lại.`,
        progress: undefined,
      });
    }
  };

  // Khoá theo id: 2 tab cùng mở website không tải tiếp cùng một sản phẩm 2 lần (tránh tạo trùng)
  if (navigator.locks?.request)
    navigator.locks.request(`tdm-upload-${id}`, { ifAvailable: true }, (lock) => {
      if (lock) return work();
      dismissJob(id);
      toast.dismiss(toastId);
    });
  else work();
}
