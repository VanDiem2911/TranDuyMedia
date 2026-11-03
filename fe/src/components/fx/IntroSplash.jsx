"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { INTRO_LOGO } from "./intro-logo";

// Mốc thời gian (ms) tính từ LÚC MỞ TRANG (performance.now) — khớp với animation CSS vốn chạy từ khung
// hình đầu tiên. Nếu JS tải chậm (bản dev), các mốc đã qua sẽ chạy ngay → không kéo dài thêm.
const T_OUT = 2800; // logo & chữ thu nhỏ, mờ đi (giữ nguyên ~1.7s sau khi hiện đủ để kịp đọc)
const T_OPEN = 3050; // khẩu độ mở ra từ tâm → trang hiện qua lỗ tròn
const T_DONE = 4300; // gỡ khỏi DOM (mở khẩu độ mất 1.2s)
const FPS = 25;

/**
 * Có nên BỎ QUA màn chào không:
 * - HIỆN khi khách bấm F5 / tải lại, hoặc vào từ bên ngoài (gõ địa chỉ, Google, Facebook, link ngoài…).
 * - BỎ QUA khi đi từ chính website sang (kể cả mở tab mới từ link trong website → referrer cùng
 *   tên miền) hoặc bấm Quay lại / Tiến tới.
 * Gắn data-intro="skip" lên <html> → CSS ẩn ngay từ khung hình đầu.
 */
// SKIP_SCRIPT chạy trong <head> của layout gốc  — xem intro-skip.js
export const introSkipped = () =>
  typeof document !== "undefined" && document.documentElement.dataset.intro === "skip";

/**
 * Màn chào thương hiệu kiểu khung ngắm máy quay (viewfinder), phủ toàn màn hình kể cả header.
 * Vào: 4 góc khung ngắm, ● REC, timecode chạy thật, logo "lấy nét" (nhoè → nét), slogan, vạch ghi hình.
 * Ra: "mở khẩu độ" — lỗ tròn mở từ tâm với viền sáng cam (iris out), trang web hiện qua lỗ đó.
 *
 * - Chỉ hiện khi tải trang đầy đủ (lần đầu / F5): nằm trong root layout nên chuyển trang bằng menu
 *   (client navigation) không mount lại → không hiện. Render sẵn từ server → che trang ngay khung đầu.
 * - Mở tab mới từ chính website / Quay lại → bỏ qua (SKIP_SCRIPT).
 * - Đang hiện: khoá cuộn, tạm dừng animation CSS của trang (globals.css, dùng :has(#intro)).
 * - Lúc mở khẩu độ: phát "td:intro-reveal" để hero bắt đầu hiệu ứng mở màn đúng lúc lộ ra.
 * - Phòng lỗi JS: CSS tự ẩn màn sau 8s (intro-failsafe).
 */
