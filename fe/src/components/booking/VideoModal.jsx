"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { siteConfig } from "@/config/site";
import { inlineShowreel, pickShowreelSrc } from "@/lib/showreel";
import { lockScroll } from "@/lib/utils";

/**
 * Popup xem showreel toàn màn hình, CÓ TIẾNG (người dùng vừa bấm nên trình duyệt cho phép).
 * Mở bằng bất kỳ phần tử nào có thuộc tính data-showreel.
 * Nếu video trong trang đang chạy: popup tiếp tục đúng giây đó, video trong trang tạm dừng;
 * đóng popup thì video trong trang chạy tiếp.
 * Clip sản phẩm (Google Drive): phần tử có data-video="<link nhúng>" (+ data-video-title, data-video-vertical)
 * → popup phát bằng trình phát nhúng của Drive.
 */
export function VideoModal() {
  const [state, setState] = useState(null); // { src, startAt } | { embed, title, vertical }
  const resumeInlineRef = useRef(false); // video trong trang đang chạy lúc mở popup → chạy tiếp khi đóng

  const close = useCallback(() => {
    if (resumeInlineRef.current)
      inlineShowreel()
        ?.play()
        .catch(() => {});
    resumeInlineRef.current = false;
    setState(null);
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      const clip = e.target.closest("[data-video], [data-video-src]");
      if (clip) {
        e.preventDefault();
        const inline = inlineShowreel();
        resumeInlineRef.current = !!inline && !inline.paused;
        inline?.pause();
        setState({
          embed: clip.getAttribute("data-video"),
          // data-video-src: tệp MP4 (Cloudinary) → phát bằng <video> thay cho khung nhúng
          src: clip.getAttribute("data-video-src") || null,
          poster: clip.getAttribute("data-video-poster") || undefined,
          title: clip.getAttribute("data-video-title") || "",
          vertical: clip.hasAttribute("data-video-vertical"),
        });
        return;
      }
      const el = e.target.closest("[data-showreel]");
      if (!el) return;
      e.preventDefault();
      const inline = inlineShowreel();
      resumeInlineRef.current = !!inline && !inline.paused;
      inline?.pause();
      setState({
        src: pickShowreelSrc(),
        startAt: inline && inline.currentTime > 1 ? inline.currentTime : 0,
      });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!state) return;
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    lockScroll(true);
    return () => {
      window.removeEventListener("keydown", onKey);
      lockScroll(false);
    };
  }, [state, close]);

  if (!state) return null;
  const { showreel } = siteConfig;

  return (
    <div
      className="fixed inset-0 z-150 flex items-center justify-center p-3 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label={state.embed || state.src ? state.title || "Xem video" : showreel.title}
    >
      <div
        className="absolute inset-0 [animation:fadeIn_.4s_ease-out_both] bg-navy-950/95"
        onClick={close}
      />
      <button
        type="button"
        onClick={close}
        aria-label="Đóng"
        className="absolute top-4 right-4 z-10 flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25"
      >
        <Icon name="close" className="size-5" />
      </button>
      {state.embed || state.src ? (
        // Clip dọc 9:16: khung cao theo màn hình; clip ngang: 16:9 rộng tối đa 6xl
        <div
          className={
            state.vertical
              ? "relative w-[min(100%,calc((100svh-7rem)*9/16))] [animation:popIn_.55s_cubic-bezier(.22,1,.36,1)_both]"
              : "relative w-full max-w-6xl [animation:popIn_.55s_cubic-bezier(.22,1,.36,1)_both]"
          }
        >
          {state.title && (
            <p className="mb-3 flex items-center gap-3 text-[11px] tracking-eyebrow text-white/60 uppercase">
              <span className="size-1.5 rounded-full bg-orange-500" />
              {state.title}
            </p>
          )}
          <div
            className={`overflow-hidden rounded-2xl bg-black shadow-soft ${state.vertical ? "aspect-9/16" : "aspect-video"}`}
          >
            {state.src ? (
              <video
                src={state.src}
                poster={state.poster}
                controls
                autoPlay
                playsInline
                className="size-full bg-black object-contain"
              />
            ) : (
              <iframe
                src={state.embed}
                title={state.title || "Video"}
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                allowFullScreen
                className="size-full border-0"
              />
            )}
          </div>
        </div>
      ) : (
        <div className="relative w-full max-w-6xl [animation:popIn_.55s_cubic-bezier(.22,1,.36,1)_both]">
          <p className="mb-3 flex items-center gap-3 text-[11px] tracking-eyebrow text-white/60 uppercase">
            <span className="size-1.5 rounded-full bg-orange-500" />
            {showreel.title} - {showreel.duration}
          </p>
          <div className="aspect-video overflow-hidden rounded-2xl bg-black shadow-soft">
            <video
              src={state.src}
              poster={showreel.poster}
              controls
              autoPlay
              playsInline
              onLoadedMetadata={(e) => {
                if (state.startAt) e.currentTarget.currentTime = state.startAt;
              }}
              className="size-full bg-black"
            />
          </div>
        </div>
      )}
    </div>
  );
}
