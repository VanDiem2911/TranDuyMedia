"use client";

import { useEffect, useRef, useState } from "react";
import { SmartImage as Image, ratioOf } from "@/components/ui/SmartImage";
import { Icon } from "@/components/icons";
import { SplitText } from "@/components/fx";
import { Container } from "@/components/ui";
import { btsImages } from "@/data/collections";
import { subscribeScroll } from "@/lib/scroll";
import { cn, pad } from "@/lib/utils";

const SLIDES = btsImages.slice(0, 4); // 4 ảnh hậu trường: máy quay, ekip, đèn
const TICK = 6000; // thời gian mỗi ảnh (ms) — khớp với thanh tiến trình

/**
 * `sizes` đúng bề rộng ảnh hiển thị: ảnh dọc phủ (object-cover) khung hero ~1 màn hình → khi màn hình "dọc hơn"
 * ảnh thì bề rộng ảnh = chiều cao màn × tỉ lệ ảnh, ngược lại = bề rộng màn; × 1.1 cho ken burns (phóng tới 110%).
 * Khai báo đúng ngay từ HTML → trình duyệt tải 1 lần đúng bản cần (không tải bản nhỏ rồi tải lại bản lớn).
 */
const heroSizes = (src) => {
  const r = ratioOf(src);
  if (!r) return "110vw";
  const [w, h] = [Math.round(r * 1000), 1000];
  return `(max-aspect-ratio: ${w}/${h}) ${Math.ceil(r * 110)}vh, 110vw`;
};

/**
 * Hero điện ảnh toàn màn hình, bố cục căn giữa kiểu Squarespace:
 * - Ảnh hậu trường chuyển cảnh chậm (ken-burns + crossfade), phủ tối đều để chữ luôn rõ.
 * - Giữa: eyebrow · tiêu đề 2 dòng · mô tả · 2 nút.
 * - Đáy: thanh thông tin thẳng hàng container — chú thích ảnh đang chiếu, tiến trình (bấm được), cuộn xuống.
 * - Parallax: ảnh trôi chậm hơn trang, chữ mờ dần khi cuộn (đồng bộ Lenis).
 */
