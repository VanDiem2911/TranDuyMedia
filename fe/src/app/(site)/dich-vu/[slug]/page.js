import { Suspense } from "react";
import { SmartImage as Image } from "@/components/ui/SmartImage";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { BentoGallery } from "@/components/gallery";
import {
  ClipGrid,
  Journey,
  Pricing,
  ServiceFeatures,
  ServiceOverview,
  ServiceVideoHero,
  ServiceWorks,
  StudioRooms,
} from "@/components/services";
import { Button, Container } from "@/components/ui";
import { BehindScenes, PageHeader, Partners, Values } from "@/components/sections";
import { siteConfig } from "@/config/site";
import { getService, services } from "@/data/services";
import { applyServiceDetail } from "@/data/service-detail-content";
import { createMetadata } from "@/lib/metadata";
import { siteView } from "@/data/site-content";
import { getAbout } from "@/lib/about";
import { getHome } from "@/lib/home";
import { getServiceDetail } from "@/lib/service-detail";
import { getServicesPage } from "@/lib/services";
import { getSiteContent } from "@/lib/site";
import { cn } from "@/lib/utils";

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const s = getService(slug);
  if (!s) return {};
  return createMetadata({
    title: `${s.title} | Dịch vụ`,
    description: s.description,
    path: `/dich-vu/${s.slug}`,
    image: s.image,
  });
}

/** 6 cột × 3 ảnh cho nền đầu trang, lấy vòng từ bộ ảnh của dịch vụ */
const headerColumns = (raw) => {
  const pool = raw.map((p) => (typeof p === "string" ? p : p.src));
  return Array.from({ length: 6 }, (_, i) => [0, 1, 2].map((k) => pool[(i * 3 + k) % pool.length]));
};

/**
 * Trang dịch vụ con — bố cục theo feedback 02/11, mọi nội dung lấy từ data/services.js.
 * Dịch vụ a–d (8 phần): Clip showreel (làm nền đầu trang) · Giới thiệu dịch vụ (*) · 3 thế mạnh · Sản phẩm thực tế (*)
 *   · Đối tác khách hàng · Quy trình · Báo giá (*) · Hậu trường (BTS).
 * Cho thuê studio (6 phần): Giới thiệu · 4 điểm nổi bật · Không gian Room 1 / Room 2 · Bảng giá · BTS
 *   · Link bảng giá chi tiết & ảnh các room.
 * (*) viết riêng theo từng dịch vụ, còn lại dùng chung. Cuối trang: dịch vụ khác.
 * Không await params ở cấp cao nhất (Next 16 + Cache Components): phần đọc URL nằm trong <Suspense>.
 */
export default function ServicePage({ params }) {
  return (
    <Suspense fallback={<ServiceSkeleton />}>
      <ServiceView params={params} />
    </Suspense>
  );
}

