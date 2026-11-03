"use client";

import { Children, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { ZoomGroup, ZoomImage } from "./Zoomable";

const AUTOPLAY = 5000; // ms — tự lướt 1 thẻ
const TAU_USER = 110; // ms — độ "đầm" khi hút về thẻ sau thao tác của người dùng (nhỏ = nhanh)
const TAU_AUTO = 220; // ms — tự lướt chậm, êm hơn
const THROW = 260; // ms — quán tính: vuốt với vận tốc v sẽ trôi thêm khoảng v × THROW px

const mod = (a, m) => ((a % m) + m) % m;

/**
 * Dải thẻ lướt ngang VÔ HẠN (cả 2 chiều), nằm gọn trong khung nội dung — chạy bằng vòng lặp
 * requestAnimationFrame thay vì CSS transition:
 * - Vị trí là một số thực liên tục, hiển thị bằng `vị trí mod (bề rộng 1 bộ ảnh)` trên dải nhân 3 →
 *   kéo / bấm / tự lướt bao nhiêu cũng không bao giờ hết ảnh, không có cú "nhảy về" nào.
 * - Kéo chuột / vuốt có QUÁN TÍNH: thả tay theo vận tốc → trôi tiếp rồi hút êm về mép thẻ gần nhất.
 * - Trackpad lướt ngang được; nút ‹ › bấm dồn liên tục được (cộng dồn đích đến).
 * - Tự lướt 1 thẻ mỗi 5 giây; tạm dừng khi rê chuột, khi đang kéo, khi khuất màn hình hoặc tab ẩn.
 * - Cú click sinh ra sau khi kéo bị chặn (không mở link / ảnh nhầm).
 * children: các thẻ (mỗi phần tử con = 1 thẻ). itemClassName: kích thước thẻ (shrink-0, rộng/cao).
 * itemStyles: style riêng từng thẻ (vd. aspectRatio theo tỉ lệ ảnh).
 */
export function LoopCarousel({
  children,
  label = "Thư viện",
  dark = true,
  itemClassName,
  itemStyles,
  autoplay = AUTOPLAY,
  reverse = false, // tự lướt ngược chiều (sang trái → phải)
  compact = false, // nút ‹ › nhỏ nằm trong khung, khung không bo góc (kiểu dải ảnh liền)
  gapClass = "gap-3 sm:gap-4 lg:gap-5",
  arrows = true, // hiện nút ‹ ›
}) {
  const kids = Children.toArray(children);
  const n = kids.length;
  const loop = [...kids, ...kids, ...kids];
  const viewport = useRef(null);
  const track = useRef(null);
  const items = useRef([]);
  const geo = useRef({ base: 0, width: 1, starts: [0] }); // base = mép bộ giữa, width = 1 bộ ảnh
  const m = useRef({ pos: 0, target: null, tau: TAU_USER, raf: 0, last: 0 });
  const drag = useRef(null);
  const wheelT = useRef(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [tick, setTick] = useState(0); // đổi → hẹn giờ tự lướt đếm lại từ đầu

  const render = useCallback(() => {
    const { base, width } = geo.current;
    if (track.current)
      // Làm tròn về pixel nguyên → ảnh không bị nội suy lệch nửa điểm ảnh (mờ) khi dải đứng yên
      track.current.style.transform = `translate3d(${-Math.round(base + mod(m.current.pos, width))}px,0,0)`;
  }, []);

  /** Mép thẻ gần `p` nhất (theo chiều dài vô hạn) */
  const snap = useCallback((p) => {
    const { width, starts } = geo.current;
    const k = Math.floor(p / width);
    const local = p - k * width;
    let best = width;
    for (const s of starts) if (Math.abs(s - local) < Math.abs(best - local)) best = s;
    return k * width + best;
  }, []);

  /** Mép thẻ kế tiếp (d = 1) / trước đó (d = -1) tính từ `p` (p đã nằm đúng mép thẻ) */
  const neighbour = useCallback((p, d) => {
    const { width, starts } = geo.current;
    const k = Math.floor(p / width);
    const local = Math.round(p - k * width);
    const all = [...starts.map((s) => s - width), ...starts, ...starts.map((s) => s + width)];
    const next = d > 0 ? all.find((s) => s > local + 1) : all.findLast((s) => s < local - 1);
    return k * width + next;
  }, []);

  // Vòng lặp chuyển động: tiến dần về đích theo hàm mũ (nhanh lúc đầu, chậm dần, không vượt đích)
  const loopFrame = useCallback(
    (now) => {
      const s = m.current;
      const dt = Math.min(64, now - (s.last || now));
      s.last = now;
      if (s.target != null) {
        const diff = s.target - s.pos;
        s.pos += diff * (1 - Math.exp(-dt / s.tau));
        if (Math.abs(diff) < 0.4) {
          s.pos = s.target;
          s.target = null;
        }
      }
      render();
      if (s.target != null) s.raf = requestAnimationFrame(s.frame);
      else s.raf = 0;
    },
    [render],
  );

  const animateTo = useCallback(
    (target, tau = TAU_USER) => {
      const s = m.current;
      s.target = target;
      s.tau = tau;
      if (!s.raf) {
        s.last = 0;
        s.frame = loopFrame; // khung kế tiếp tự gọi lại chính nó qua s.frame
        s.raf = requestAnimationFrame(loopFrame);
      }
    },
    [loopFrame],
  );

  const stop = () => {
    const s = m.current;
    s.target = null;
    if (s.raf) cancelAnimationFrame(s.raf);
    s.raf = 0;
  };

  const measure = useCallback(() => {
    const els = items.current;
    if (!els[n] || !els[2 * n]) return;
    const base = els[n].offsetLeft;
    const width = els[2 * n].offsetLeft - base;
    const starts = Array.from({ length: n }, (_, k) => els[n + k].offsetLeft - base);
    // Giữ nguyên thẻ đang xem khi đổi kích thước màn hình (dừng chuyển động đang dở theo kích thước cũ)
    const s = m.current;
    if (s.target != null) s.pos = s.target;
    s.target = null;
    const old = geo.current;
    const idx = old.starts.indexOf(mod(Math.round(m.current.pos), old.width));
    geo.current = { base, width, starts };
    if (idx >= 0) m.current.pos = Math.floor(m.current.pos / old.width) * width + starts[idx];
    render();
  }, [n, render]);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (viewport.current) ro.observe(viewport.current);
    const motion = m.current;
    return () => {
      ro.disconnect();
      cancelAnimationFrame(motion.raf);
    };
  }, [measure]);

  const step = useCallback(
    (d, tau) => {
      const s = m.current;
      animateTo(neighbour(s.target ?? snap(s.pos), d), tau);
    },
    [animateTo, neighbour, snap],
  );

  const userStep = (d) => {
    step(d, TAU_USER);
    setTick((t) => t + 1);
  };

  // Chỉ tự lướt khi khối đang hiện trên màn hình
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Hẹn giờ BÁM THEO ĐỒNG HỒ CHUNG (mốc là bội số của chu kỳ tính từ đầu giờ hệ thống) chứ không tính
  // từ lúc từng dải bắt đầu chạy → nhiều dải cùng chu kỳ (vd. 3 hàng hậu trường) luôn lướt CÙNG MỘT LÚC,
  // dù dải nào hiện ra / bị rê chuột trước hay sau.
  useEffect(() => {
    if (paused || !inView || n < 2) return;
    let t;
    const fire = () => {
      if (!document.hidden && !drag.current) step(reverse ? -1 : 1, TAU_AUTO);
      schedule();
    };
    const schedule = () => {
      const wait = autoplay - (Date.now() % autoplay);
      t = setTimeout(fire, wait < 400 ? wait + autoplay : wait); // vừa thao tác xong thì chờ thêm 1 nhịp
    };
    schedule();
    return () => clearTimeout(t);
  }, [paused, inView, n, step, tick, autoplay, reverse]);

  // Trackpad lướt ngang: cộng thẳng vào vị trí, ngừng lướt 140ms thì hút về thẻ gần nhất
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const onWheel = (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // cuộn dọc → để trang cuộn
      e.preventDefault();
      stop();
      m.current.pos += e.deltaX;
      render();
      clearTimeout(wheelT.current);
      wheelT.current = setTimeout(() => {
        animateTo(snap(m.current.pos));
        setTick((t) => t + 1);
      }, 140);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [animateTo, render, snap]);

  // ── Kéo / vuốt có quán tính ──
  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    drag.current = {
      x0: e.clientX,
      y0: e.clientY,
      p0: m.current.pos,
      moved: false,
      samples: [{ x: e.clientX, t: performance.now() }],
    };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x0;
    if (!d.moved) {
      // Vuốt dọc trên điện thoại → để trang cuộn bình thường
      if (Math.abs(e.clientY - d.y0) > Math.abs(dx) && Math.abs(e.clientY - d.y0) > 6) {
        drag.current = null;
        return;
      }
      if (Math.abs(dx) < 6) return;
      d.moved = true;
      stop(); // bắt ngay tại vị trí đang trôi → kéo tiếp liền mạch
      d.p0 = m.current.pos + dx;
      viewport.current.setPointerCapture(e.pointerId);
      viewport.current.dataset.dragging = "";
    }
    m.current.pos = d.p0 - dx;
    render();
    const now = performance.now();
    d.samples.push({ x: e.clientX, t: now });
    while (d.samples.length > 2 && now - d.samples[0].t > 100) d.samples.shift();
  };
  const onPointerUp = (e) => {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) return;
    const el = viewport.current;
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    delete el.dataset.dragging;
    // Vận tốc 100ms cuối (px/ms) → điểm trôi tới theo quán tính → hút về mép thẻ gần điểm đó
    const a = d.samples[0];
    const b = d.samples[d.samples.length - 1];
    const v = b.t > a.t ? (b.x - a.x) / (b.t - a.t) : 0;
    const s = m.current;
    let target = snap(s.pos - v * THROW);
    // Kéo/vuốt rõ ràng mà vẫn hút về chỗ cũ → sang 1 thẻ theo chiều kéo
    if (Math.abs(target - snap(d.p0)) < 1 && Math.abs(s.pos - d.p0) > 40)
      target = neighbour(target, s.pos > d.p0 ? 1 : -1);
    animateTo(target);
    setTick((t) => t + 1);
    // Chặn cú click sinh ra ngay sau khi thả chuột (không mở ảnh nhầm)
    const block = (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
    };
    el.addEventListener("click", block, { capture: true, once: true });
    setTimeout(() => el.removeEventListener("click", block, { capture: true }), 0);
  };

  const btn = cn(
    "absolute top-1/2 z-10 flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-full ring-1 backdrop-blur-md transition duration-300 hover:scale-105 active:scale-95",
    compact ? "size-10" : "size-12 sm:size-14",
    dark
      ? "bg-navy-950/55 text-white ring-white/25 hover:bg-orange-500 hover:ring-orange-500"
      : "bg-white/80 text-ink ring-ink/10 hover:bg-navy-900 hover:text-white",
  );

  return (
    <>
      <div
        className="relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          ref={viewport}
          role="region"
          aria-roledescription="carousel"
          aria-label={label}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          // overflow-hidden vẫn có thể bị trình duyệt cuộn khi focus phần tử con → luôn giữ ở 0
          onScroll={(e) => (e.currentTarget.scrollLeft = 0)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") userStep(1);
            if (e.key === "ArrowLeft") userStep(-1);
          }}
          className={cn(
            "@container cursor-grab touch-pan-y overflow-hidden select-none data-[dragging]:cursor-grabbing",
            !compact && "rounded-2xl",
          )}
        >
          <ul ref={track} className={cn("flex w-max will-change-transform", gapClass)}>
            {loop.map((kid, i) => {
              const clone = i < n || i >= 2 * n;
              return (
                <li
                  key={i}
                  ref={(el) => (items.current[i] = el)}
                  // Bản sao: ẩn với trình đọc màn hình và không Tab vào được
                  aria-hidden={clone || undefined}
                  inert={clone || undefined}
                  className={cn("shrink-0", itemClassName)}
                  style={itemStyles?.[i % n]}
                >
                  {kid}
                </li>
              );
            })}
          </ul>
        </div>

        {arrows && (
          <>
            <button
              type="button"
              onClick={() => userStep(-1)}
              aria-label="Ảnh trước"
              className={cn(btn, compact ? "left-3" : "left-3 sm:left-4 lg:-left-7")}
            >
              <Icon name="chevronLeft" className={compact ? "size-5" : "size-5 sm:size-6"} />
            </button>
            <button
              type="button"
              onClick={() => userStep(1)}
              aria-label="Ảnh tiếp theo"
              className={cn(btn, compact ? "right-3" : "right-3 sm:right-4 lg:-right-7")}
            >
              <Icon name="chevronRight" className={compact ? "size-5" : "size-5 sm:size-6"} />
            </button>
          </>
        )}
      </div>
    </>
  );
}

/**
 * Thư viện ảnh lướt vô hạn (khối Hậu trường): thẻ cao cố định, rộng theo tỉ lệ ảnh; bấm ảnh → lightbox.
 * images: [{ src, alt, pos, ratio }] — ratio = rộng / cao.
 */
export function LoopGallery({ images, label = "Thư viện ảnh", dark = true }) {
  return (
    <ZoomGroup images={images}>
      <LoopCarousel
        label={label}
        dark={dark}
        itemClassName="h-[300px] sm:h-[380px] lg:h-[440px]"
        itemStyles={images.map((img) => ({ aspectRatio: img.ratio }))}
      >
        {images.map((img, i) => (
          <ZoomImage
            key={img.src}
            index={i}
            src={img.src}
            alt={img.alt}
            pos={img.pos}
            sizes="(min-width: 1024px) 660px, 450px"
            className="size-full rounded-2xl bg-navy-900 ring-1 ring-white/10 [&_img]:pointer-events-none"
          >
            <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-navy-950/85 to-transparent p-4 pt-12 text-left text-[13px] font-medium text-white/90 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              {img.alt}
            </span>
          </ZoomImage>
        ))}
      </LoopCarousel>
    </ZoomGroup>
  );
}
