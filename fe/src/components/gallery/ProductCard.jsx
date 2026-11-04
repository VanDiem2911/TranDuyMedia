import { SmartImage as Image } from "@/components/ui/SmartImage";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { coverSizes, zoomStyle } from "@/lib/crop";
import { cn } from "@/lib/utils";

/**
 * Thẻ sản phẩm (bộ ảnh / video đã thực hiện): ảnh bìa + thể loại + tên + số ảnh. Hover: ảnh phóng nhẹ, mũi tên trượt.
 * size: "lg" ô rộng (khung 4:3), mặc định khung 3:4 dọc.
 */
export function ProductCard({ product: p, index = 0, size, className, sizes }) {
  return (
    <Link
      href={`/san-pham/${p.slug}`}
      className={cn(
        "group reveal relative block overflow-hidden rounded-2xl bg-navy-900 text-white",
        size === "lg" ? "aspect-4/3" : "aspect-4/5 sm:aspect-3/4", // điện thoại: thấp hơn chút để lướt nhanh
        className,
      )}
      style={{ "--reveal-delay": `${(index % 3) * 90}ms` }}
    >
      <span className="absolute inset-0" style={zoomStyle(p.cover)}>
        <Image
          src={p.cover.src}
          alt={p.title}
          fill
          quality={90} // ảnh đại diện: nén chất lượng cao nhất (q_auto:best) cho nét
          ratio={p.cover.width && p.cover.height ? p.cover.width / p.cover.height : undefined}
          // Khung 3:4 (lg: 4:3) — tính thêm phần ảnh bị phóng khi cắt khung → ảnh bìa luôn đủ nét
          sizes={coverSizes(
            sizes || "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
            p.cover,
            size === "lg" ? 4 / 3 : 3 / 4,
          )}
          className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-105"
          style={{ objectPosition: p.cover.pos }}
        />
      </span>
      <div className="absolute inset-0 bg-linear-to-t from-navy-950/85 via-navy-950/10 to-transparent" />
      <span
        title={p.category}
        className="absolute top-4 left-4 block max-w-[calc(100%-2rem)] truncate rounded-full bg-orange-500 px-3 py-1.5 text-[10px] font-semibold tracking-[0.18em] whitespace-nowrap text-white uppercase shadow-[0_6px_18px_-6px_rgba(248,104,8,0.7)] sm:tracking-eyebrow"
      >
        {p.category}
      </span>
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-6">
        <div>
          <p className="text-[11px] tracking-eyebrow text-white/60 uppercase">{p.count}</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{p.title}</h3>
          <p className="mt-1 hidden text-left text-sm text-white/70 sm:block">{p.summary}</p>
        </div>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-navy-900 transition-all duration-300 group-hover:bg-orange-500 group-hover:text-white">
          <Icon
            name="arrowRight"
            className="size-4 transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </Link>
  );
}