async function ServiceView({ params }) {
  const { slug } = await params;
  const base = getService(slug);
  if (!base) notFound();
  // Nội dung chỉnh ở trang quản trị (DB) gộp lên dữ liệu gốc — cache theo thẻ, lưu xong là cập nhật ngay
  // Các khối dùng chung (3 thế mạnh, đối tác, hành trình, hậu trường) lấy nội dung chỉnh ở Về chúng tôi / Trang chủ / Dịch vụ
  const [detail, about, home, list, site] = await Promise.all([
    getServiceDetail(),
    getAbout(),
    getHome(),
    getServicesPage(),
    getSiteContent(),
  ]);
  const view = siteView(site);
  const strengths = about.values.items.map((v) => ({
    title: v.title,
    desc: v.desc,
    image: v.image.src,
    imagePos: v.image.pos,
  }));
  const s = applyServiceDetail(
    base,
    detail.items.find((d) => d.slug === slug),
  );

  const others = services.filter((x) => x.slug !== slug);
  const studio = s.kind === "studio";

  return (
    <>
      {/* Đầu trang: cho thuê studio giữ nền cột ảnh trôi; 4 dịch vụ sản xuất dùng showreel làm nền (mục 1) */}
      {studio ? (
        <PageHeader
          title={s.title}
          description={s.heroDesc}
          eyebrow={false}
          crumbs={[{ label: "Dịch vụ", href: "/dich-vu" }]}
          columns={headerColumns(s.pool)}
        />
      ) : (
        <ServiceVideoHero
          title={s.title}
          description={s.heroDesc}
          eyebrow={`Dịch vụ ${s.number} / 0${services.length}`}
          slug={s.slug}
          segments={s.heroClip}
          // Khung hình đầu đoạn video của dịch vụ (public/media/hero/<slug>.webp — cắt từ showreel)
          poster={s.heroClip?.length ? `/media/hero/${s.slug}.webp` : undefined}
          // Đoạn video riêng của dịch vụ (cắt sẵn từ showreel theo heroClip, 1080p + 720p, phát lặp)
          clip={
            s.heroClip?.length
              ? { hd: `/media/hero/${s.slug}-hd.mp4`, sd: `/media/hero/${s.slug}-sd.mp4` }
              : undefined
          }
        />
      )}

      {studio ? (
        <>
          {/* Giới thiệu + 4 điểm nổi bật: cùng nền, liền mạch như một khối */}
          <ServiceOverview s={s} className="bg-paper" flush />
          <ServiceFeatures s={s} />
          <StudioRooms rooms={s.rooms} slug={s.slug} />
          <Pricing
            slug={s.slug}
            plans={s.pricing.plans}
            title={s.pricingTitle}
            className="bg-white"
            note={s.pricingNote}
          />
          <BehindScenes id="hau-truong-studio" content={home.bts} />
          <StudioLinks s={s} contact={view.contact} />
        </>
      ) : (
        <>
          {/* 2 — Giới thiệu dịch vụ (riêng) */}
          <ServiceOverview s={s} className="bg-white" />
          {/* 3 — 3 thế mạnh (dùng chung) */}
          <Values
            eyebrow="3 thế mạnh của Trần Duy Media"
            titleLead={about.values.titleLead}
            titleAccent={about.values.titleAccent}
            items={strengths}
          />
          {/* 4 — Sản phẩm thực tế (riêng) */}
          <ServiceWorks s={s} />
          {/* 5 — Đối tác khách hàng (dùng chung) */}
          <Partners content={home.partners} />
          {/* 6 — Quy trình làm việc (dùng chung) */}
          <Journey content={list.journey} />
          {/* 7 — Báo giá (riêng) */}
          <Pricing
            slug={s.slug}
            plans={s.pricing.plans}
            title={s.pricingTitle}
            note={s.pricingNote}
          />
          {/* 8 — Hậu trường (dùng chung) */}
          <BehindScenes id="hau-truong-dich-vu" content={home.bts} />
        </>
      )}

      {/* Dịch vụ khác */}
      <section className="bg-white section-y" data-nav-theme="light">
        <Container>
          <div className="mb-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
            <h2 className="reveal text-3xl h-display whitespace-nowrap sm:text-4xl">
              Dịch vụ khác
            </h2>
            <Link
              href="/dich-vu"
              className="reveal group inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap hover:text-orange-500"
            >
              Tổng quan dịch vụ
              <Icon
                name="arrowRight"
                className="size-4 transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
          {/* 4 dịch vụ còn lại: 2 cột (md) → 4 cột (xl) */}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {others.map((o, i) => (
              <Link
                key={o.slug}
                href={`/dich-vu/${o.slug}`}
                className="reveal group relative block aspect-4/3 overflow-hidden rounded-3xl bg-navy-900 text-white sm:aspect-4/5"
                style={{ "--reveal-delay": `${i * 90}ms` }}
              >
                <Image
                  src={o.image}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-105"
                  style={{ objectPosition: o.imagePos }}
                />
                <div className="absolute inset-0 bg-linear-to-t from-navy-950/90 via-navy-950/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6">
                  <div>
                    <p className="text-[11px] tracking-eyebrow text-white/60 uppercase">
                      Dịch vụ {o.number}
                    </p>
                    <h3 className="mt-1 text-xl leading-snug font-bold tracking-tight text-balance sm:text-[1.4rem]">
                      {o.title}
                    </h3>
                  </div>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-navy-900 transition-all duration-300 group-hover:bg-orange-500 group-hover:text-white">
                    <Icon name="arrowRight" className="size-5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}

/* ── Cho thuê studio: "VÉ ĐẶT LỊCH" (mục 6: link bảng giá chi tiết & hình ảnh các room)
   Cuống vé cam: tiêu đề + cam kết (trên) · nút bảng giá chi tiết + hotline (dưới)  |  nét đứt  |
   Thân vé: 2 thẻ room cao bằng cuống — ảnh lớn (bấm → thư mục ảnh room), diện tích, loại phòng,
   2 nút "Đặt lịch" (điền sẵn room vào form) / "Xem ảnh". ── */
function StudioLinks({ s, contact }) {
  const priceBtn =
    "group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-orange-600 transition hover:bg-navy-950 hover:text-white";
  return (
    <section
      className="bg-paper py-16 sm:py-20"
      data-nav-theme="light"
      aria-label="Đặt lịch studio"
    >
      <Container>
        <div className="reveal relative grid overflow-clip rounded-[2rem] bg-white shadow-[0_30px_70px_-40px_rgba(11,18,32,0.35)] lg:grid-cols-[0.85fr_1.4fr]">
          {/* Cuống vé */}
          <div className="relative isolate flex flex-col overflow-clip bg-orange-500 p-8 text-white sm:p-10 lg:p-12">
            <Icon
              name="calendar"
              className="absolute -right-12 -bottom-12 -z-10 size-60 text-white/10"
              strokeWidth={1}
            />
            <p className="text-[11px] font-semibold tracking-eyebrow text-white/80 uppercase">
              Bảng giá chi tiết
            </p>
            <h2 className="mt-3 text-[1.9rem] h-display text-balance sm:text-[2.3rem]">
              Chọn room, nhận báo giá trong 24 giờ.
            </h2>
            <ul className="mt-6 space-y-2.5 text-[15px] text-white/90">
              {[
                "Giá theo khung giờ, minh bạch",
                "Đã gồm đèn, phông nền, đạo cụ",
                "Xác nhận lịch ngay trong ngày",
              ].map((x) => (
                <li key={x} className="flex items-center gap-2.5">
                  <Icon name="check" className="size-4 shrink-0" strokeWidth={2.5} />
                  {x}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap gap-3 lg:mt-auto lg:pt-10">
              {siteConfig.studioPriceList ? (
                <a
                  href={siteConfig.studioPriceList}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={priceBtn}
                >
                  <Icon name="note" className="size-4" />
                  Bảng giá chi tiết
                </a>
              ) : (
                <button
                  type="button"
                  data-booking={s.slug}
                  data-booking-note="Gửi giúp tôi bảng giá chi tiết thuê studio (Room 1 & Room 2)."
                  className={priceBtn}
                >
                  <Icon name="note" className="size-4" />
                  Nhận bảng giá chi tiết
                </button>
              )}
              <a
                href={contact.phoneHref}
                className="inline-flex h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold tracking-wide ring-1 ring-white/40 transition hover:bg-white/15"
              >
                <Icon name="phone" className="size-4" />
                {contact.phone}
              </a>
            </div>
          </div>

          {/* Đường nét đứt nhạt giữa cuống vé và thân vé (máy tính) */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-8 left-[calc(0.85/2.25*100%)] hidden border-l-2 border-dashed border-ink/10 lg:block"
          />

          {/* Thân vé: 2 room */}
          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:gap-5 sm:p-8 lg:p-10 lg:pl-12">
            {s.rooms.map((r) => (
              <article
                key={r.name}
                className="group flex flex-col overflow-clip rounded-2xl bg-paper ring-1 ring-ink/5 transition duration-500 hover:-translate-y-1 hover:shadow-soft"
              >
                <a
                  href={r.folder}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Xem hình ảnh ${r.name} (${r.size})`}
                  className="relative block aspect-4/3 overflow-clip lg:aspect-auto lg:min-h-[220px] lg:flex-1"
                >
                  <Image
                    src={r.images[0]}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 26vw, (min-width: 640px) 45vw, 90vw"
                    className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold tracking-widest text-ink uppercase">
                    {r.name}
                  </span>
                </a>
                <div className="p-5 sm:p-6">
                  <p className="text-4xl h-display text-orange-500">{r.size}</p>
                  <p className="mt-1 text-sm font-medium text-ink-soft">{r.label}</p>
                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      data-booking={s.slug}
                      data-booking-note={`Thuê ${r.name} (${r.size}) - ${r.label}`}
                      className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-navy-900 px-4 text-[13px] font-semibold text-white transition hover:bg-orange-500"
                    >
                      Đặt lịch
                      <Icon name="arrowRight" className="size-4" />
                    </button>
                    <a
                      href={r.folder}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-4 text-[13px] font-semibold text-ink ring-1 ring-ink/15 transition hover:bg-white"
                    >
                      <Icon name="image" className="size-4" />
                      Xem ảnh
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

/** Khung chờ cùng chiều cao đầu trang → không giật layout khi nội dung đổ vào. */
// Khung chờ cao ít nhất 1 màn hình (đầu trang + vùng nền sáng): HTML dựng sẵn gửi khung chờ trước rồi mới
// thay bằng nội dung — khung thấp thì chân trang lọt vào màn hình rồi bị đẩy xuống (CLS, LCP nhầm ảnh chân trang).
function ServiceSkeleton() {
  return (
    <>
      <section
        className="relative flex min-h-[max(460px,calc(var(--screen)*0.66))] items-end bg-navy-950 pt-32 pb-16 text-white"
        data-nav-theme="dark"
        aria-busy="true"
      >
        <Container className="space-y-5">
          <div className="h-3 w-56 rounded-full bg-white/10" />
          <div className="h-16 w-3/4 animate-pulse rounded-xl bg-white/10" />
          <div className="h-5 w-1/2 rounded-full bg-white/5" />
        </Container>
      </section>
      <div aria-hidden="true" className="h-svh bg-paper" />
    </>
  );
}
