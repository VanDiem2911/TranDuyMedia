import { ImageTools } from "@/components/admin/about/inline-edit";
import { Pic, T } from "@/components/about/edit-kit";
import { Icon } from "@/components/icons";
import { Parallax, SplitText } from "@/components/fx";
import { Container } from "@/components/ui";
import { servicesDefaults } from "@/data/services-content";

// Bố cục (không đổi) của 3 ảnh dọc so le; ảnh + vị trí cắt lấy từ nội dung chỉnh được
const FRAMES = [
  { h: "h-[86%]", speed: 0.05, delay: 0 },
  { h: "h-full", speed: -0.04, delay: 120 },
  { h: "h-[86%]", speed: 0.07, delay: 240 },
];

/**
 * Hero trang Dịch vụ (theo bố cục ButStudio): chữ bên trái, bên phải 3 ảnh dọc so le
 * (ảnh giữa cao nhất) có parallax nhẹ; chữ "Services" chìm lớn phía sau; dải số liệu dưới nút.
 * Lưu ý: .reveal đặt ở phần tử CON của <Parallax> (Parallax dùng transform inline).
 * Desktop: cỡ tiêu đề & khoảng cách dọc co theo chiều cao màn hình (vh, có trần = cỡ cũ) → màn thấp
 * (laptop, trình duyệt chưa F11) vẫn thấy trọn dải số liệu ngay khi vào trang.
 * content: nội dung chỉnh được từ trang quản trị (mặc định = servicesDefaults.hero); edit: chế độ sửa trực tiếp.
 */
const TITLE_CLASS =
  "mt-5 text-[2.5rem] h-display text-balance sm:text-[3.3rem] lg:mt-[clamp(0.75rem,2vh,1.25rem)] lg:text-[clamp(2.5rem,6.8vh,3.6rem)] xl:text-[clamp(2.75rem,7.8vh,4.1rem)]";

export function ServicesHero({ content = servicesDefaults.hero, edit }) {
  return (
    <section className="relative isolate flex screen items-center overflow-hidden bg-paper pt-28 pb-16 lg:pt-[clamp(6rem,14vh,7rem)] lg:pb-[clamp(2rem,6vh,3rem)]">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-stretch lg:gap-16">
          <div className="relative">
            <p className="reveal eyebrow">
              <T edit={edit} path="hero.eyebrow" value={content.eyebrow} />
            </p>
            {edit ? (
              <h1 className={TITLE_CLASS}>
                <T edit={edit} path="hero.titleLead" value={content.titleLead} />{" "}
                <span className="text-orange-500">
                  <T edit={edit} path="hero.titleAccent" value={content.titleAccent} />
                </span>
              </h1>
            ) : (
              <SplitText
                as="h1"
                text={`${content.titleLead} ${content.titleAccent}`}
                accent={content.titleAccent}
                breakBeforeAccent
                breakBefore={content.titleAccent.split(" ").at(-2)}
                keep={["hình ảnh"].filter((k) => content.titleAccent.includes(k))}
                className={TITLE_CLASS}
              />
            )}
            <p
              className="reveal mt-6 max-w-lg text-[15px] leading-relaxed text-ink-soft sm:text-base lg:mt-[clamp(1rem,2.5vh,1.5rem)] lg:text-[clamp(1rem,2.3vh,1.0625rem)]"
              style={{ "--reveal-delay": "250ms" }}
            >
              <T edit={edit} path="hero.description" value={content.description} />
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
                <T edit={edit} path="hero.bookingLabel" value={content.bookingLabel} />
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
                {content.stats.map((s, i) => (
                  <div key={i}>
                    <dt className="text-3xl h-display text-navy-900 sm:text-4xl lg:text-[clamp(1.875rem,5.2vh,2.25rem)]">
                      <T edit={edit} path={`hero.stats.${i}.value`} value={s.value} />
                    </dt>
                    <dd className="mt-1 text-[12px] leading-snug text-balance text-ink-muted">
                      <T edit={edit} path={`hero.stats.${i}.label`} value={s.label} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* 3 ảnh dọc so le */}
          <div className="relative grid h-[70vw] grid-cols-3 items-end gap-3 sm:h-[52vw] lg:h-auto lg:gap-4">
            {FRAMES.map((f, i) => {
              const frame = content.frames[i].image;
              return (
                <Parallax key={i} desktopOnly speed={f.speed} className={f.h}>
                  <div className="group relative size-full">
                    <div
                      className="reveal relative size-full overflow-hidden rounded-3xl bg-paper-200"
                      data-reveal="clip"
                      style={{ "--reveal-delay": `${f.delay}ms` }}
                    >
                      <Pic
                        edit={edit}
                        src={frame.src}
                        alt=""
                        pos={frame.pos}
                        preload={!edit}
                        sizes="(min-width:1024px) 18vw, 30vw"
                        className="object-cover"
                      />
                    </div>
                    {edit && <ImageTools edit={edit} path={`hero.frames.${i}.image`} />}
                  </div>
                </Parallax>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
