import Link from "next/link";
import { SmartImage as Image } from "@/components/ui/SmartImage";
import { LoopCarousel, ZoomGroup, ZoomImage } from "@/components/gallery";
import { PageHeader, Partners, Showreel, Values } from "@/components/sections";
import { Button, Container, SectionHeading } from "@/components/ui";
import {
  aboutHeaderColumns,
  companyFacts,
  ecosystem,
  mission,
  productionStandards,
  profileImage,
  vision,
} from "@/data/about";
import { createMetadata } from "@/lib/metadata";
import { cn, pad } from "@/lib/utils";

export const metadata = createMetadata({
  title: "Về chúng tôi",
  description:
    "Trần Duy Media – đối tác gia công video, hình ảnh toàn diện cho doanh nghiệp với hơn 10 năm kinh nghiệm thực chiến: video short, iTVC, phim doanh nghiệp & sự kiện, chụp ảnh quảng cáo và cho thuê studio tại TP.HCM.",
  path: "/gioi-thieu",
  image: "/images/bts/bts-05.webp",
});

/**
 * Trang Về chúng tôi — bố cục liền mạch, cô đọng (feedback 02/11), nền sáng/tối xen kẽ:
 * câu chuyện → giá trị cốt lõi (tầm nhìn · sứ mệnh) → chuẩn mực sản xuất → hệ sinh thái dịch vụ (cuộn ngang)
 * → vì sao khách hàng chọn Trần Duy Media → showreel → đối tác (ngay trên "Bắt đầu dự án…" của chân trang).
 */
export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="Về chúng tôi"
        eyebrow="Hồ sơ doanh nghiệp"
        description={
          "Gia công video, hình ảnh thương mại quảng cáo tại TP.HCM — hơn 10 năm đồng hành cùng doanh nghiệp Việt."
        }
        columns={aboutHeaderColumns}
      />
      <Profile />
      <CoreValues />
      <Standards />
      <Ecosystem />
      {/* Ngay sau khối tối Hệ sinh thái → kẻ 1 đường mảnh ngăn cách 2 khối nền tối */}
      <Values
        className="border-t border-white/10"
        eyebrow="Khách hàng tin tưởng chọn Tran Duy Media"
        description="Ba giá trị chúng tôi giữ trong mọi khung hình — từ buổi trao đổi đầu tiên đến file bàn giao cuối cùng."
      />
      <Showreel id="showreel-gioi-thieu" />
      <Partners />
    </>
  );
}

