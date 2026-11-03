import { SmartImage as Image } from "@/components/ui/SmartImage";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { Button, Container } from "@/components/ui";

// Mỗi khung = một mảng trong hệ sinh thái dịch vụ (feedback 02/11: gộp Documentary + Talkshow, thêm Cho thuê
// studio, đổi ảnh Video sự kiện); ghi chú như storyboard đạo diễn. slug → trang dịch vụ + chọn sẵn trong form tư vấn.
const PANELS = [
  {
    name: "TVC / iTVC",
    desc: "Quảng cáo 15–60s cho TV và các nền tảng online.",
    shot: "Close-up - 85mm",
    src: "/images/services/itvc-elip-1.webp",
    pos: "center 40%",
    slug: "san-xuat-itvc-viral",
  },
  {
    name: "Video ngắn 9:16",
    desc: "TikTok, Reels, Shorts — nhịp nhanh, bám xu hướng.",
    shot: "Vertical - 9:16",
    src: "/images/clips/short-4.webp",
    pos: "center 30%",
    slug: "san-xuat-video-short",
  },
  {
    name: "Documentary, talkshow & testimonial",
    desc: "Câu chuyện thương hiệu, phỏng vấn, chân dung nhà sáng lập.",
    shot: "Two-shot - 3 cam",
    src: "/images/clips/itvc-2.webp",
    pos: "center 40%",
    slug: "phim-doanh-nghiep-su-kien",
  },
  {
    name: "Phim doanh nghiệp",
    desc: "Profile, năng lực, nhà xưởng — phục vụ đấu thầu.",
    shot: "Wide - 24mm",
    src: "/images/about-hd/corporate-factory.webp",
    pos: "center",
    slug: "phim-doanh-nghiep-su-kien",
  },
  {
    name: "Video sự kiện",
    desc: "Hội nghị, tất niên, ra mắt — highlight bàn giao trong ngày.",
    shot: "Multi-cam - Live",
    src: "/images/about-hd/event-ballroom.webp",
    pos: "center 45%",
    slug: "phim-doanh-nghiep-su-kien",
  },
  {
    name: "Cho thuê studio",
    desc: "Room 24m² & 150m² — sẵn đèn, phông nền, thuê theo giờ.",
    shot: "Studio - 2 room",
    src: "/images/about-hd/studio-hall.webp",
    pos: "center",
    slug: "cho-thue-studio",
  },
];

/**
 * Trang chủ — "Hệ sinh thái dịch vụ trọng tâm" trình bày như một tờ STORYBOARD:
 * 6 khung phân cảnh (mảng dịch vụ), mỗi khung có số cảnh, cỡ cảnh/ống kính, thời lượng và ghi chú.
 * Rê chuột: ảnh trắng-đen → màu, khung nhấc nhẹ. Bấm khung → trang dịch vụ.
 * Dưới mỗi khung: nút "Liên hệ tư vấn" (mở form, chọn sẵn dịch vụ) + "Xem thêm" (trang dịch vụ).
 */