export function IntroSplash() {
  const [phase, setPhase] = useState("in"); // in → out → open → done
  const timecodeRef = useRef(null);

  useEffect(() => {
    if (introSkipped()) {
      setPhase("done"); // eslint-disable-line react-hooks/set-state-in-effect -- quyết định từ script chạy trước hydrate
      return;
    }
    window.__lenis?.stop();
    const now = performance.now();
    const at = (ms, fn) => setTimeout(fn, Math.max(0, ms - now));
    const timers = [
      at(T_OUT, () => setPhase("out")),
      at(T_OPEN, () => {
        setPhase("open");
        window.__lenis?.start();
        window.dispatchEvent(new Event("td:intro-reveal"));
      }),
      at(T_DONE, () => setPhase("done")),
    ];

    // Timecode chạy thật (HH:MM:SS:FF ở 25 fps) tính từ lúc mở trang — ghi thẳng vào DOM, không re-render
    let raf = 0;
    // Chỉ ghi khi số khung đổi (25 lần/giây) — rAF chạy 60 lần/giây, ghi lại chữ y hệt vẫn bắt tính lại bố cục
    let last = -1;
    const tick = (t) => {
      const frames = Math.floor((t / 1000) * FPS);
      if (frames !== last && timecodeRef.current) {
        last = frames;
        const ff = String(frames % FPS).padStart(2, "0");
        const ss = String(Math.floor(frames / FPS) % 60).padStart(2, "0");
        timecodeRef.current.textContent = `00:00:${ss}:${ff}`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(raf);
      window.__lenis?.start();
    };
  }, []);

  if (phase === "done") return null;

  const out = phase !== "in";
  const open = phase === "open";

  return (
    <>
      <div
        id="intro"
        data-phase={open ? "out" : "in"}
        aria-hidden="true"
        className={cn(
          "intro-failsafe intro-aperture pointer-events-none fixed inset-0 z-[300] text-white select-none",
          open && "is-open",
        )}
      >
        {/* Màn che: lỗ tròn ở tâm mở rộng theo --intro-r (globals.css) */}
        <div className="intro-mask grain pointer-events-auto absolute inset-0 overflow-hidden bg-navy-950">
          {/* Khung ngắm + nội dung */}
          <div
            className={cn(
              "absolute inset-0 transition-[opacity,transform,filter] duration-[450ms] ease-[cubic-bezier(.4,0,.2,1)]",
              out && "scale-[0.94] opacity-0 blur-[2px]",
            )}
          >
            {/* 4 góc khung ngắm */}
            {[
              "top-[6vh] left-[5vw] border-t border-l",
              "top-[6vh] right-[5vw] border-t border-r",
              "bottom-[6vh] left-[5vw] border-b border-l",
              "bottom-[6vh] right-[5vw] border-b border-r",
            ].map((pos, i) => (
              <span
                key={pos}
                className={cn("absolute size-10 border-white/50 sm:size-14", pos)}
                style={{ animation: `introBracket .9s cubic-bezier(.22,1,.36,1) ${i * 60}ms both` }}
              />
            ))}

            {/* Thông số máy quay ở các góc */}
            <div className="absolute top-[calc(6vh+1.25rem)] left-[calc(5vw+1.25rem)] flex items-center gap-2 text-[10px] font-semibold tracking-[0.3em] text-white/80 sm:top-[calc(6vh+1.75rem)] sm:left-[calc(5vw+1.75rem)] sm:text-[11px]">
              <span className="size-2 animate-[introBlink_1s_steps(2,start)_infinite] rounded-full bg-red-500" />
              REC
            </div>
            <div className="absolute top-[calc(6vh+1.25rem)] right-[calc(5vw+1.25rem)] text-[10px] font-medium tracking-[0.25em] text-white/50 sm:top-[calc(6vh+1.75rem)] sm:right-[calc(5vw+1.75rem)] sm:text-[11px]">
              4K · 25 FPS
            </div>
            <div
              ref={timecodeRef}
              className="absolute bottom-[calc(6vh+1.25rem)] left-[calc(5vw+1.25rem)] text-[10px] font-medium tracking-[0.25em] text-white/60 tabular-nums sm:bottom-[calc(6vh+1.75rem)] sm:left-[calc(5vw+1.75rem)] sm:text-[11px]"
            >
              00:00:00:00
            </div>
            <div className="absolute right-[calc(5vw+1.75rem)] bottom-[calc(6vh+1.75rem)] hidden text-[11px] font-medium tracking-[0.25em] text-white/50 sm:block">
              ISO 800 · f/2.8 · 1/50
            </div>

            {/* Trung tâm: logo lấy nét → slogan → vạch ghi hình */}
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <div style={{ animation: "introFocus 1.1s cubic-bezier(.22,1,.36,1) .1s both" }}>
                {/* Logo nhúng sẵn trong HTML (data URI, scripts/intro-logo.mjs) → hiện ngay, không chờ tải ảnh */}
                {/* eslint-disable-next-line @next/next/no-img-element -- data URI nhỏ, không qua bộ tối ưu ảnh */}
                <img
                  src={INTRO_LOGO.src}
                  alt=""
                  width={INTRO_LOGO.width}
                  height={INTRO_LOGO.height}
                  decoding="sync"
                  className="h-[clamp(5.5rem,16svh,9rem)] w-auto drop-shadow-[0_6px_30px_rgba(0,0,0,0.5)]"
                />
              </div>
              <p
                className="mt-7 text-lg font-semibold tracking-tight sm:text-2xl"
                style={{ animation: "fadeUp .8s cubic-bezier(.22,1,.36,1) .55s both" }}
              >
                Uy tín <span className="text-orange-500">·</span> Trách nhiệm{" "}
                <span className="text-orange-500">·</span> Tâm huyết
              </p>
              {/* Luôn 1 dòng (mobile thu tracking), chấm tròn cam phân cách — đồng bộ dòng tương tự ở Hero */}
              <p
                className="mt-3 flex items-center gap-2 text-[10px] font-medium tracking-[0.16em] whitespace-nowrap text-white/55 uppercase sm:gap-3 sm:text-[11px] sm:tracking-[0.3em]"
                style={{ animation: "fadeUp .8s cubic-bezier(.22,1,.36,1) .7s both" }}
              >
                Video production
                <span className="size-1 rounded-full bg-orange-500" />
                Studio
                <span className="size-1 rounded-full bg-orange-500" />
                Photography
              </p>
              <div className="mt-8 h-px w-40 overflow-hidden bg-white/15 sm:w-56">
                <div
                  className="h-full origin-left bg-orange-500"
                  style={{
                    animation: `heroProgress ${T_OUT - 150}ms cubic-bezier(.45,0,.2,1) both`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Viền sáng cam của khẩu độ — mở cùng lỗ tròn rồi tắt dần */}
        <span className="intro-ring pointer-events-none absolute top-1/2 left-1/2 rounded-full border-2 border-orange-500 shadow-[0_0_40px_6px_rgba(248,104,8,0.45),inset_0_0_30px_2px_rgba(248,104,8,0.35)]" />
      </div>
    </>
  );
}
