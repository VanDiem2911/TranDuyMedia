"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/icons";

const fmt = (mb) => `${mb.toFixed(mb < 20 ? 1 : 0)}MB`;

/**
 * Hộp thoại khi chọn tệp QUÁ NẶNG: báo ngắn gọn tệp nào bị chặn, gợi ý đăng video lên Google Drive / YouTube
 * rồi dán đường dẫn (không giới hạn dung lượng). Tệp hợp lệ chọn cùng lúc vẫn được thêm bình thường.
 * items: [{ name, mb, kind: "video" | "image", limit }] · onPasteLink: đóng hộp thoại + đưa con trỏ vào ô dán link
 */
export function OversizeDialog({ items, onClose, onPasteLink }) {
  const videos = items.filter((x) => x.kind === "video");

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center sm:p-6"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="oversize-title"
      aria-describedby="oversize-desc"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 [animation:fadeIn_.2s_ease-out_both] bg-navy-950/70 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-md [animation:popIn_.35s_cubic-bezier(.22,1,.36,1)_both] overflow-hidden rounded-t-3xl bg-white shadow-soft sm:rounded-3xl">
        <div className="px-6 pt-6 pb-5">
          {/* 1 tệp: dung lượng (chữ đỏ) căn giữa theo chiều cao cụm tiêu đề + tên tệp bên trái.
              Nhiều tệp: tiêu đề trên, mỗi tệp một dòng bên dưới (tên trái, dung lượng phải, căn giữa dòng). */}
          <div className="flex items-center gap-3.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Icon name="alert" className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="oversize-title" className="text-base font-bold tracking-tight text-ink">
                {videos.length ? "Video quá nặng" : "Ảnh quá nặng"}
                {items.length > 1 ? ` (${items.length} tệp)` : ""}
              </h2>
              {items.length === 1 && (
                <p id="oversize-desc" className="mt-0.5 truncate text-left text-sm text-ink-soft">
                  {items[0].name}
                </p>
              )}
            </div>
            {items.length === 1 && (
              <span className="shrink-0 text-xs font-semibold text-red-600 tabular-nums">
                {fmt(items[0].mb)} / tối đa {items[0].limit}MB
              </span>
            )}
          </div>
          {items.length > 1 && (
            <ul id="oversize-desc" className="mt-3 space-y-1.5 pl-[3.375rem]">
              {items.map((x, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-ink-soft">
                  <span className="min-w-0 flex-1 truncate">{x.name}</span>
                  <span className="shrink-0 text-xs font-semibold text-red-600 tabular-nums">
                    {fmt(x.mb)} / tối đa {x.limit}MB
                  </span>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-5 text-left text-sm leading-relaxed text-ink-soft">
            {videos.length ? (
              <>
                Hãy đăng video lên <strong className="text-ink">Google Drive</strong> (mở quyền xem
                cho “Bất kỳ ai có đường liên kết”) hoặc{" "}
                <strong className="text-ink">YouTube</strong> (chế độ Công khai hoặc Không công
                khai), rồi dán đường dẫn vào thư viện.
              </>
            ) : (
              "Hãy chọn ảnh có dung lượng nhỏ hơn."
            )}
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-ink/10 bg-paper/60 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            autoFocus={!videos.length}
            className="rounded-full border border-ink/15 bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-paper"
          >
            Đóng
          </button>
          {videos.length > 0 && (
            <button
              type="button"
              onClick={onPasteLink}
              autoFocus
              className="inline-flex items-center justify-center gap-2 rounded-full bg-navy-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800"
            >
              <Icon name="external" className="size-4" />
              Dán link ngay
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
