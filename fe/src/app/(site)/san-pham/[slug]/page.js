import { Suspense } from "react";
import { SmartImage as Image } from "@/components/ui/SmartImage";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { AlbumGallery, ProductCard, ProductVideos } from "@/components/gallery";
import { Container } from "@/components/ui";
import { PageHeader } from "@/components/sections";
import { coverSizes, zoomStyle } from "@/lib/crop";
import { getProduct, getProducts, relatedProducts } from "@/lib/products";
import { createMetadata } from "@/lib/metadata";

/** 6 cột × 3 ảnh cho nền đầu trang, lấy vòng từ hình ảnh của sản phẩm */
const headerColumns = (srcs, fallback) => {
  const pool = srcs.length ? srcs : [fallback]; // chỉ có video chưa có ảnh đại diện → dùng ảnh bìa
  return Array.from({ length: 6 }, (_, i) => [0, 1, 2].map((k) => pool[(i * 3 + k) % pool.length]));
};

export async function generateStaticParams() {
  const products = await getProducts();
  // Cache Components yêu cầu ít nhất 1 tham số; backend chưa chạy lúc build → dựng theo yêu cầu
  return products.length ? products.map((p) => ({ slug: p.slug })) : [{ slug: "__none" }];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) return {};
  return createMetadata({
    title: `${p.title} | Sản phẩm`,
    description: p.description,
    path: `/san-pham/${p.slug}`,
    image: p.cover.src,
  });
}

/**
 * Trang KHÔNG await params ở cấp cao nhất (Next 16 + Cache Components): phần đọc URL nằm trong
 * <Suspense> → khung trang dựng sẵn và hiện NGAY khi chuyển trang, nội dung đổ vào sau.
 */
export default function ProductPage({ params }) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductView params={params} />
    </Suspense>
  );
}