/* ── Thông điệp & câu chuyện: giới thiệu + hồ sơ nhanh | 1 ảnh cao bằng cột chữ ── */
function Profile() {
  return (
    <section className="bg-paper section-y" data-nav-theme="light">
      <Container className="grid gap-12 lg:grid-cols-[1.25fr_1fr] lg:gap-20">
        <div>
          <SectionHeading
            eyebrow="Câu chuyện của chúng tôi"
            title={
              <>
                Đối tác gia công video, <span className="whitespace-nowrap">hình ảnh</span>{" "}
                <span className="text-orange-500">
                  toàn diện cho <span className="whitespace-nowrap">doanh nghiệp.</span>
                </span>
              </>
            }
          />
          {/* 2 thông điệp phụ khách muốn giữ cùng tiêu đề (feedback 02/11, mục 20) */}
          <ul
            className="reveal mt-5 space-y-2 border-l-2 border-orange-500 pl-4 sm:pl-5"
            style={{ "--reveal-delay": "120ms" }}
          >
            {[
              "Đồng hành bền vững cùng doanh nghiệp",
              "Đồng hành nâng tầm giá trị doanh nghiệp",
            ].map((t) => (
              <li
                key={t}
                className="text-lg leading-snug font-bold tracking-tight text-orange-500 sm:text-xl"
              >
                {t}
              </li>
            ))}
          </ul>
          <div
            className="reveal mt-6 space-y-4 text-base leading-relaxed text-ink-soft sm:text-lg"
            style={{ "--reveal-delay": "160ms" }}
          >
            <p>
              Trần Duy Media là đơn vị chuyên gia công nội dung truyền thông, thương mại quảng cáo.
              Bắt đầu từ tinh thần yêu nghề, kinh nghiệm thực chiến với hơn 10 năm đồng hành chuyên
              sâu, chúng tôi đã triển khai thành công nhiều dự án.
            </p>
            <p>
              Chúng tôi luôn nỗ lực mỗi ngày — nơi sáng tạo, sự đổi mới không chỉ dừng ở việc phục
              vụ mục tiêu kinh doanh của khách hàng, mà hơn hết là sự đồng hành cùng kiến tạo và
              nâng tầm giá trị doanh nghiệp vững bền.
            </p>
          </div>

          <dl className="mt-8 grid gap-x-10 border-t border-ink/10 sm:grid-cols-2">
            {companyFacts.map((f, i) => (
              <div
                key={f.label}
                className="reveal border-b border-ink/10 py-3.5"
                style={{ "--reveal-delay": `${(i % 2) * 80}ms` }}
              >
                <dt className="text-[11px] font-semibold tracking-eyebrow text-ink-muted uppercase">
                  {f.label}
                </dt>
                <dd className="mt-1.5 font-semibold text-ink">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* 1 ảnh đại diện — cao bằng cột chữ trên desktop */}
        <ZoomGroup images={[profileImage]}>
          <div className="reveal h-[460px] sm:h-[560px] lg:h-full" data-reveal="scale">
            <ZoomImage
              index={0}
              src={profileImage.src}
              alt={profileImage.alt}
              pos={profileImage.pos}
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="size-full rounded-2xl bg-paper-200 shadow-card"
            />
          </div>
        </ZoomGroup>
      </Container>
    </section>
  );
}

/* ── Giá trị cốt lõi: 2 thẻ khung hình điện ảnh (bản ban đầu) — Tầm nhìn (cam, trái) · Sứ mệnh (navy, phải).
   Ảnh nền phủ màu thương hiệu, 4 góc khung ngắm, câu tuyên bố lớn ở đáy.
   Rê chuột: ảnh phóng chậm, góc khung chuyển cam / trắng. ── */
function CoreValues() {
  return (
    <section className="bg-white section-y" data-nav-theme="light">
      <Container>
        <SectionHeading align="center" eyebrow="Trần Duy Media" title="Những giá trị cốt lõi." />
        <div className="mt-12 grid gap-5 sm:mt-14 md:grid-cols-2">
          {[vision, mission].map((b, i) => (
            <StatementCard key={b.title} item={b} index={i} />
          ))}
        </div>
      </Container>
    </section>
  );
}

const CORNERS = [
  "top-5 left-5 border-t-2 border-l-2",
  "top-5 right-5 border-t-2 border-r-2",
  "bottom-5 left-5 border-b-2 border-l-2",
  "bottom-5 right-5 border-b-2 border-r-2",
];

function StatementCard({ item, index }) {
  const orange = item === vision; // thẻ Tầm nhìn nền cam, Sứ mệnh nền navy
  return (
    <article
      className="group reveal relative isolate flex min-h-[400px] flex-col justify-between overflow-hidden rounded-3xl p-9 text-white sm:min-h-[460px] sm:p-12"
      data-reveal="scale"
      style={{ "--reveal-delay": `${index * 120}ms` }}
    >
      <Image
        src={item.image}
        alt=""
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        className={cn(
          "-z-20 object-cover transition-transform duration-[2000ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-105",
          !orange && "grayscale",
        )}
        style={{ objectPosition: item.imagePos }}
      />
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 -z-10",
          orange
            ? "bg-linear-to-t from-orange-600 via-orange-500/85 to-orange-500/35"
            : "bg-linear-to-t from-navy-950 via-navy-950/80 to-navy-950/35",
        )}
      />
      {CORNERS.map((c) => (
        <span
          key={c}
          aria-hidden="true"
          className={cn(
            "absolute size-6 transition-colors duration-500",
            orange
              ? "border-white/50 group-hover:border-white"
              : "border-white/40 group-hover:border-orange-500",
            c,
          )}
        />
      ))}

      <div className="flex items-center justify-between gap-4 text-xs font-semibold tracking-eyebrow uppercase">
        <span className="flex items-center gap-3">
          <span className={cn("h-0.5 w-6", orange ? "bg-white" : "bg-orange-500")} />
          {item.title}
        </span>
        <span className="text-white/60">
          {pad(index + 1)} - {item.en}
        </span>
      </div>

      <div>
        <p className="max-w-lg text-left text-[1.4rem] leading-[1.3] font-bold tracking-tight text-balance sm:text-[1.75rem]">
          {item.text}
        </p>
      </div>
    </article>
  );
}

/* ── Chuẩn mực sản xuất — cùng style khối "Quy trình sản xuất" ở trang chủ:
   cột trái ghim (sticky) khi cuộn, cột phải là danh sách có số lớn mờ (rê chuột → số chuyển cam). ── */
