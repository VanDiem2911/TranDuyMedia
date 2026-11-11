"use client";

import { useRef, useState } from "react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const DRAG_PX = 6; // di chuyển quá ngưỡng này = kéo, không phải bấm

/**
 * Bản đồ Google Maps nhúng ở footer (dạng embed, không cần API key).
 * iframe khác domain nuốt con lăn chuột → Lenis bị bỏ qua → cuộn nhảy cục, nên mặc định iframe bị khoá
 * bằng một lớp phủ (là link tới Google Maps):
 * - BẤM gọn một cái ở bất kỳ đâu → mở Google Maps (tab mới).
 * - KÉO chuột (giữ & di chuyển > 6px) → mở khoá bản đồ để kéo / phóng to, không mở link.
 *   Rời chuột khỏi bản đồ thì khoá lại.
 * - Cảm ứng: vuốt = cuộn trang như bình thường (trình duyệt không phát click sau khi vuốt), chạm = mở Maps.
 */
export function FooterMap({ contact = siteConfig.contact }) {
  const [active, setActive] = useState(false);
  const start = useRef(null);
  const dragged = useRef(false);
  const src = `https://www.google.com/maps?q=${encodeURIComponent(contact.mapsQuery)}&z=16&hl=vi&output=embed`;

  const onPointerDown = (e) => {
    dragged.current = false;
    start.current = e.pointerType === "mouse" ? { x: e.clientX, y: e.clientY } : null;
  };
  const onPointerMove = (e) => {
    if (!start.current || !(e.buttons & 1)) return;
    if (Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > DRAG_PX) {
      dragged.current = true;
      start.current = null;
      setActive(true); // gỡ lớp phủ → các lần kéo tiếp theo tác động thẳng lên bản đồ
    }
  };

  return (
    <div
      className="relative h-[200px] overflow-hidden rounded-2xl bg-navy-800 ring-1 ring-white/10"
      onMouseLeave={() => setActive(false)}
    >
      <iframe
        src={src}
        title={`Bản đồ đường đến ${siteConfig.name}`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        // Extension trình duyệt (vd. Ruffle) tự gắn thuộc tính vào iframe trước khi React hydrate → bỏ qua cảnh báo lệch thuộc tính
        suppressHydrationWarning
        className={cn("size-full", !active && "pointer-events-none")}
      />
      {!active && (
        <a
          href={contact.mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Mở vị trí studio trên Google Maps"
          draggable={false}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onClick={(e) => dragged.current && e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
          className="absolute inset-0 cursor-pointer select-none"
        ></a>
      )}
    </div>
  );
}
