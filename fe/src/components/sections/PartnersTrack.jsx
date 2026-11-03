"use client";

import { useEffect, useRef } from "react";

const SPEED = 0.06; // px / ms (≈ 60px mỗi giây) — tốc độ tự lướt
const mod = (a, m) => ((a % m) + m) % m;

/**
 * Dải logo tự lướt liên tục bằng requestAnimationFrame (thay cho animation CSS) để người dùng tương tác được:
 * - Máy tính: rê chuột vào → dừng (logo nở to, hiện tên); rời chuột → chạy tiếp.
 * - Điện thoại: NHẤN GIỮ → dừng; kéo ngang để lướt tay (có quán tính nhẹ khi thả); thả tay → chạy tiếp.
 *   Vuốt dọc vẫn cuộn trang bình thường.
 * - Khuất màn hình / tab ẩn → không chạy (đỡ tốn pin).
 * children: danh sách <li> đã nhân đôi (nửa sau là bản sao) — vị trí quấn vòng theo bề rộng nửa đầu.
 */
export function PartnersTrack({ children }) {
  const wrap = useRef(null);
  const track = useRef(null);

  useEffect(() => {
    const el = wrap.current;
    const ul = track.current;
    if (!el || !ul) return;
    let pos = 0;
    let half = ul.scrollWidth / 2;
    let last = 0;
    let raf = 0;
    let hover = false;
    let visible = true;
    let drag = null; // { x0, y0, p0, moved, lastX, lastT, v }
    let fling = 0; // vận tốc quán tính sau khi thả (px/ms)

    const render = () => {
      ul.style.transform = `translate3d(${-Math.round(mod(pos, half))}px,0,0)`;
    };
    const frame = (now) => {
      const dt = Math.min(64, now - (last || now));
      last = now;
      if (!drag) {
        if (Math.abs(fling) > 0.02) {
          pos += fling * dt;
          fling *= Math.pow(0.94, dt / 16); // giảm dần
        } else if (!hover) {
          fling = 0;
          pos += SPEED * dt;
        }
      }
      render();
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!raf && visible && !document.hidden) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    // Luôn tự lướt (như các dải chạy khác của site) — Windows hay bật sẵn "giảm chuyển động" nên không dựa vào đó

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(el);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    const ro = new ResizeObserver(() => {
      half = ul.scrollWidth / 2;
      render();
    });
    ro.observe(ul);

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const enter = () => fine.matches && (hover = true);
    const leave = () => (hover = false);

    const down = (e) => {
      if (e.pointerType === "mouse") return; // chuột: dừng bằng rê chuột, không kéo
      fling = 0;
      drag = {
        x0: e.clientX,
        y0: e.clientY,
        p0: pos,
        moved: false,
        lastX: e.clientX,
        lastT: performance.now(),
        v: 0,
      };
    };
    const move = (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x0;
      const dy = e.clientY - drag.y0;
      if (!drag.moved) {
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
          drag = null; // vuốt dọc → để trang cuộn, dải chạy tiếp
          return;
        }
        if (Math.abs(dx) < 6) return;
        drag.moved = true;
        el.setPointerCapture?.(e.pointerId);
      }
      const now = performance.now();
      drag.v = (drag.lastX - e.clientX) / Math.max(1, now - drag.lastT);
      drag.lastX = e.clientX;
      drag.lastT = now;
      pos = drag.p0 - dx;
    };
    const up = () => {
      if (!drag) return;
      if (drag.moved) fling = Math.max(-2, Math.min(2, drag.v));
      drag = null; // thả tay → tự lướt tiếp (sau quán tính)
    };

    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    render();
    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, []);

  return (
    <div ref={wrap} className="bleed-cap touch-pan-y overflow-hidden select-none">
      <ul ref={track} className="flex w-max will-change-transform">
        {children}
      </ul>
    </div>
  );
}
