import { SmartImage as Image } from "@/components/ui/SmartImage";
import { Icon } from "@/components/icons";
import { Parallax, SplitText } from "@/components/fx";
import { Container } from "@/components/ui";
import { stats } from "@/data/services";

const FRAMES = [
  { src: "/images/clips/short-3.webp", pos: "center 35%", h: "h-[86%]", speed: 0.05, delay: 0 },
  {
    src: "/images/bts/bts-16.webp",
    pos: "center 40%",
    h: "h-full",
    speed: -0.04,
    delay: 120,
  },
  {
    src: "/images/studio/room-1-01.webp",
    pos: "center",
    h: "h-[86%]",
    speed: 0.07,
    delay: 240,
  },
];

/**
 * Hero trang Dịch vụ (theo bố cục ButStudio): chữ bên trái, bên phải 3 ảnh dọc so le
 * (ảnh giữa cao nhất) có parallax nhẹ; chữ "Services" chìm lớn phía sau; dải số liệu dưới nút.
 * Lưu ý: .reveal đặt ở phần tử CON của <Parallax> (Parallax dùng transform inline).
 * Desktop: cỡ tiêu đề & khoảng cách dọc co theo chiều cao màn hình (vh, có trần = cỡ cũ) → màn thấp
 * (laptop, trình duyệt chưa F11) vẫn thấy trọn dải số liệu ngay khi vào trang.
 */
export function ServicesHero() {
  return (
    <section className="relative isolate flex screen items-center overflow-hidden bg-paper pt-28 pb-16 lg:pt-[clamp(6rem,14vh,7rem)] lg:pb-[clamp(2rem,6vh,3rem)]">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-stretch lg:gap-16">
          <div className="relative">
            <p className="reveal eyebrow">Dịch vụ - Trần Duy Media Studio</p>
            <SplitText
              as="h1"
              text="Một ekip cho trọn chiến dịch hình ảnh"
              accent="trọn chiến dịch hình ảnh"
              breakBeforeAccent
              breakBefore="hình"
              keep={["hình ảnh"]}
              className="mt-5 text-[2.5rem] h-display text-balance sm:text-[3.3rem] lg:mt-[clamp(0.75rem,2vh,1.25rem)] lg:text-[clamp(2.5rem,6.8vh,3.6rem)] xl:text-[clamp(2.75rem,7.8vh,4.1rem)]"
            />
            <p
              className="reveal mt-6 max-w-lg text-[15px] leading-relaxed text-ink-soft sm:text-base lg:mt-[clamp(1rem,2.5vh,1.5rem)] lg:text-[clamp(1rem,2.3vh,1.0625rem)]"
              style={{ "--reveal-delay": "250ms" }}
            >
              Video short marketing, iTVC & viral, phim doanh nghiệp & sự kiện, chụp ảnh quảng cáo
              và cho thuê studio — năm dịch vụ bổ trợ nhau, được thực hiện bởi cùng một đội ngũ nên
              hình ảnh luôn đồng bộ, tiến độ rõ ràng.
            </p>
            <div
              className="reveal mt-8 flex flex-wrap items-center gap-3 lg:mt-[clamp(1.25rem,3.2vh,2.25rem)]"
              style={{ "--reveal-delay": "350ms" }}
            >
              <button
                type="button"
                data-booking
                className="group inline-flex items-center gap-3 rounded-full bg-navy-900 py-1.5 pr-1.5 pl-6 text-sm font-medium text-white shadow-card transition hover:bg-navy-700"
              >
                Đặt lịch tư vấn
                <span className="flex size-9 items-center justify-center rounded-full bg-orange-500 text-white transition-transform group-hover:translate-x-0.5">
                  <Icon name="arrowRight" className="size-4" />
                </span>
              </button>
            </div>
            {/* Dải số liệu + chữ chìm "Services" chồng cùng 1 ô lưới, khít nhau cả 2 chiều (desktop):
                - bề rộng: chữ Services quyết định, dải số liệu (w-0 min-w-full) trải đúng bằng nó;
                - chiều cao: phần nét chữ của Be Vietnam Pro đậm cao 0.79em (từ 0.085em dưới đỉnh dòng
                  line-height 1) → kéo chữ lên 0.085em, cắt bớt phần dư dưới, dải số liệu cao tối thiểu
                  0.79em → đường kẻ trùng đỉnh chữ, đáy dải số liệu trùng chân chữ. */}
            <div className="mt-10 grid lg:mt-[clamp(1.25rem,3.4vh,2.5rem)] lg:w-max lg:max-w-full lg:text-[clamp(6rem,8.5vw,8.5rem)]">
              <span
                aria-hidden="true"
                className="pointer-events-none hidden justify-self-start h-display leading-none whitespace-nowrap text-ink/[0.04] select-none [grid-area:1/1] lg:-mt-[0.085em] lg:-mb-[0.125em] lg:block lg:-translate-x-[0.15em]"
              >
                Services
              </span>
              <dl
                className="reveal grid max-w-lg grid-cols-3 gap-6 border-t border-ink/10 pt-7 [grid-area:1/1] lg:min-h-[0.79em] lg:w-0 lg:max-w-none lg:min-w-full lg:content-center lg:pt-5 lg:pb-1"
                style={{ "--reveal-delay": "450ms" }}
              >
                {stats.slice(0, 3).map((s) => (
                  <div key={s.label}>
                    <dt className="text-3xl h-display text-navy-900 sm:text-4xl lg:text-[clamp(1.875rem,5.2vh,2.25rem)]">
                      {s.value}
                    </dt>
                    <dd className="mt-1 text-[12px] leading-snug text-balance text-ink-muted">
                      {s.label}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* 3 ảnh dọc so le */}
          <div className="relative grid h-[70vw] grid-cols-3 items-end gap-3 sm:h-[52vw] lg:h-auto lg:gap-4">
            {FRAMES.map((f, i) => (
              <Parallax key={f.src} desktopOnly speed={f.speed} className={f.h}>
                <div
                  className="reveal relative size-full overflow-hidden rounded-3xl bg-paper-200"
                  data-reveal="clip"
                  style={{ "--reveal-delay": `${f.delay}ms` }}
                >
                  <Image
                    src={f.src}
                    alt=""
                    fill
                    preload
                    sizes="(min-width:1024px) 18vw, 30vw"
                    className="object-cover"
                    style={{ objectPosition: f.pos }}
                  />
                </div>
              </Parallax>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
