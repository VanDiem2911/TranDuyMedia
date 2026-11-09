"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Video nền của banner: tự phát, tắt tiếng, lặp lại, phủ kín khung (object-cover).
 * Tôn trọng người dùng: bật "giảm chuyển động" hoặc "tiết kiệm dữ liệu" → không tự phát, chỉ hiện ảnh bìa (poster).
 * Chỉ để trang trí nên ẩn khỏi trình đọc màn hình.
 */
export function BannerVideo({ src, poster, className }) {
  const ref = useRef(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true; // cần để trình duyệt cho phép tự phát
    const calm =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      navigator.connection?.saveData;
    if (calm) v.pause();
    else v.play().catch(() => {});
  }, [src]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      tabIndex={-1}
      className={cn("absolute inset-0 -z-10 size-full object-cover", className)}
    />
  );
}