async function ProductView({ params }) {
  const { slug } = await params;
  const [p, products] = await Promise.all([getProduct(slug), getProducts()]);
  if (!p) notFound();

  // Đề xuất tự động theo mức liên quan (cùng danh mục / loại / bối cảnh / từ khoá) — xem lib/products.js
  const others = relatedProducts(p, products, 3);
  const info = [
    { label: "Thể loại", value: p.category },
    { label: "Bối cảnh", value: p.setName || "—" },
    { label: "Ứng dụng", value: p.usage || "—" },
    { label: "Bàn giao", value: `${p.count} đã hậu kỳ` },
  ];

  return (
    <>
      {p.videoOnly ? (
        <VideoHeader p={p} />
      ) : (
        <PageHeader
          title={p.title}
          eyebrow={`${p.category} - ${p.count}`}
          description={p.summary}
          crumbs={[{ label: "Sản phẩm", href: "/san-pham" }]}
          columns={headerColumns(p.images.map((im) => im.src).filter(Boolean), p.cover.src)}
        />
      )}

      {/* Tổng quan: mô tả + thông tin dự án (trái) | 3 ảnh tiêu biểu so le (phải) */}
      <section className="bg-white section-y" data-nav-theme="light">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 xl:gap-20">
            <div>
              <p className="reveal mb-4 eyebrow">Về sản phẩm</p>
              <h2 className="reveal h-section" style={{ "--reveal-delay": "80ms" }}>
                {p.summary}
              </h2>
              <p
                className={`reveal mt-5 text-base leading-relaxed text-ink-soft sm:text-lg`}
                style={{ "--reveal-delay": "160ms" }}
              >
                {p.description}
              </p>
              <dl
                className={`reveal mt-8 grid gap-x-10 border-t border-ink/10 sm:grid-cols-2`}
                style={{ "--reveal-delay": "220ms" }}
              >
                {info.map((f) => (
                  <div key={f.label} className="border-b border-ink/10 py-4">
                    <dt className="text-[11px] font-semibold tracking-eyebrow text-ink-muted uppercase">
                      {f.label}
                    </dt>
                    <dd className="mt-1.5 font-semibold text-ink">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {p.videoOnly && <VideoFeature p={p} />}
            {!p.videoOnly && (
              <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
                {p.covers.map((img, i) => (
                  <div
                    key={img.src}
                    className={`reveal relative aspect-[3/4.2] overflow-hidden rounded-2xl bg-paper-200 shadow-card ${i === 1 ? "-translate-y-6 sm:-translate-y-10" : ""}`}
                    data-reveal="scale"
                    style={{ "--reveal-delay": `${i * 120}ms` }}
                  >
                    <span className="absolute inset-0" style={zoomStyle(img)}>
                      <Image
                        src={img.src}
                        alt=""
                        fill
                        sizes={coverSizes("(min-width: 1024px) 19vw, 33vw", img, 3 / 4.2)}
                        ratio={img.width && img.height ? img.width / img.height : undefined}
                        className="object-cover"
                        style={{ objectPosition: img.pos }}
                      />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Container>
      </section>

      <section className="bg-paper section-y" data-nav-theme="light">
        <Container>
          <div className="mb-8 flex flex-col gap-2 sm:mb-10 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <h2 className="reveal text-3xl h-display sm:text-4xl">
              {p.videoOnly ? "Video sản phẩm" : "Thư viện sản phẩm"}
            </h2>
            <p className="reveal text-left text-sm text-ink-muted">
              {p.videoOnly ? "Bấm để phát video" : "Bấm để xem lớn"}
            </p>
          </div>
          {p.videoOnly ? (
            <ProductVideos images={p.images} name={p.title} />
          ) : (
            <AlbumGallery images={p.images} name={p.title} />
          )}
        </Container>
      </section>

      {others.length > 0 && (
        <section className="bg-white section-y" data-nav-theme="light">
          <Container>
            <div className="mb-10 flex items-center justify-between gap-6">
              <h2 className="reveal text-3xl h-display sm:text-4xl">Sản phẩm khác</h2>
              <Link
                href="/san-pham"
                className="reveal group inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap hover:text-orange-500"
              >
                Xem tất cả
                <Icon
                  name="arrowRight"
                  className="size-4 transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              {others.map((o, i) => (
                <ProductCard key={o.slug} product={o} index={i} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}

/** Khung chờ: cùng bố cục & màu với trang thật → không giật layout khi nội dung đổ vào. */
function ProductSkeleton() {
  return (
    <>
      <section
        className="relative flex min-h-[max(460px,calc(var(--screen)*0.66))] items-center bg-navy-950 pt-[calc(84px+2rem)] pb-24 text-white"
        data-nav-theme="dark"
        aria-busy="true"
      >
        <Container className="space-y-5">
          <div className="h-3 w-40 rounded-full bg-white/10" />
          <div className="h-3 w-56 rounded-full bg-orange-500/30" />
          <div className="h-14 w-2/3 animate-pulse rounded-xl bg-white/10" />
          <div className="h-4 w-1/2 rounded-full bg-white/5" />
        </Container>
      </section>
      <section className="bg-paper section-y" data-nav-theme="light">
        <Container>
          <div className="flex flex-wrap justify-center gap-3 lg:gap-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="aspect-4/5 w-[calc((100%-0.75rem)/2)] animate-pulse rounded-xl bg-paper-200 md:w-[calc((100%-1.5rem)/3)] lg:w-[calc((100%-2rem)/3)]"
              />
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}

/**
 * Đầu trang của sản phẩm CHỈ CÓ VIDEO: khung hình video (ảnh bìa) làm nền lớn, phóng chậm (ken burns), phủ tối
 * bên trái để chữ rõ; nút "Xem video" mở popup phát video đầu tiên có tiếng.
 */
function VideoHeader({ p }) {
  const first = p.images.find((m) => m.type !== "image");
  const vertical = first?.width && first?.height && first.height > first.width;
  return (
    <section
      className="grain relative isolate flex min-h-[max(520px,calc(var(--screen)*0.78))] items-end overflow-hidden bg-navy-950 pt-[calc(84px+3rem)] pb-14 text-white sm:pb-20"
      data-nav-theme="dark"
    >
      {p.cover?.src && (
        // Ảnh bìa trích từ video gốc độ phân giải cao (≤ 2560px) → phủ kín vẫn nét. Video dọc: không phóng
        // ken burns (tránh phóng thêm ảnh đã cắt), giữ khuôn mặt ở 1/3 trên khung
        <div className={`absolute inset-0 -z-20 ${vertical ? "" : "animate-kenburns"}`}>
          <Image
            src={p.cover.src}
            alt=""
            fill
            preload
            quality={90}
            sizes="100vw"
            className="object-cover"
            style={{
              objectPosition:
                p.cover.pos && p.cover.pos !== "center"
                  ? p.cover.pos
                  : vertical
                    ? "center 32%"
                    : "center",
            }}
          />
        </div>
      )}
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-navy-950/90 via-navy-950/55 to-navy-950/10" />
      <div className="absolute inset-0 -z-10 bg-linear-to-t from-navy-950 via-transparent to-navy-950/50" />

      <Container
        className={vertical ? "grid items-end gap-10 lg:grid-cols-[1fr_auto] lg:gap-16" : undefined}
      >
        <div>
          <nav aria-label="Breadcrumb" className="text-sm text-white/75 text-legible">
            <ol className="flex flex-wrap items-center gap-2.5">
              <li>
                <Link href="/" className="transition-colors hover:text-white">
                  Trang chủ
                </Link>
              </li>
              <li className="flex items-center gap-2.5">
                <span aria-hidden="true" className="text-white/40">
                  /
                </span>
                <Link href="/san-pham" className="transition-colors hover:text-white">
                  Sản phẩm
                </Link>
              </li>
            </ol>
          </nav>
          <p className="mt-6 [animation:fadeUp_1s_.1s_both] eyebrow text-legible">
            {p.category} - {p.count}
          </p>
          <h1 className="mt-4 max-w-4xl [animation:fadeUp_1s_.2s_both] text-[2.3rem] h-display text-balance text-legible-lg sm:text-5xl lg:text-[3.75rem]">
            {p.title}
          </h1>
          <p className="mt-5 max-w-2xl [animation:fadeUp_1s_.4s_both] text-base leading-relaxed font-medium text-white/85 text-legible sm:text-lg">
            {p.summary}
          </p>
          {first && (
            <button
              type="button"
              {...(first.type === "video"
                ? { "data-video-src": first.url, "data-video-poster": first.poster }
                : { "data-video": first.url })}
              data-video-title={p.title}
              data-video-vertical={vertical ? "" : undefined}
              className="group mt-8 inline-flex [animation:fadeUp_1s_.55s_both] items-center gap-3 rounded-full bg-white py-1.5 pr-1.5 pl-6 text-[15px] font-semibold text-navy-900 transition hover:bg-paper-100"
            >
              Xem video
              <span className="flex size-10 items-center justify-center rounded-full bg-orange-500 text-white transition-transform group-hover:scale-110">
                <Icon name="play" className="ml-0.5 size-4" strokeWidth={0} fill="currentColor" />
              </span>
            </button>
          )}
        </div>
      </Container>
    </section>
  );
}

const fmtTime = (sec) => {
  const t = Math.round(sec || 0);
  const m = Math.floor(t / 60);
  return m ? `${m}:${String(t % 60).padStart(2, "0")}` : `${t}s`;
};

/**
 * Cột phải phần "Về sản phẩm" của sản phẩm CHỈ CÓ VIDEO: khung video nổi bật (ảnh bìa + nút phát lớn, bấm → popup
 * phát có tiếng) kèm dải thông số (số video · tổng thời lượng · định dạng). Video dọc: 2 khung 9:16 so le
 * (đủ cân với cột chữ); video ngang: 1 khung 16:9 lớn.
 */
function VideoFeature({ p }) {
  const videos = p.images.filter((m) => m.type !== "image");
  const isV = (m) => m.width && m.height && m.height > m.width;
  const vertical = videos.length && videos.every(isV);
  const shown = vertical ? videos.slice(0, 2) : videos.slice(0, 1);
  const total = videos.reduce((a, m) => a + (m.duration || 0), 0);
  const stats = [
    { label: "Video", value: String(videos.length).padStart(2, "0") },
    total ? { label: "Tổng thời lượng", value: fmtTime(total) } : null,
    { label: "Định dạng", value: vertical ? "9:16" : videos.some(isV) ? "16:9 · 9:16" : "16:9" },
  ].filter(Boolean);

  // 1 video dọc: khung 9:16 + cột thông số dọc bên cạnh (canh giữa cả cụm) — không để khung lẻ lệch trái
  const singleV = vertical && shown.length === 1;
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-[radial-gradient(ellipse_at_center,rgb(248_104_8/0.12),transparent_70%)]"
      />
      <div className={singleV ? "flex items-center justify-center gap-4 sm:gap-8" : ""}>
        <div
          className={
            singleV
              ? "w-[min(50vw,15.5rem)] shrink-0"
              : vertical
                ? "mx-auto grid max-w-md grid-cols-2 gap-4 sm:gap-5"
                : ""
          }
        >
          {shown.map((v, i) => (
            <button
              key={v.url}
              type="button"
              {...(v.type === "video"
                ? { "data-video-src": v.url, "data-video-poster": v.poster }
                : { "data-video": v.url })}
              data-video-title={p.title}
              data-video-vertical={vertical ? "" : undefined}
              aria-label={`Xem video: ${p.title}`}
              className={`reveal group relative block w-full overflow-hidden rounded-3xl bg-navy-900 shadow-soft ring-1 ring-ink/5 ${vertical ? "aspect-9/16" : "aspect-video"} ${vertical && i === 1 ? "translate-y-8" : ""}`}
              data-reveal="scale"
              style={{ "--reveal-delay": `${i * 120}ms` }}
            >
              {v.src && (
                <Image
                  src={v.src}
                  alt=""
                  fill
                  sizes={
                    vertical ? "(min-width: 1024px) 14rem, 45vw" : "(min-width: 1024px) 45vw, 100vw"
                  }
                  className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-105"
                />
              )}
              <span className="absolute inset-0 bg-linear-to-t from-navy-950/70 via-transparent to-transparent" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="relative flex size-16 items-center justify-center rounded-full bg-white/90 text-navy-900 shadow-soft transition-all duration-500 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white sm:size-20">
                  <span className="absolute inset-0 [animation:ripple_2.6s_ease-out_infinite] rounded-full bg-white/40" />
                  <Icon
                    name="play"
                    className="relative ml-1 size-6 sm:size-7"
                    strokeWidth={0}
                    fill="currentColor"
                  />
                </span>
              </span>
              {v.duration > 0 && (
                <span className="absolute right-3 bottom-3 rounded-full bg-navy-950/70 px-2.5 py-1 text-[11px] font-semibold text-white tabular-nums backdrop-blur-sm">
                  {fmtTime(v.duration)}
                </span>
              )}
            </button>
          ))}
        </div>
        <dl
          className={
            singleV
              ? "reveal grid w-28 shrink-0 divide-y divide-ink/10 sm:w-auto"
              : `reveal mx-auto mt-8 grid max-w-md ${stats.length === 3 ? "grid-cols-3" : "grid-cols-2"} divide-x divide-ink/10 ${vertical ? "mt-14" : ""}`
          }
          style={{ "--reveal-delay": "240ms" }}
        >
          {stats.map((st) => (
            <div
              key={st.label}
              className={singleV ? "py-4 text-center sm:px-4" : "px-3 text-center"}
            >
              <dd className="text-[1.75rem] h-display text-navy-900 sm:text-3xl">{st.value}</dd>
              <dt className="mt-1 text-[11px] font-semibold tracking-eyebrow text-ink-muted uppercase">
                {st.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