export function Hero() {
  const [idx, setIdx] = useState(0);
  const [ready, setReady] = useState(false);
  const [first, setFirst] = useState(false); // đã bắt đầu tải ảnh hero đầu tiên
  const imgRef = useRef(null);
  const textRef = useRef(null);

  // Có màn chào (tải trang lần đầu / F5): đợi màn tách ra mới chạy hiệu ứng mở màn, để khách thấy trọn.
  // Chuyển trang bằng menu (không có màn chào): chạy ngay. Dự phòng 8.5s nếu sự kiện không tới.
  useEffect(() => {
    let t;
    const go = () => {
      clearTimeout(t);
      t = setTimeout(() => setReady(true), 120);
    };
    let f;
    if (document.getElementById("intro") && document.documentElement.dataset.intro !== "skip") {
      window.addEventListener("td:intro-reveal", go, { once: true });
      t = setTimeout(go, 8500);
      // Màn chào che hero ~3s: tải ảnh đầu sau 0.6s (vẫn xong rất lâu trước khi màn mở) → không giành băng thông
      // với logo màn chào, font, script lúc vừa mở trang (điện thoại 4G).
      f = setTimeout(() => setFirst(true), 600);
    } else {
      setFirst(true); // eslint-disable-line react-hooks/set-state-in-effect -- không có màn chào: hero là phần tử đầu tiên, tải ngay
      go();
    }
    return () => {
      clearTimeout(t);
      clearTimeout(f);
      window.removeEventListener("td:intro-reveal", go);
    };
  }, []);
  const anim = (cls) => (ready ? cls : "opacity-0");

  useEffect(
    () =>
      subscribeScroll(() => {
        const y = window.scrollY;
        const vh = window.innerHeight;
        if (y > vh * 1.2) return;
        if (imgRef.current)
          imgRef.current.style.transform = `translate3d(0, ${(y * 0.28).toFixed(1)}px, 0)`;
        if (textRef.current) {
          textRef.current.style.transform = `translate3d(0, ${(y * 0.12).toFixed(1)}px, 0)`;
          textRef.current.style.opacity = String(Math.max(0, 1 - y / (vh * 0.6)));
        }
      }),
    [],
  );

  // Tự chuyển ảnh; bấm vào thanh tiến trình sẽ đổi idx → effect chạy lại, đếm lại từ đầu
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setIdx((v) => (v + 1) % SLIDES.length), TICK);
    return () => clearTimeout(t);
  }, [ready, idx]);

  return (
    <section
      id="top"
      data-nav-theme="dark"
      className="relative h-(--screen) min-h-[600px] w-full overflow-hidden bg-navy-950 text-white short-m:h-auto short-m:min-h-svh"
    >
      {/* Lớp ngoài: parallax (transform inline). Lớp trong: hiệu ứng mở màn (animation transform).
          Tách 2 lớp vì animation CSS sẽ đè transform inline nếu đặt chung một phần tử. */}
      <div ref={imgRef} className="absolute inset-0 will-change-transform">
        <div className={cn("absolute inset-0", ready ? "hero-panel" : "opacity-0")}>
          {SLIDES.map((s, i) => (
            <div
              key={s.src}
              className={cn(
                "absolute inset-0 transition-opacity duration-[1800ms] ease-out",
                i === idx ? "opacity-100" : "opacity-0",
              )}
              aria-hidden={i !== idx}
            >
              {/* Ảnh 1 tải ngay khi không có màn chào, hoặc 0.6s sau khi mở trang nếu có màn chào; ảnh 2–4 chỉ tải
                  khi hero bắt đầu chạy — vẫn sớm hơn lúc hiện (6s) rất nhiều */}
              {((i === 0 && first) || ready) && (
                <Image
                  src={s.src}
                  alt={i === 0 ? s.alt : ""}
                  fill
                  loading="eager"
                  fetchPriority={i === 0 ? "high" : "low"}
                  autoSizes={false}
                  sizes={heroSizes(s.src)}
                  className={cn("object-cover", i === idx && "animate-kenburns")}
                  style={{ objectPosition: s.pos }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Phủ tối: đều toàn khung + đậm dần ở trên (header) và dưới (thanh thông tin) */}
      <div className="pointer-events-none absolute inset-0 bg-navy-950/55" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-linear-to-b from-navy-950/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-navy-950 via-navy-950/60 to-transparent" />

      {/* Nội dung chính — căn giữa */}
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex min-h-0 flex-1 items-center-safe justify-center px-5 pt-[max(5.5rem,11svh)] pb-[clamp(1rem,5svh,6rem)] lg:pb-[clamp(2rem,7svh,7rem)] short-m:pt-[6.5rem] short-d:pt-[6.75rem] short-d:pb-6">
          <div
            ref={textRef}
            className="flex max-w-6xl flex-col items-center text-center will-change-transform"
          >
            {/* Logo đầy đủ (biểu tượng TD + chữ TRAN DUY MEDIA — luôn đi liền, không tách).
                Hiện đầu tiên; quầng sáng cam mờ sau tam giác play gợi lại glow của logo gốc.
                Cao theo chiều cao màn hình để không lấn chỗ tiêu đề trên màn thấp. */}
            <div
              className={cn(
                "relative mb-5 sm:mb-6 short-m:mb-3 short-d:mb-4",
                anim("[animation:fadeUp_1.1s_.25s_both]"),
              )}
            >
              <span
                aria-hidden="true"
                className="absolute top-[28%] left-[62%] -z-10 size-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/20 blur-2xl"
              />
              <Image
                src="/images/brand/logo-light.webp"
                alt="Tran Duy Media Studio"
                width={989}
                height={768}
                preload
                sizes="200px"
                className="h-[clamp(3.5rem,10svh,6.5rem)] w-auto drop-shadow-[0_4px_18px_rgba(0,0,0,0.45)] short-m:h-[clamp(2.75rem,7.5svh,3.5rem)] short-d:h-[clamp(3rem,8.5svh,4.5rem)]"
              />
            </div>

            <p
              className={cn(
                "flex items-center gap-2 text-[10px] font-semibold tracking-[0.16em] whitespace-nowrap text-white/80 uppercase max-[359px]:hidden sm:gap-3 sm:text-[11px] sm:tracking-eyebrow",
                anim("[animation:fadeUp_1s_.5s_both]"),
              )}
            >
              <span className="hidden h-px w-8 bg-orange-500 sm:block" />
              Video production
              <span className="size-1 rounded-full bg-orange-500" />
              Studio
              <span className="size-1 rounded-full bg-orange-500" />
              Photography
              <span className="hidden h-px w-8 bg-orange-500 sm:block" />
            </p>

            <SplitText
              as="h1"
              text="Đối tác gia công video, hình ảnh toàn diện cho doanh nghiệp"
              accent="toàn diện cho doanh nghiệp"
              accentClass="text-orange-500"
              breakBefore="toàn"
              keep={["Đối tác", "gia công", "hình ảnh", "toàn diện", "doanh nghiệp"]}
              visible={ready}
              manual
              step={55}
              baseDelay={650}
              className="mt-6 text-[clamp(2.1rem,min(5.4vw,7.6svh),5.4rem)] h-display leading-[1.3] text-balance text-white text-legible-lg sm:mt-7 short-m:mt-4 short-m:text-[1.9rem] short-d:mt-5"
            />

            <p
              className={cn(
                "mt-6 max-w-xl text-[15px] leading-relaxed text-balance text-white/80 text-legible sm:text-lg short-m:mt-4 short-m:text-[14px] short-d:mt-4",
                anim("[animation:fadeUp_1s_1.4s_both]"),
              )}
            >
              Hơn 10 năm sản xuất video marketing, iTVC, phim doanh nghiệp, chụp ảnh quảng cáo và
              cho thuê studio.
            </p>

            <div
              className={cn(
                "mt-9 flex w-full max-w-[300px] flex-col items-stretch gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center sm:justify-center short-m:mt-6 short-m:gap-2.5 short-d:mt-7",
                anim("[animation:fadeUp_1s_1.65s_both]"),
              )}
            >
              <button
                type="button"
                data-showreel
                className="group relative inline-flex h-12 items-center justify-center gap-3 rounded-full bg-white pl-6 text-sm font-medium text-navy-900 transition hover:bg-paper-100 sm:h-auto sm:py-1.5 sm:pr-1.5 short-m:h-11"
              >
                Xem showreel 2026
                <span className="absolute right-1.5 flex size-9 items-center justify-center rounded-full bg-orange-500 text-white transition-transform group-hover:scale-110 sm:static">
                  <Icon name="play" className="ml-0.5 size-4" strokeWidth={0} fill="currentColor" />
                </span>
              </button>
              <button
                type="button"
                data-booking
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/40 px-7 text-sm font-medium text-white transition hover:border-white hover:bg-white hover:text-navy-900 sm:h-auto sm:py-3.5 short-m:h-11"
              >
                Đặt lịch tư vấn
              </button>
            </div>
          </div>
        </div>

        {/* Thanh thông tin đáy — thẳng hàng với container */}
        <Container className={cn("pb-6 sm:pb-8", anim("[animation:fadeIn_1.2s_2s_both]"))}>
          <div className="flex items-center justify-between gap-6 border-t border-white/15 pt-5 text-[11px] tracking-[0.2em] text-white/70 uppercase">
            {/* Số thứ tự ảnh đang chiếu (không hiện chú thích ảnh — feedback khách hàng) */}
            <p className="hidden min-w-0 items-center gap-3 md:flex">
              <span className="font-semibold text-white tabular-nums">
                {pad(idx + 1)}
                <span className="text-white/40"> / {pad(SLIDES.length)}</span>
              </span>
            </p>

            {/* Tiến trình: mỗi ảnh một vạch, vạch hiện tại chạy đầy theo TICK */}
            <div className="flex flex-1 items-center justify-center gap-2 md:flex-none">
              {SLIDES.map((s, i) => (
                <button
                  key={s.src}
                  type="button"
                  onClick={() => setIdx(i)}
                  aria-label={`Ảnh ${i + 1}: ${s.alt}`}
                  aria-current={i === idx ? "true" : undefined}
                  className="group py-3"
                >
                  <span className="relative block h-0.5 w-10 overflow-hidden rounded-full bg-white/25 transition-colors group-hover:bg-white/50 sm:w-14">
                    {i === idx && ready && (
                      <span
                        key={idx}
                        className="absolute inset-0 origin-left bg-orange-500"
                        style={{ animation: `heroProgress ${TICK}ms linear both` }}
                      />
                    )}
                    {i < idx && <span className="absolute inset-0 bg-white/70" />}
                  </span>
                </button>
              ))}
            </div>

            <a
              href="#showreel"
              className="hidden items-center gap-2 transition-colors hover:text-white md:flex"
            >
              Cuộn xuống
              <Icon name="arrowDown" className="size-3.5 animate-bounce" />
            </a>
          </div>
        </Container>
      </div>
    </section>
  );
}
