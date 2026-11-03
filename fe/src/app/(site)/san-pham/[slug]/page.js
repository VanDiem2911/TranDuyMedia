import { Suspense } from "react";
import { SmartImage as Image } from "@/components/ui/SmartImage";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { AlbumGallery, ProductCard, ProductVideos } from "@/components/gallery";
import { Container } from "@/components/ui";
import { PageHeader } from "@/components/sections";
import { coverSizes, zoomStyle } from "@/lib/crop";
import { headerColumns } from "@/lib/header-collage";
import { getProduct, getProducts, relatedProducts } from "@/lib/products";
import { createMetadata } from "@/lib/metadata";

export async function generateStaticParams() {
  const products = await getProducts();
  // Cache Components yêu cầu ít nhất 1 tham số; backend chưa chạy lúc build → dựng theo yêu cầu
  return products.length ? products.map((p) => ({ slug: p.slug })) : [{ slug: "__none" }];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  // Backend chập chờn → dùng tiêu đề mặc định thay vì gắn "404" cho trang đang tồn tại
  const p = await getProduct(slug).catch(() => null);
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
      <PageHeader
        title={p.title}
        eyebrow={`${p.category} - ${p.count}`}
        description={p.summary}
        crumbs={[{ label: "Sản phẩm", href: "/san-pham" }]}
        columns={headerColumns(
          [...p.images.map((im) => im.src), ...p.scenes].filter(Boolean),
          p.cover.src,
        )}
      />

      {/* Tổng quan: mô tả + thông tin dự án (trái) | 3 ảnh tiêu biểu so le (phải) */}
      <section className="bg-white section-y" data-nav-theme="light">
        <Container>
          <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12 xl:gap-16">
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

            {/* Mọi sản phẩm: cụm 3 ảnh nổi bật (chọn riêng ở quản trị → ảnh trong thư viện → cảnh tự chụp từ video) */}
            {p.covers.length > 0 && (
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {p.covers.map((img, i) => (
                  <div
                    key={i}
                    className={`reveal relative aspect-[3/4.4] overflow-hidden rounded-2xl bg-paper-200 shadow-card ${i === 1 ? "-translate-y-6 sm:-translate-y-10" : ""}`}
                    data-reveal="scale"
                    style={{ "--reveal-delay": `${i * 120}ms` }}
                  >
                    <span className="absolute inset-0" style={zoomStyle(img)}>
                      <Image
                        src={img.src}
                        alt=""
                        fill
                        sizes={coverSizes("(min-width: 1024px) 22vw, 33vw", img, 3 / 4.4)}
                        quality={90} // ảnh nổi bật: nén chất lượng cao nhất (q_auto:best) cho nét
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
            <h2 className="reveal text-3xl h-display sm:text-4xl">Thư viện sản phẩm</h2>
            <p className="reveal text-left text-sm text-ink-muted">Bấm để xem lớn</p>
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