function Standards() {
  return (
    <section className="bg-paper section-y" data-nav-theme="light">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <p className="reveal mb-4 eyebrow">Chuẩn mực sản xuất</p>
            <h2 className="reveal h-section" style={{ "--reveal-delay": "80ms" }}>
              Trần Duy Media cam kết <span className="text-orange-500">chuẩn mực sản xuất.</span>
            </h2>
            <p
              className="reveal mt-5 max-w-md text-base leading-relaxed text-ink-soft sm:text-lg"
              style={{ "--reveal-delay": "160ms" }}
            >
              Năm nguyên tắc chúng tôi giữ vững trong từng{" "}
              <span className="whitespace-nowrap">dự án,</span> với từng{" "}
              <span className="whitespace-nowrap">khách hàng.</span>
            </p>
            <div className="reveal mt-8" style={{ "--reveal-delay": "240ms" }}>
              <Button pill data-booking>
                Đặt lịch tư vấn
              </Button>
            </div>
          </div>

          <ol className="divide-y divide-ink/10 border-y border-ink/10">
            {productionStandards.map((v, i) => (
              <li
                key={v.title}
                className="reveal group grid grid-cols-[3.5rem_1fr] gap-4 py-5 sm:grid-cols-[5rem_1fr] sm:gap-8 sm:py-6"
                style={{ "--reveal-delay": `${(i % 2) * 80}ms` }}
              >
                <span className="text-3xl h-display text-paper-200 transition-colors duration-500 group-hover:text-orange-500 sm:text-5xl">
                  {pad(i + 1)}
                </span>
                <div>
                  <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">{v.title}</h3>
                  <p className="mt-2 max-w-lg leading-relaxed text-ink-soft">{v.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}

/* ── Hệ sinh thái dịch vụ cốt lõi — nền tối như bản gốc; tiêu đề + danh sách 6 mảng,
   ảnh từng mảng LƯỚT NGANG VÔ HẠN (cùng kiểu khối Hậu trường): desktop vừa 3 thẻ, tablet 2, điện thoại 1 + hé thẻ sau. ── */
function Ecosystem() {
  return (
    <section
      className="grain relative overflow-hidden bg-navy-950 section-y text-white"
      data-nav-theme="dark"
    >
      <Container className="relative">
        {/* Tiêu đề trái · khẩu hiệu + 2 nút phải (cùng kiểu khối "Hệ sinh thái dịch vụ trọng tâm" ở trang chủ);
            tên 6 mảng đã có trên từng thẻ bên dưới nên không lặp lại danh sách */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
          <SectionHeading
            light
            eyebrow="Hệ sinh thái dịch vụ cốt lõi"
            title={
              <>
                <span className="whitespace-nowrap">Gia công</span>{" "}
                <span className="whitespace-nowrap">nội dung</span>
                <br className="max-sm:hidden" />{" "}
                <span className="whitespace-nowrap">thương mại</span>{" "}
                <span className="whitespace-nowrap">quảng cáo</span>{" "}
                <span className="whitespace-nowrap text-orange-500">trọn gói.</span>
              </>
            }
          />
          <div
            className="reveal flex w-fit shrink-0 flex-col items-center"
            style={{ "--reveal-delay": "160ms" }}
          >
            <p className="flex items-center gap-3 text-base font-bold tracking-[0.16em] whitespace-nowrap text-white uppercase sm:text-xl sm:tracking-[0.22em]">
              <span className="h-0.5 w-8 bg-orange-500" aria-hidden="true" />6 dịch vụ - 1 ekip
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button pill variant="white" data-booking>
                Đặt lịch tư vấn
              </Button>
              <Button href="/dich-vu" variant="light">
                Xem dịch vụ
              </Button>
            </div>
          </div>
        </div>

        <div className="reveal mt-12 sm:mt-14">
          <LoopCarousel
            label="Hệ sinh thái dịch vụ"
            // Điện thoại: 1 thẻ vừa khít khung (luôn nằm giữa); tablet 2 thẻ; máy tính 3 thẻ
            itemClassName="w-[100cqw] sm:w-[calc((100cqw-1rem)/2)] lg:w-[calc((100cqw-2.5rem)/3)]"
          >
            {ecosystem.map((e, i) => (
              <Link key={e.name} href={e.href} draggable={false} className="group block">
                <div className="relative aspect-4/5 overflow-hidden rounded-2xl bg-navy-900 ring-1 ring-white/10">
                  <Image
                    src={e.src}
                    alt={e.name}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 82vw"
                    draggable={false}
                    className="pointer-events-none object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-105"
                    style={{ objectPosition: e.pos }}
                  />
                  {/* Phủ tối đậm ở nửa dưới → tên dịch vụ luôn nổi rõ trên mọi ảnh */}
                  <div className="absolute inset-0 bg-linear-to-t from-navy-950 via-navy-950/70 via-35% to-transparent to-65%" />
                  <span className="absolute top-4 left-4 flex size-10 items-center justify-center rounded-full bg-orange-500 text-[13px] font-bold tracking-wide text-white shadow-[0_8px_20px_-8px_rgba(248,104,8,0.9)]">
                    {pad(i + 1)}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                    <span
                      aria-hidden="true"
                      className="block h-1 w-10 rounded-full bg-orange-500 transition-[width] duration-500 group-hover:w-16"
                    />
                    {/* Tên luôn chiếm đúng 2 dòng; tên 1 dòng canh giữa chiều cao 2 dòng, mô tả đúng 2 dòng → tiêu đề & mô tả các thẻ thẳng hàng nhau */}
                    <h3 className="mt-3 flex min-h-[2.5em] items-center text-[1.4rem] leading-[1.25] font-bold tracking-tight text-balance text-white text-legible sm:text-2xl">
                      {e.name}
                    </h3>
                    <p className="mt-2 line-clamp-2 min-h-[3.25em] text-left text-sm leading-relaxed text-white/80">
                      {e.desc}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </LoopCarousel>
        </div>
      </Container>
    </section>
  );
}
