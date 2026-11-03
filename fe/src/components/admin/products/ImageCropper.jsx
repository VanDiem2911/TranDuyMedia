"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/icons";
import { formatPos, parsePos, zoomStyle } from "@/lib/crop";
import { cn } from "@/lib/utils";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Ảnh 3:4 đã cắt — giống hệt cách website hiển thị (object-cover + zoomStyle). */
function Thumb({ src, crop, className }) {
  return (
    <div
      className={cn(
        "relative aspect-3/4 overflow-hidden",
        "bg-paper-200 ring-1 ring-ink/10",
        className,
      )}
    >
      <span className="absolute inset-0" style={zoomStyle(crop)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- xem trước */}
        <img
          src={src}
          alt=""
          draggable={false}
          className="size-full object-cover"
          style={{ objectPosition: crop.pos }}
        />
      </span>
    </div>
  );
}

function Preview({ caption, note, children }) {
  return (
    <figure className="min-w-0">
      {children}
      <figcaption className="mt-2 text-center leading-snug whitespace-nowrap">
        <span className="block text-xs font-semibold text-ink-soft">{caption}</span>
        {note && <span className="block text-[11px] text-ink-muted">{note}</span>}
      </figcaption>
    </figure>
  );
}

/**
 * Popup cắt khung ảnh kiểu CapCut: kéo ảnh để chọn vùng hiển thị, cuộn chuột / thanh trượt để phóng.
 * Dùng cho ảnh đóng khung 3:4 trên website:
 * - role "cover"    → ảnh đại diện (thẻ sản phẩm ở /san-pham, "Sản phẩm khác").
 * - role "featured" → ảnh nổi bật (phần giới thiệu trang chi tiết).
 * "Thư viện sản phẩm" và ảnh xem lớn (lightbox) luôn hiện ảnh gốc, không cắt.
 * item: { src, pos, zoom }
 */
