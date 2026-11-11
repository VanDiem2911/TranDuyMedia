import { AddTile, ImageTools } from "@/components/admin/about/inline-edit";
import { Pic, T } from "@/components/about/edit-kit";
import { LoopCarousel, ZoomGroup, ZoomImage } from "@/components/gallery";
import { Container } from "@/components/ui";
import { btsGallery } from "@/data/about";
import { cn } from "@/lib/utils";

/**
 * Hậu trường sản xuất (dùng chung trang chủ + trang dịch vụ) — theo kiểu "Behind the scenes" phổ biến:
 * tiêu đề canh giữa, bên dưới 3 HÀNG ẢNH ngang liền nhau, mỗi hàng một dải lướt vô hạn riêng
 * (kéo / vuốt được, tự lướt cùng nhịp 4 giây, xen kẽ chiều zic zắc — không có nút).
 * Mỗi hàng hiện vừa khít 3 ảnh (tablet 2, điện thoại 1), dừng đúng mép ảnh. Bấm ảnh → xem lớn (lightbox chung cả 3 hàng).
 * Trang chủ truyền thêm `content` (nội dung chỉnh được) + `edit` (trang quản trị: ảnh xếp thành lưới để thêm / xoá / đổi).
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
  content, // { eyebrow, titleLead, titleAccent, images } — có thì dùng thay cho các prop trên
  edit,
}) {
  const heading = content ? (
    <>
      <T edit={edit} path="bts.titleLead" value={content.titleLead} />{" "}
      <span className="whitespace-nowrap text-orange-500">
        <T edit={edit} path="bts.titleAccent" value={content.titleAccent} />
      </span>
    </>
  ) : (
    title
  );
  const list = content
    ? content.images.map((g) => ({ src: g.image.src, pos: g.image.pos, alt: g.alt }))
    : images;

  // Chia ảnh xen kẽ cho 3 hàng → mỗi hàng đủ đa dạng
  const rows = ROWS.map((_, r) => list.map((img, i) => ({ img, i })).filter((x) => x.i % 3 === r));

  return (
    <section
      id={id}
      className={cn("grain relative overflow-hidden bg-navy-950 section-y text-white", className)}
      data-nav-theme="dark"
      aria-labelledby={`${id}-title`}
    >
      <Container className="relative">
        <div className="mx-auto max-w-2xl text-center">
          <p className="reveal mb-4 eyebrow">
            {content ? <T edit={edit} path="bts.eyebrow" value={content.eyebrow} /> : eyebrow}
          </p>
          <h2 id={`${id}-title`} className="reveal h-section" style={{ "--reveal-delay": "80ms" }}>
            {heading}
          </h2>
        </div>

        {edit ? (
          // Trang quản trị: xếp ảnh thành lưới để thấy, đổi, xoá, thêm cùng lúc
          <div className="mt-10 grid grid-cols-2 gap-3 sm:mt-12 lg:grid-cols-3">
            {list.map((img, i) => (
              <div
                key={i}
                className="group relative aspect-16/9 overflow-hidden rounded-lg bg-navy-900 ring-1 ring-white/10"
              >
                <Pic
                  edit={edit}
                  src={img.src}
                  alt={img.alt}
                  pos={img.pos}
                  sizes="30vw"
                  className="object-cover"
                />
                <ImageTools
                  edit={edit}
                  path={`bts.images.${i}.image`}
                  altPath={`bts.images.${i}.alt`}
                  listPath="bts.images"
                  index={i}
                />
              </div>
            ))}
            <AddTile
              edit={edit}
              listPath="bts.images"
              label="Thêm ảnh"
              className="aspect-16/9 rounded-lg border-white/25 text-white/80 hover:border-orange-500 hover:text-white"
            />
          </div>
        ) : (
          <ZoomGroup images={list}>
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
                      key={`${img.src}-${i}`}
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
        )}
      </Container>
    </section>
  );
}
