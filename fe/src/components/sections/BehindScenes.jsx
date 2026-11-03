import { LoopCarousel, ZoomGroup, ZoomImage } from "@/components/gallery";
import { Container } from "@/components/ui";
import { btsGallery } from "@/data/about";
import { cn } from "@/lib/utils";

/**
 * Hậu trường sản xuất (dùng chung trang chủ + trang dịch vụ) — theo kiểu "Behind the scenes" phổ biến:
 * tiêu đề canh giữa, bên dưới 3 HÀNG ẢNH ngang liền nhau, mỗi hàng một dải lướt vô hạn riêng
 * (kéo / vuốt được, tự lướt cùng nhịp 4 giây, xen kẽ chiều zic zắc — không có nút).
 * Mỗi hàng hiện vừa khít 3 ảnh (tablet 2, điện thoại 1), dừng đúng mép ảnh. Bấm ảnh → xem lớn (lightbox chung cả 3 hàng).
 */
// Cả 3 hàng tự lướt cùng lúc mỗi 4 giây, xen kẽ chiều (zic zắc): hàng 1 → trái, hàng 2 → phải, hàng 3 → trái
const ROWS = [
  { autoplay: 4000, reverse: false },
  { autoplay: 4000, reverse: true },
  { autoplay: 4000, reverse: false },
];

export function BehindScenes({
  id = "hau-truong",
  eyebrow = "Behind the scenes",
  title = (
    <>
      Hậu trường <span className="whitespace-nowrap text-orange-500">sản xuất.</span>
    </>
  ),
  images = btsGallery,
  className,
}) {
  // Chia ảnh xen kẽ cho 3 hàng → mỗi hàng đủ đa dạng
  const rows = ROWS.map((_, r) =>
    images.map((img, i) => ({ img, i })).filter((x) => x.i % 3 === r),
  );

  return (
    <section
      id={id}
      className={cn("grain relative overflow-hidden bg-navy-950 section-y text-white", className)}
      data-nav-theme="dark"
      aria-labelledby={`${id}-title`}
    >
      <Container className="relative">
        <div className="mx-auto max-w-2xl text-center">
          <p className="reveal mb-4 eyebrow">{eyebrow}</p>
          <h2 id={`${id}-title`} className="reveal h-section" style={{ "--reveal-delay": "80ms" }}>
            {title}
          </h2>
        </div>

        <ZoomGroup images={images}>
          <div className="reveal mt-10 space-y-1.5 sm:mt-12 sm:space-y-2">
            {rows.map((row, r) => (
              <LoopCarousel
                key={r}
                label={`Ảnh hậu trường - hàng ${r + 1}`}
                compact
                arrows={false}
                autoplay={ROWS[r].autoplay}
                reverse={ROWS[r].reverse}
                gapClass="gap-1.5 sm:gap-2"
                // Vừa khít số ảnh trong khung (1 / 2 / 3 ảnh) → luôn dừng đúng mép ảnh, không hở nửa ảnh
                itemClassName="w-[100cqw] sm:w-[calc((100cqw-0.5rem)/2)] lg:w-[calc((100cqw-1rem)/3)]"
              >
                {row.map(({ img, i }) => (
                  <ZoomImage
                    key={img.src}
                    index={i}
                    src={img.src}
                    alt={img.alt}
                    pos={img.pos}
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 44vw, 78vw"
                    className="aspect-16/9 w-full bg-navy-900 [&_img]:pointer-events-none"
                  >
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-navy-950/85 to-transparent p-4 pt-10 text-left text-[13px] font-medium text-white/90 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                      {img.alt}
                    </span>
                  </ZoomImage>
                ))}
              </LoopCarousel>
            ))}
          </div>
        </ZoomGroup>
      </Container>
    </section>
  );
}