export function ImageCropper({ item, role = "featured", onApply, onClose }) {
  const [pt, setPt] = useState(() => parsePos(item.pos));
  const [zoom, setZoom] = useState(() => clamp(item.zoom || 1, MIN_ZOOM, MAX_ZOOM));
  const [natural, setNatural] = useState(null);
  const [frame, setFrame] = useState(null);
  const [dragging, setDragging] = useState(false);
  const frameRef = useRef(null);
  const drag = useRef(null);

  const apply = () => onApply({ pos: formatPos(pt), zoom: Math.round(zoom * 100) / 100 });

  // Đo khung (đổi theo kích thước màn hình)
  useLayoutEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) =>
      setFrame({ w: e.contentRect.width, h: e.contentRect.height }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Esc: chỉ đóng popup này (không đóng popup sửa sản phẩm phía sau) · Enter: áp dụng
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      } else if (e.key === "Enter" && e.target.tagName !== "BUTTON") {
        e.preventDefault();
        e.stopPropagation();
        apply();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  });

  // Kích thước ảnh sau khi phủ kín khung + phóng → vị trí giống hệt object-cover + zoomStyle
  const geo =
    natural && frame
      ? (() => {
          const s = Math.max(frame.w / natural.w, frame.h / natural.h) * zoom;
          const w = natural.w * s;
          const h = natural.h * s;
          return {
            w,
            h,
            left: ((frame.w - w) * pt.x) / 100,
            top: ((frame.h - h) * pt.y) / 100,
          };
        })()
      : null;

  const moveBy = (dx, dy) => {
    if (!geo) return;
    setPt((p) => ({
      x: geo.w - frame.w > 0.5 ? clamp(p.x - (dx / (geo.w - frame.w)) * 100, 0, 100) : p.x,
      y: geo.h - frame.h > 0.5 ? clamp(p.y - (dy / (geo.h - frame.h)) * 100, 0, 100) : p.y,
    }));
  };

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY };
    setDragging(true);
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    moveBy(e.clientX - drag.current.x, e.clientY - drag.current.y);
    drag.current = { x: e.clientX, y: e.clientY };
  };
  const endDrag = () => {
    drag.current = null;
    setDragging(false);
  };

  const changeZoom = (z) => setZoom(clamp(z, MIN_ZOOM, MAX_ZOOM));
  const crop = { pos: formatPos(pt), zoom };
  const isDefault = Math.abs(pt.x - 50) < 0.1 && Math.abs(pt.y - 50) < 0.1 && zoom === 1;

  const imgLayer = (className) =>
    geo && (
      // eslint-disable-next-line @next/next/no-img-element -- ảnh đang chỉnh (tệp cục bộ / link)
      <img
        src={item.src}
        alt=""
        draggable={false}
        className={cn("pointer-events-none absolute max-w-none select-none", className)}
        style={{ width: geo.w, height: geo.h, left: geo.left, top: geo.top }}
      />
    );

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-title"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 [animation:fadeIn_.2s_ease-out_both] bg-navy-950/70 backdrop-blur-sm"
      />
      <div className="relative flex max-h-full w-full max-w-5xl [animation:popIn_.35s_cubic-bezier(.22,1,.36,1)_both] flex-col overflow-hidden rounded-3xl bg-white shadow-soft">
        {/* Đầu */}
        <div className="flex items-center gap-4 border-b border-ink/10 px-6 py-4">
          <span className="flex size-10 items-center justify-center rounded-xl bg-navy-950 text-orange-500">
            <Icon name="pen" className="size-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="crop-title" className="text-lg font-bold tracking-tight text-ink">
              Cắt khung hiển thị
            </h2>
            <p className="text-left text-xs text-ink-muted">Kéo ảnh để chọn vùng hiện trên thẻ</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex size-10 items-center justify-center rounded-full text-ink-soft hover:bg-paper hover:text-ink"
          >
            <Icon name="close" className="size-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-x-hidden overflow-y-auto md:grid-cols-[1fr_360px]">
          {/* Vùng chỉnh */}
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onWheel={(e) => changeZoom(zoom - e.deltaY * 0.0015)}
            className={cn(
              "relative flex shrink-0 touch-none items-center justify-center overflow-hidden bg-navy-950 px-6 py-6 select-none max-md:min-h-[calc(min(50svh,420px)+3rem)] md:py-8",
              dragging ? "cursor-grabbing" : "cursor-grab",
            )}
          >
            <div
              ref={frameRef}
              tabIndex={0}
              aria-label="Khung cắt ảnh — dùng phím mũi tên để dịch chuyển"
              onKeyDown={(e) => {
                const step = e.shiftKey ? 40 : 8;
                const d = {
                  ArrowLeft: [step, 0],
                  ArrowRight: [-step, 0],
                  ArrowUp: [0, step],
                  ArrowDown: [0, -step],
                }[e.key];
                if (d) {
                  e.preventDefault();
                  moveBy(...d);
                }
              }}
              className="relative aspect-3/4 h-[min(50svh,420px)] rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-orange-500 md:h-[min(56svh,460px)]"
            >
              {/* Phần bị cắt bỏ (mờ) */}
              {imgLayer("opacity-30")}
              {/* Phần được giữ lại */}
              <div className="absolute inset-0 overflow-hidden">{imgLayer()}</div>
              {/* Lưới 1/3 + viền khung */}
              <div
                className={cn(
                  "pointer-events-none absolute inset-0 ring-2 ring-white transition-opacity",
                  "bg-[linear-gradient(to_right,transparent_calc(33.33%-0.5px),rgba(255,255,255,.45)_calc(33.33%-0.5px),rgba(255,255,255,.45)_calc(33.33%+0.5px),transparent_calc(33.33%+0.5px),transparent_calc(66.66%-0.5px),rgba(255,255,255,.45)_calc(66.66%-0.5px),rgba(255,255,255,.45)_calc(66.66%+0.5px),transparent_calc(66.66%+0.5px)),linear-gradient(to_bottom,transparent_calc(33.33%-0.5px),rgba(255,255,255,.45)_calc(33.33%-0.5px),rgba(255,255,255,.45)_calc(33.33%+0.5px),transparent_calc(33.33%+0.5px),transparent_calc(66.66%-0.5px),rgba(255,255,255,.45)_calc(66.66%-0.5px),rgba(255,255,255,.45)_calc(66.66%+0.5px),transparent_calc(66.66%+0.5px))]",
                  dragging ? "opacity-100" : "opacity-60",
                )}
              />
              {!geo && (
                <span className="absolute inset-0 flex items-center justify-center text-white/60">
                  <span className="size-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                </span>
              )}
            </div>
            {/* Tải ảnh để biết kích thước gốc */}
            {/* eslint-disable-next-line @next/next/no-img-element -- chỉ dùng để đo */}
            <img
              src={item.src}
              alt=""
              hidden
              onLoad={(e) =>
                setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
              }
            />
          </div>

          {/* Điều khiển + xem trước */}
          <div className="flex flex-col gap-6 border-ink/10 p-6 md:border-l">
            <div>
              <p className="mb-3 text-center text-[11px] font-semibold tracking-eyebrow whitespace-nowrap text-ink-muted uppercase">
                Phóng to
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Thu nhỏ"
                  onClick={() => changeZoom(zoom - 0.1)}
                  disabled={zoom <= MIN_ZOOM}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-ink-soft hover:bg-paper hover:text-ink disabled:opacity-30"
                >
                  <Icon name="zoomOut" className="size-4" />
                </button>
                <input
                  type="range"
                  min={MIN_ZOOM}
                  max={MAX_ZOOM}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => changeZoom(Number(e.target.value))}
                  aria-label="Mức phóng"
                  className="h-1.5 min-w-0 flex-1 cursor-pointer accent-orange-500"
                />
                <button
                  type="button"
                  aria-label="Phóng to"
                  onClick={() => changeZoom(zoom + 0.1)}
                  disabled={zoom >= MAX_ZOOM}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-ink-soft hover:bg-paper hover:text-ink disabled:opacity-30"
                >
                  <Icon name="zoomIn" className="size-4" />
                </button>
              </div>
              <p className="mt-1 text-center text-xs font-medium text-ink-muted tabular-nums">
                {Math.round(zoom * 100)}%
              </p>
            </div>

            <div>
              <p className="mb-3 text-center text-[11px] font-semibold tracking-eyebrow whitespace-nowrap text-ink-muted uppercase">
                Xem trước trên website
              </p>
              <div className="mx-auto w-[calc(50%-0.375rem)]">
                {role === "cover" ? (
                  <Preview caption="Thẻ sản phẩm" note="(trang Sản phẩm)">
                    <Thumb src={item.src} crop={crop} className="rounded-lg" />
                  </Preview>
                ) : (
                  <Preview caption="Ảnh nổi bật" note="(phần giới thiệu)">
                    <Thumb src={item.src} crop={crop} className="rounded-lg" />
                  </Preview>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setPt({ x: 50, y: 50 });
                setZoom(1);
              }}
              disabled={isDefault}
              className="mt-auto inline-flex h-11 w-full items-center justify-center gap-2 rounded-full border border-ink/15 text-sm font-semibold text-ink-soft transition hover:border-ink/30 hover:bg-paper hover:text-ink disabled:pointer-events-none disabled:opacity-40"
            >
              <Icon name="refresh" className="size-4" />
              Đặt lại mặc định
            </button>
          </div>
        </div>

        {/* Chân */}
        <div className="flex flex-col-reverse gap-2.5 border-t border-ink/10 bg-paper/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-ink/15 bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:bg-paper"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={apply}
            className="relative inline-flex h-12 min-w-[200px] items-center justify-center rounded-full bg-navy-950 pr-[60px] pl-7 text-sm leading-none font-semibold text-white transition hover:bg-navy-800"
          >
            Áp dụng
            <span className="absolute right-1.5 flex size-9 items-center justify-center rounded-full bg-orange-500">
              <Icon name="check" className="size-4" strokeWidth={2.5} />
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
