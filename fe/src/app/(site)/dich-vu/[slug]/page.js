import { Suspense } from "react";
import { SmartImage as Image } from "@/components/ui/SmartImage";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { BentoGallery } from "@/components/gallery";
import { ClipGrid, Journey, Pricing, ServiceVideoHero, StudioRooms } from "@/components/services";
import { Button, Container } from "@/components/ui";
import { BehindScenes, PageHeader, Partners, Values } from "@/components/sections";
import { siteConfig } from "@/config/site";
import { getService, services } from "@/data/services";
import { createMetadata } from "@/lib/metadata";
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
  const s = getService(slug);
  if (!s) notFound();

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
        />
      )}

      {studio ? (
        <>
          {/* Giới thiệu + 4 điểm nổi bật: cùng nền, liền mạch như một khối */}
          <Overview s={s} className="bg-paper" flush />
          <Features s={s} />
          <StudioRooms rooms={s.rooms} slug={s.slug} />
          <Pricing
            slug={s.slug}
            plans={s.pricing.plans}
            title="Bảng giá thuê studio."
            className="bg-white"
            note="Tính theo giờ và theo room, tối thiểu 2 giờ — đã gồm đèn, phông nền, đạo cụ sẵn có. Xác nhận lịch và gửi bảng giá chi tiết trong ngày."
          />
          <BehindScenes id="hau-truong-studio" />
          <StudioLinks s={s} />
        </>
      ) : (
        <>
          {/* 2 — Giới thiệu dịch vụ (riêng) */}
          <Overview s={s} className="bg-white" />
          {/* 3 — 3 thế mạnh (dùng chung) */}
          <Values eyebrow="3 thế mạnh của Trần Duy Media" />
          {/* 4 — Sản phẩm thực tế (riêng) */}
          <Works s={s} />
          {/* 5 — Đối tác khách hàng (dùng chung) */}
          <Partners />
          {/* 6 — Quy trình làm việc (dùng chung) */}
          <Journey />
          {/* 7 — Báo giá (riêng) */}
          <Pricing
            slug={s.slug}
            plans={s.pricing.plans}
            // Chỉ viết thường CHỮ ĐẦU (đứng sau "Báo giá") — giữ nguyên chữ hoa có chủ đích: "iTVC, Viral"
            title={`Báo giá ${s.title.charAt(0).toLowerCase()}${s.title.slice(1)}.`}
          />
          {/* 8 — Hậu trường (dùng chung) */}
          <BehindScenes id="hau-truong-dich-vu" />
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

/** Tiêu đề có vế nhấn màu cam; giữ liền các cụm từ ghép (không tách 2 dòng). */
const KEEP = [
  "Sản xuất",
  "video short",
  "doanh nghiệp,",
  "sự kiện.",
  "Chụp ảnh",
  "quảng cáo.",
  "Cho thuê",
  "bối cảnh.",
];
function Accent({ text, accent }) {
  const i = accent ? text.indexOf(accent) : -1;
  const keep = (str) => {
    // Bọc các cụm từ ghép bằng span không ngắt dòng
    const parts = [];
    let rest = str;
    while (rest) {
      let hit = null;
      for (const k of KEEP) {
        const j = rest.indexOf(k);
        if (j >= 0 && (!hit || j < hit.j)) hit = { j, k };
      }
      if (!hit) {
        parts.push(rest);
        break;
      }
      if (hit.j) parts.push(rest.slice(0, hit.j));
      parts.push(
        <span key={parts.length} className="whitespace-nowrap">
          {hit.k}
        </span>,
      );
      rest = rest.slice(hit.j + hit.k.length);
    }
    return parts;
  };
  if (i < 0) return keep(text);
  return (
    <>
      {keep(text.slice(0, i))}
      <span className="text-orange-500">{keep(accent)}</span>
    </>
  );
}

/* ── Giới thiệu dịch vụ: tiêu đề nêu tên dịch vụ + mô tả + 3 số liệu | cụm 3 ảnh ── */
// flush: bỏ khoảng đệm dưới để nối liền khối ngay sau (trang Cho thuê studio)
function Overview({ s, className, flush = false }) {
  return (
    <section
      className={cn(flush ? "pt-16 pb-14 sm:pt-20 sm:pb-16 lg:pt-24" : "section-y", className)}
      data-nav-theme="light"
    >
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="reveal mb-4 eyebrow">Giới thiệu dịch vụ</p>
            <h2 className="reveal h-section text-balance" style={{ "--reveal-delay": "80ms" }}>
              <Accent text={s.headline} accent={s.accent} />
            </h2>
            <p
              className="reveal mt-5 text-base leading-relaxed text-ink-soft sm:text-lg"
              style={{ "--reveal-delay": "160ms" }}
            >
              {s.description}
            </p>
            <dl
              className="reveal mt-8 grid max-w-lg grid-cols-3 gap-6 border-y border-ink/10 py-6"
              style={{ "--reveal-delay": "200ms" }}
            >
              {s.highlights.map((h) => (
                <div key={h.label} className="@container min-w-0">
                  {/* Cỡ chữ theo bề rộng cột (container query) → giá trị dài vẫn 1 dòng, không tràn */}
                  <dd className="text-[clamp(0.9rem,16.5cqi,1.875rem)] h-display whitespace-nowrap text-navy-900">
                    {h.value}
                  </dd>
                  <dt className="mt-1 text-xs text-ink-muted">{h.label}</dt>
                </div>
              ))}
            </dl>
            <div
              className="reveal btn-row mt-8 flex flex-wrap gap-3"
              style={{ "--reveal-delay": "260ms" }}
            >
              <Button pill data-booking={s.slug}>
                Liên hệ tư vấn
              </Button>
              <Button href="#bao-gia" variant="outline">
                Xem báo giá
              </Button>
            </div>
          </div>

          {/* Cụm ảnh: 1 ảnh cao + 2 ảnh */}
          <div className="relative grid h-[420px] grid-cols-[1.15fr_1fr] grid-rows-2 gap-4 sm:h-[520px]">
            {[0, 1, 2].map((k) => {
              // phần tử pool: đường dẫn ảnh, hoặc { src, pos } khi cần vị trí cắt riêng
              const p = s.pool[k];
              const src = typeof p === "string" ? p : p.src;
              return (
                <div
                  key={src}
                  className={cn(
                    "reveal relative overflow-hidden rounded-3xl bg-paper-200 shadow-card",
                    k === 0 && "row-span-2 shadow-soft",
                  )}
                  data-reveal="scale"
                  style={{ "--reveal-delay": `${k * 120}ms` }}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover transition-transform duration-[1400ms] hover:scale-105"
                    style={{ objectPosition: typeof p === "string" ? "center" : p.pos }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ── Sản phẩm thực tế: clip (Drive) và/hoặc ảnh dự án theo từng dịch vụ ── */
function Works({ s }) {
  const { works } = s;
  return (
    <section id="san-pham-thuc-te" className="bg-white section-y" data-nav-theme="light">
      <Container>
        <p className="reveal mb-4 eyebrow">Sản phẩm thực tế</p>
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="reveal h-section" style={{ "--reveal-delay": "80ms" }}>
            {works.title}
          </h2>
          <Link
            href="/san-pham"
            className="reveal group inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap hover:text-orange-500"
          >
            Xem tất cả sản phẩm
            <Icon
              name="arrowRight"
              className="size-4 transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
        {works.clips?.length > 0 && <ClipGrid clips={works.clips} />}
        {works.photos?.length > 0 && (
          <div className={cn(works.clips?.length && "mt-12")}>
            <BentoGallery images={works.photos} name={s.title} />
          </div>
        )}
      </Container>
    </section>
  );
}

/* ── Cho thuê studio: 4 điểm nổi bật — nối liền phần giới thiệu phía trên (cùng nền giấy, chỉ ngăn bằng
   1 đường kẻ mảnh), không tiêu đề: 4 cột canh giữa, icon nét lớn + tiêu đề + mô tả. Rê chuột: icon chuyển cam. ── */
function Features({ s }) {
  return (
    <section
      className="bg-paper pb-16 sm:pb-20 lg:pb-24"
      data-nav-theme="light"
      aria-label="Điểm nổi bật"
    >
      <Container>
        <ul className="grid gap-12 border-t border-ink/10 pt-14 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-4 lg:gap-x-12 lg:pt-16">
          {s.features.map((f, i) => (
            <li
              key={f.title}
              className="reveal group flex flex-col items-center text-center"
              style={{ "--reveal-delay": `${i * 90}ms` }}
            >
              <Icon
                name={f.icon}
                className="size-14 text-ink transition-[color,transform] duration-500 group-hover:-translate-y-1 group-hover:text-orange-500"
                strokeWidth={1.3}
              />
              <h3 className="mt-6 text-xl font-bold tracking-tight text-ink sm:text-[1.35rem]">
                {f.title}
              </h3>
              <p className="mt-3 max-w-xs text-center text-[15px] leading-relaxed text-ink-soft">
                {f.desc}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ── Cho thuê studio: "VÉ ĐẶT LỊCH" (mục 6: link bảng giá chi tiết & hình ảnh các room)
   Cuống vé cam: tiêu đề + cam kết (trên) · nút bảng giá chi tiết + hotline (dưới)  |  nét đứt  |
   Thân vé: 2 thẻ room cao bằng cuống — ảnh lớn (bấm → thư mục ảnh room), diện tích, loại phòng,
   2 nút "Đặt lịch" (điền sẵn room vào form) / "Xem ảnh". ── */
function StudioLinks({ s }) {
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
                href={siteConfig.contact.phoneHref}
                className="inline-flex h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold tracking-wide ring-1 ring-white/40 transition hover:bg-white/15"
              >
                <Icon name="phone" className="size-4" />
                {siteConfig.contact.phone}
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
