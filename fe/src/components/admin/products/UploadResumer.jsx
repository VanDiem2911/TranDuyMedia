"use client";

import { useEffect } from "react";

let started = false;

/** Link xem trước dạng blob: không còn dùng được sau khi tải lại trang → tạo lại từ tệp đã lưu. */
const revive = (m) =>
  m && {
    ...m,
    preview: m.file
      ? URL.createObjectURL(m.file)
      : m.preview?.startsWith("blob:")
        ? undefined
        : m.preview,
    frames: m.frameFiles ? m.frameFiles.map((x) => URL.createObjectURL(x)) : m.frames,
    poster: m.posterFile
      ? URL.createObjectURL(m.posterFile)
      : m.poster?.startsWith("blob:")
        ? undefined
        : m.poster,
  };

/**
 * TỰ TẢI TIẾP việc lưu sản phẩm bị gián đoạn (tải lại trang, gõ địa chỉ khác, đóng tab…) ngay khi website
 * được mở lại — ở bất kỳ trang nào, tiến độ hiện trên toast. Video đang tải dở tiếp tục từ phần 20MB kế tiếp.
 * Khách xem website: chỉ đọc 1 cờ localStorage rồi thôi (không tải mã quản trị).
 */
export function UploadResumer() {
  useEffect(() => {
    if (started) return;
    started = true;
    (async () => {
      const { listJobs } = await import("./upload-store");
      const list = await listJobs();
      if (!list.length) return;
      const { saveProductInBackground } = await import("./jobs");
      for (const r of list) {
        const d = r.draft;
        const draft = {
          ...d,
          media: d.media.map(revive),
          cover: revive(d.cover),
          featured: (d.featured ?? []).map(revive),
        };
        saveProductInBackground(draft, {
          resume: { ...r, draft, results: r.results ?? {}, chunks: r.chunks ?? {} },
        });
      }
    })();
  }, []);
  return null;
}
