import { SmartImage as Image } from "@/components/ui/SmartImage";
import { Parallax } from "@/components/fx";
import { Button, Container } from "@/components/ui";
import { stats } from "@/data/services";

/**
 * Giới thiệu ngắn (khớp nội dung trang Về chúng tôi) + số liệu (USP: 10+ năm, trọn gói).
 * Bên phải: ảnh hậu trường lớn + ảnh nhỏ (ảnh studio khách chọn — feedback 02/11) xếp lệch, parallax nhẹ.
 */
export function Intro() {
  return (
    <section className="relative overflow-hidden bg-white section-y" data-nav-theme="light">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
          <div>
            <p className="reveal mb-4 eyebrow">Về Trần Duy Media</p>
            <h2 className="reveal h-section" style={{ "--reveal-delay": "80ms" }}>
              <span className="whitespace-nowrap">Đồng hành</span> trên{" "}
              <span className="whitespace-nowrap">hành trình</span>{" "}
              <span className="whitespace-nowrap">phát triển</span>{" "}
              <span className="whitespace-nowrap">cùng doanh nghiệp.</span>
            </h2>
            <p
              className="reveal mt-6 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg"
              style={{ "--reveal-delay": "160ms" }}
            >
              Đơn vị chuyên gia công nội dung truyền thông, thương mại quảng cáo — bắt đầu từ tinh
              thần yêu nghề và kinh nghiệm thực chiến, cùng doanh nghiệp nâng tầm giá trị vững bền.
            </p>
            <div
              className="reveal btn-row mt-8 flex flex-wrap gap-3"
              style={{ "--reveal-delay": "240ms" }}
            >
              <Button href="/gioi-thieu" pill>
                Câu chuyện của chúng tôi
              </Button>
              <Button href="/dich-vu" variant="outline">
                Xem dịch vụ
              </Button>
            </div>

            <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-8 border-t border-ink/10 pt-8 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {stats.map((s, i) => (
                <div key={s.label} className="reveal" style={{ "--reveal-delay": `${i * 90}ms` }}>
                  <dd className="text-4xl h-display text-navy-900 sm:text-5xl">{s.value}</dd>
                  <dt className="mt-2 text-sm text-balance text-ink-soft">{s.label}</dt>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative aspect-[100/88] lg:aspect-auto lg:min-h-0">
            <Parallax speed={0.08} className="absolute top-0 right-0 w-[68%]" desktopOnly>
              <div
                className="reveal relative aspect-4/5 overflow-hidden rounded-2xl shadow-soft"
                data-reveal="scale"
              >
                <Image
                  src="/images/bts/bts-05.webp"
                  alt="Ekip Trần Duy Media trên trường quay"
                  fill
                  sizes="(min-width: 1024px) 34vw, 68vw"
                  className="object-cover"
                />
              </div>
            </Parallax>
            {/* Ảnh nhỏ bên trái: thay bằng ảnh khách chọn (feedback 02/11, mục 6) */}
            <Parallax speed={-0.06} className="absolute bottom-0 left-0 w-[52%]" desktopOnly>
              <div
                className="reveal relative aspect-square overflow-hidden rounded-2xl shadow-soft"
                data-reveal="scale"
                style={{ "--reveal-delay": "200ms" }}
              >
                <Image
                  src="/images/about-hd/studio-interview.webp"
                  alt="Setup quay phỏng vấn tại studio Trần Duy Media"
                  fill
                  sizes="(min-width: 1024px) 26vw, 52vw"
                  className="object-cover"
                  style={{ objectPosition: "center 55%" }}
                />
              </div>
            </Parallax>
            {/* Neo theo mép phải: luôn kết thúc cách mép trái ảnh lớn (rộng 68%, sát phải) 1.5rem → không chạm ảnh */}
            <span
              aria-hidden="true"
              className="absolute top-[8%] right-[calc(68%+1.5rem)] hidden text-[clamp(4.5rem,7vw,7rem)] h-display leading-none whitespace-nowrap text-paper-200 select-none lg:block"
            >
              10+
            </span>
          </div>
        </div>
      </Container>
    </section>
  );
}
