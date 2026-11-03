"use client";

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { SmartImage as Image } from "@/components/ui/SmartImage";
import { Icon } from "@/components/icons";
import { lockScroll, pad } from "@/lib/utils";

/**
 * Lightbox xem ảnh toàn màn hình.
 * props: images [{src, alt, type?, url?, poster?}], index (number|null), onClose, onChange(index)
 * type "video" → trình phát video · "embed" → khung YouTube / Vimeo.
 * Render thẳng vào <body> (portal): nếu nằm trong khối có transform (vd. hiệu ứng .reveal, carousel)
 * thì position: fixed bị tính theo khối đó → popup kẹt trong section, bị header đè.
 */
export function Lightbox({ images, index, onClose, onChange }) {
  const open = index !== null && index !== undefined;
  const touchX = useRef(null);
  const total = images.length;

  const prev = useCallback(() => onChange((index - 1 + total) % total), [index, total, onChange]);
  const next = useCallback(() => onChange((index + 1) % total), [index, total, onChange]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    lockScroll(true);
    return () => {
      window.removeEventListener("keydown", onKey);
      lockScroll(false);
    };
  }, [open, onClose, prev, next]);

  if (!open) return null;
  const img = images[index];

  const navBtn = (onClick, label, icon, cls) => (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={label}
      className={cls}
    >
      <Icon name={icon} className="size-5" />
    </button>
  );

  return createPortal(
    <div
      className="fixed inset-0 z-100 flex [animation:fadeIn_.3s_ease-out_both] items-center justify-center bg-navy-950/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng"
        className="absolute top-4 right-4 z-10 flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
      >
        <Icon name="close" className="size-5" />
      </button>

      <div className="absolute top-5 left-5 text-xs tracking-[0.3em] text-white/60">
        {pad(index + 1)} / {pad(total)}
      </div>

      {total > 1 && (
        <>
          {navBtn(
            prev,
            "Ảnh trước",
            "chevronLeft",
            "absolute top-1/2 left-3 z-10 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 sm:flex",
          )}
          {navBtn(
            next,
            "Ảnh sau",
            "chevronRight",
            "absolute top-1/2 right-3 z-10 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 sm:flex",
          )}
        </>
      )}

      <div
        className="relative h-[82vh] w-[92vw] max-w-5xl touch-pan-y select-none"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 40) (dx < 0 ? next : prev)();
        }}
      >
        {img.type === "video" ? (
          <video
            key={img.url}
            src={img.url}
            poster={img.poster ?? undefined}
            controls
            autoPlay
            playsInline
            className="size-full rounded-xl bg-black object-contain"
          />
        ) : img.type === "embed" ? (
          <iframe
            key={img.url}
            src={`${img.url}?autoplay=1`}
            title={img.alt || "Video"}
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            className="absolute inset-0 m-auto aspect-video max-h-full w-full rounded-xl bg-black"
          />
        ) : (
          <Image
            key={img.src}
            src={img.src}
            alt={img.alt || ""}
            fill
            sizes="92vw"
            className="object-contain"
          />
        )}
      </div>

      {img.alt && (
        <p className="absolute bottom-5 left-1/2 w-[90%] -translate-x-1/2 text-center text-xs text-white/70 sm:text-sm">
          {img.alt}
        </p>
      )}

      {total > 1 && (
        <div className="absolute bottom-12 left-1/2 flex -translate-x-1/2 gap-3 sm:hidden">
          {navBtn(
            prev,
            "Ảnh trước",
            "chevronLeft",
            "flex size-10 items-center justify-center rounded-full bg-white/15 text-white",
          )}
          {navBtn(
            next,
            "Ảnh sau",
            "chevronRight",
            "flex size-10 items-center justify-center rounded-full bg-white/15 text-white",
          )}
        </div>
      )}
    </div>,
    document.body,
  );
}
