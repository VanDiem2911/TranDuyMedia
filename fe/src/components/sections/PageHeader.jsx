import { SmartImage as Image } from "@/components/ui/SmartImage";
import Link from "next/link";
import { Container } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Banner đầu trang con — MỌI trang con cùng chiều cao: 2/3 màn hình (tối thiểu 460px, theo mẫu ButStudio).
 * Nền: 1 ảnh tối (image) HOẶC các cột ảnh trôi lên/xuống so le rất chậm (columns: [[src, src, src], ...]).
 * crumbs: các cấp TRƯỚC trang hiện tại (sau "Trang chủ") [{ label, href }] — breadcrumb không hiện trang hiện tại. eyebrow: dòng nhỏ trên tiêu đề (mặc định = breadcrumb).
 * Cụm nội dung căn GIỮA theo chiều cao vùng nền nằm dưới header (header nổi cao 84px: top 20 + 64).
 */
export function PageHeader({
  title,
  description,
  breadcrumb,
  eyebrow,
  crumbs = [],
  image,
  imagePos = "center",
  columns,
  children,
}) {
  return (
    <section
      className="grain relative isolate flex min-h-[max(460px,calc(var(--screen)*0.66))] items-center overflow-hidden bg-navy-950 pt-[calc(76px+2rem)] pb-24 text-white sm:pt-[calc(84px+2rem)]"
      data-nav-theme="dark"
    >
      {columns ? (
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bleed-cap grid grid-cols-3 gap-2 px-2 sm:grid-cols-4 lg:grid-cols-6"
        >
          {columns.map((col, i) => (
            <div
              key={i}
              className={cn(
                "relative h-full",
                i >= 4 ? "hidden lg:block" : i >= 3 && "hidden sm:block",
              )}
            >
              <div
                className={cn(
                  "absolute inset-x-0 top-0 flex h-[128%] flex-col gap-2",
                  i % 2 ? "animate-drift-down" : "animate-drift-up",
                )}
              >
                {col.map((src, k) => (
                  <div key={k} className="relative flex-1 overflow-hidden rounded-xl">
                    <Image
                      src={src}
                      alt=""
                      fill
                      preload={k === 0 && i < 3}
                      sizes="(min-width: 1024px) 17vw, (min-width: 640px) 25vw, 34vw"
                      className="object-cover saturate-[0.85]"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        image && (
          <Image
            src={image}
            alt=""
            fill
            preload
            sizes="100vw"
            className="-z-10 object-cover opacity-45"
            style={{ objectPosition: imagePos }}
          />
        )
      )}
      <div
        className={cn(
          "absolute inset-0 -z-10",
          columns
            ? "bg-navy-950/70"
            : "bg-linear-to-t from-navy-950 via-navy-950/55 to-navy-950/25",
        )}
      />
      {columns && (
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-navy-950 via-navy-950/30 to-navy-950/60" />
      )}

      <Container>
        <nav aria-label="Breadcrumb" className="text-sm text-white/75 text-legible">
          <ol className="flex flex-wrap items-center gap-2.5">
            <li>
              <Link href="/" className="transition-colors hover:text-white">
                Trang chủ
              </Link>
            </li>
            {crumbs.map((c) => (
              <li key={c.href} className="flex items-center gap-2.5">
                <span aria-hidden="true" className="text-white/40">
                  /
                </span>
                <Link href={c.href} className="transition-colors hover:text-white">
                  {c.label}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
        {/* eyebrow={false}: không hiện dòng nhỏ trên tiêu đề */}
        {eyebrow !== false && (
          <p className="mt-6 [animation:fadeUp_1s_.1s_both] eyebrow text-white/80 text-legible">
            {eyebrow || breadcrumb || title}
          </p>
        )}
        <h1
          className={cn(
            eyebrow === false ? "mt-6" : "mt-4",
            "[animation:fadeUp_1s_.2s_both] text-[2.3rem] h-display text-legible-lg sm:text-5xl lg:text-[3.75rem]",
          )}
        >
          {title}
        </h1>
        {description && (
          <p className="mt-5 max-w-2xl [animation:fadeUp_1s_.4s_both] text-base leading-relaxed font-medium text-white/85 text-legible sm:text-lg">
            {description}
          </p>
        )}
        {children && <div className="mt-8 [animation:fadeUp_1s_.55s_both]">{children}</div>}
      </Container>
    </section>
  );
}
