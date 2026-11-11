import { ImageTools } from "@/components/admin/about/inline-edit";
import { Pic, T } from "@/components/about/edit-kit";
import { Parallax } from "@/components/fx";
import { Button, Container } from "@/components/ui";
import { homeDefaults } from "@/data/home-content";

/**
 * Giới thiệu ngắn (khớp nội dung trang Về chúng tôi) + số liệu (USP: 10+ năm, trọn gói).
 * Bên phải: ảnh hậu trường lớn + ảnh nhỏ (ảnh studio khách chọn — feedback 02/11) xếp lệch, parallax nhẹ.
 * content: nội dung chỉnh được từ trang quản trị (mặc định = homeDefaults.intro); edit: chế độ sửa trực tiếp (trang quản trị).
 */
export function Intro({ content = homeDefaults.intro, edit }) {
  const { imageMain, imageSmall } = content;
  return (
    <section className="relative overflow-hidden bg-white section-y" data-nav-theme="light">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <div>
            <p className="reveal mb-4 eyebrow">
              <T edit={edit} path="intro.eyebrow" value={content.eyebrow} />
            </p>
            <h2 className="reveal h-section" style={{ "--reveal-delay": "80ms" }}>
              <T edit={edit} path="intro.title" value={content.title} />
            </h2>
            <p
              className="reveal mt-6 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg"
              style={{ "--reveal-delay": "160ms" }}
            >
              <T edit={edit} path="intro.description" value={content.description} />
            </p>
            <div
              className="reveal btn-row mt-8 flex flex-wrap gap-3"
              style={{ "--reveal-delay": "240ms" }}
            >
              <Button href="/gioi-thieu" pill>
                <T edit={edit} path="intro.primaryLabel" value={content.primaryLabel} />
              </Button>
              <Button href="/dich-vu" variant="outline">
                <T edit={edit} path="intro.secondaryLabel" value={content.secondaryLabel} />
              </Button>
            </div>

            <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-8 border-t border-ink/10 pt-8 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {content.stats.map((s, i) => (
                <div key={i} className="reveal" style={{ "--reveal-delay": `${i * 90}ms` }}>
                  <dd className="text-4xl h-display text-navy-900 sm:text-5xl">
                    <T edit={edit} path={`intro.stats.${i}.value`} value={s.value} />
                  </dd>
                  <dt className="mt-2 text-sm text-balance text-ink-soft">
                    <T edit={edit} path={`intro.stats.${i}.label`} value={s.label} />
                  </dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative aspect-[100/88] lg:aspect-auto lg:min-h-0">
            <Parallax speed={0.08} className="absolute top-0 right-0 w-[68%]" desktopOnly>
              <div
                className="group reveal relative aspect-4/5 overflow-hidden rounded-2xl shadow-soft"
                data-reveal="scale"
              >
                <Pic
                  edit={edit}
                  src={imageMain.src}
                  alt={imageMain.alt}
                  pos={imageMain.pos}
                  sizes="(min-width: 1024px) 34vw, 68vw"
                  className="object-cover"
                />
                {edit && (
                  <ImageTools edit={edit} path="intro.imageMain" altPath="intro.imageMain.alt" />
                )}
              </div>
            </Parallax>
            {/* Ảnh nhỏ bên trái: thay bằng ảnh khách chọn (feedback 02/11, mục 6) */}
            <Parallax speed={-0.06} className="absolute bottom-0 left-0 w-[52%]" desktopOnly>
              <div
                className="group reveal relative aspect-square overflow-hidden rounded-2xl shadow-soft"
                data-reveal="scale"
                style={{ "--reveal-delay": "200ms" }}
              >
                <Pic
                  edit={edit}
                  src={imageSmall.src}
                  alt={imageSmall.alt}
                  pos={imageSmall.pos}
                  sizes="(min-width: 1024px) 26vw, 52vw"
                  className="object-cover"
                />
                {edit && (
                  <ImageTools edit={edit} path="intro.imageSmall" altPath="intro.imageSmall.alt" />
                )}
              </div>
            </Parallax>
            {/* Neo theo mép phải: luôn kết thúc cách mép trái ảnh lớn (rộng 68%, sát phải) 1.5rem → không chạm ảnh */}
            <span
              aria-hidden={edit ? undefined : "true"}
              className="absolute top-[8%] right-[calc(68%+1.5rem)] hidden text-[clamp(4.5rem,7vw,7rem)] h-display leading-none whitespace-nowrap text-paper-200 select-none lg:block"
            >
              <T edit={edit} path="intro.bigNumber" value={content.bigNumber} />
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
}
