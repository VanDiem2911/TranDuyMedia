"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/icons";

/**
 * Xem trước video trong trang quản trị — dùng cho tệp vừa chọn từ máy, video đã tải lên và link
 * YouTube / Vimeo / Google Drive. Có đủ thanh điều khiển: phát / dừng, tua, âm lượng, toàn màn hình.
 * Esc chỉ đóng popup này (không đóng popup sửa sản phẩm phía sau).
 * type: "video" | "embed" · url · poster? · name?
 */
export function VideoPreview({ type, url, poster, name, onClose }) {
  const [failed, setFailed] = useState(false);

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
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Xem trước video"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 [animation:fadeIn_.2s_ease-out_both] bg-navy-950/85 backdrop-blur-sm"
      />
      <div className="relative flex w-full max-w-5xl [animation:popIn_.35s_cubic-bezier(.22,1,.36,1)_both] flex-col gap-3">
        <div className="flex items-center gap-3 text-white">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-orange-500">
            <Icon name="play" className="ml-0.5 size-3.5" strokeWidth={0} fill="currentColor" />
          </span>
          <p className="min-w-0 flex-1 truncate text-left text-sm font-semibold">
            {name ||
              (type === "embed" ? "Video nhúng (YouTube / Drive / Vimeo)" : "Xem trước video")}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/25"
          >
            <Icon name="close" className="size-5" />
          </button>
        </div>

        <div className="relative aspect-video max-h-[78svh] w-full overflow-hidden rounded-2xl bg-black shadow-soft">
          {type === "embed" ? (
            <iframe
              src={`${url}${url.includes("?") ? "&" : "?"}autoplay=1`}
              title={name || "Video"}
              allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
              allowFullScreen
              className="absolute inset-0 size-full"
            />
          ) : failed ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-white/80">
              <Icon name="film" className="size-8 text-white/50" />
              <p className="text-center text-sm font-semibold text-white">
                Trình duyệt không phát được video này
              </p>
              <p className="max-w-md text-center text-xs text-white/60">
                Link có thể không phải tệp video trực tiếp, hoặc định dạng chưa được hỗ trợ (vd. MOV
                quay bằng iPhone).
              </p>
            </div>
          ) : (
            <video
              src={url}
              poster={poster ?? undefined}
              controls
              autoPlay
              playsInline
              onError={() => setFailed(true)}
              className="absolute inset-0 size-full object-contain"
            />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