export function VideoFocus() {
  return (
    <section
      id="dich-vu-trong-tam"
      className="grain relative overflow-hidden bg-navy-950 section-y text-white"
      data-nav-theme="dark"
    >
      <Container>
        <p className="reveal mb-4 eyebrow">Tran Duy Media</p>
        {/* Tiêu đề trái + khẩu hiệu & nút phải (canh giữa theo chiều cao tiêu đề) */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
          <h2 className="reveal max-w-2xl h-section" style={{ "--reveal-delay": "80ms" }}>
            Hệ sinh thái <span className="whitespace-nowrap">dịch vụ</span>{" "}
            <span className="whitespace-nowrap text-orange-500">trọng tâm.</span>
          </h2>
          {/* Khối co theo bề rộng khẩu hiệu → 2 nút canh giữa đúng bằng dòng ALL IN FOR PRODUCTION */}
          <div
            className="reveal flex w-fit flex-col items-center"
            style={{ "--reveal-delay": "160ms" }}
          >
            <p className="flex items-center gap-3 text-base font-bold tracking-[0.16em] whitespace-nowrap text-white uppercase sm:text-xl sm:tracking-[0.22em]">
              <span className="h-0.5 w-8 bg-orange-500" aria-hidden="true" />
              All in for production
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button href="/dich-vu" variant="white" pill>
                Xem dịch vụ
              </Button>
              <button
                type="button"
                data-showreel
                className="inline-flex items-center gap-2.5 rounded-full border border-white/25 px-5 py-3 text-sm font-medium transition hover:border-white hover:bg-white hover:text-navy-900"
              >
                <Icon name="play" className="size-3.5" strokeWidth={0} fill="currentColor" />
                Showreel
              </button>
            </div>
          </div>
        </div>

        {/* Tờ storyboard */}
        <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.02] p-4 sm:p-6 lg:p-8">
          {/* Đầu tờ: thông tin dự án kiểu bảng phân cảnh */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-dashed border-white/15 pb-5 font-mono text-[11px] tracking-widest text-white/45 uppercase">
            <span>
              Project: <span className="text-white/80">Trần Duy Media</span>
            </span>
            <span className="hidden sm:inline">Services: 06</span>
            <span>
              Sheet <span className="text-orange-500">01</span> / 01
            </span>
          </div>

          <ol className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-12">
            {PANELS.map((p, i) => {
              const href = `/dich-vu/${p.slug}`;
              return (
                <li
                  key={p.name}
                  className="reveal group flex flex-col"
                  style={{ "--reveal-delay": `${(i % 3) * 90}ms` }}
                >
                  <Link href={href} className="block flex-1">
                    {/* Khung phân cảnh */}
                    <div className="relative aspect-video overflow-hidden rounded-lg bg-navy-900 ring-1 ring-white/15 transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:-translate-y-1 group-hover:shadow-[0_24px_50px_-24px_rgba(248,104,8,0.55)] group-hover:ring-orange-500/70">
                      <Image
                        src={p.src}
                        alt={p.name}
                        fill
                        sizes="(min-width: 1024px) 30vw, 46vw"
                        className="object-cover grayscale transition-[filter,transform] duration-700 group-hover:scale-105 group-hover:grayscale-0"
                        style={{ objectPosition: p.pos }}
                      />
                    </div>

                    {/* Ghi chú dưới khung */}
                    <h3 className="mt-3 text-[15px] leading-snug font-bold tracking-tight text-balance transition-colors group-hover:text-orange-500 sm:mt-4 sm:text-lg">
                      {p.name}
                    </h3>
                    <p className="mt-1 hidden text-left text-sm leading-relaxed text-white/55 sm:block">
                      {p.desc}
                    </p>
                  </Link>

                  {/* Hành động: tư vấn (form chọn sẵn dịch vụ) + xem thêm (trang dịch vụ) */}
                  {/* Điện thoại (thẻ hẹp): nút tư vấn trải ngang, ẩn "Xem thêm" (bấm tên / ảnh đã tới trang dịch vụ) */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-dashed border-white/12 pt-3 sm:mt-4 sm:pt-4">
                    <button
                      type="button"
                      data-booking={p.slug}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full bg-orange-500 px-3.5 py-2 text-[11px] font-semibold tracking-wide text-white transition hover:bg-orange-600 max-sm:w-full sm:px-4 sm:text-xs"
                    >
                      <Icon name="phone" className="size-3.5" />
                      Liên hệ tư vấn
                    </button>
                    <Link
                      href={href}
                      className="group/more hidden items-center gap-1.5 py-1 text-[11px] font-semibold tracking-wide text-white/70 transition-colors hover:text-orange-500 sm:inline-flex sm:text-xs"
                    >
                      Xem thêm
                      <Icon
                        name="arrowRight"
                        className="size-3.5 transition-transform group-hover/more:translate-x-0.5"
                      />
                    </Link>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </Container>
    </section>
  );
}
