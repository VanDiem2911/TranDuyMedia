"use client";

import { useEffect, useRef } from "react";
import { preload } from "react-dom";
import { SmartImage as Image } from "@/components/ui/SmartImage";
import { Icon } from "@/components/icons";
import { Container } from "@/components/ui";
import { siteConfig } from "@/config/site";
import { pickShowreelSrc } from "@/lib/showreel";

/**
 * Đầu trang dịch vụ (4 dịch vụ sản xuất): SHOWREEL phát làm nền, cao gần trọn 1 màn hình nhưng có giới hạn
 * (--screen = min(100svh, 940px)). Video tắt tiếng, tự phát; chọn 1080p / 720p theo thiết bị.
 * segments: các đoạn showreel đúng dịch vụ [[bắt đầu, kết thúc], …] (giây) — phát nối vòng, bỏ các màn chữ
 * giới thiệu của showreel. Không truyền → phát cả video.
 * Trên video (canh giữa): logo thương hiệu · tên dịch vụ · mô tả · nút liên hệ tư vấn.
 */
// Cụm từ ghép trong tên dịch vụ & mô tả: nối bằng khoảng trắng không ngắt → không bị tách ra 2 dòng
const KEEP = [
  "Sản xuất",
  "video short",
  "doanh nghiệp,",
  "sự kiện",
  "Chụp ảnh",
  "quảng cáo",
  "Cho thuê",
  "bối cảnh",
  // từ ghép trong đoạn mô tả
  "quay phim",
  "quay dựng",
  "chụp ảnh",
  "doanh nghiệp",
  "giới thiệu",
  "đa máy",
  "bàn giao",
  "truyền thông",
  "trọn gói",
  "kịch bản",
  "hậu kỳ",
  "chỉnh màu",
  "sản phẩm",
  "nền trắng",
  "key visual",
  "chiến dịch",
  "bản web",
  "bản in",
  "nền tảng",
  "thông điệp",
];
const keepWords = (str) =>
  KEEP.reduce((acc, k) => acc.split(k).join(k.replace(/ /g, "\u00a0")), str ?? "");

export function ServiceVideoHero({ title, description, eyebrow, slug, segments, poster, clip }) {
  const ref = useRef(null);
  // Ảnh chờ = ĐÚNG khung hình đầu đoạn video của dịch vụ (không phải màn "Hello!" mở đầu showreel) và tải
  // ưu tiên cao → trong lúc video tải, người xem đã thấy đúng cảnh sắp phát, chuyển sang video liền mạch.
  const still = poster || siteConfig.showreel.poster;
  preload(still, { as: "image", fetchPriority: "high" });
  // Phụ thuộc bằng chuỗi (luôn 1 phần tử, so sánh theo giá trị) — mảng đoạn được tạo mới mỗi lần render
  const segKey = JSON.stringify(segments?.length ? segments : null);
  const clipKey = JSON.stringify(clip ?? null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    // Đoạn video RIÊNG của dịch vụ (vài MB, cắt sẵn đúng các cảnh) → phát lặp ngay, không phải tải showreel
    // 32MB rồi tua tới giữa video. 1080p cho màn rộng, 720p cho điện thoại / chế độ tiết kiệm dữ liệu.
    const own = JSON.parse(clipKey);
    if (own) {
      const wide = window.matchMedia("(min-width: 768px)").matches;
      v.loop = true;
      v.src = wide && !navigator.connection?.saveData ? own.hd : own.sd;
      v.play().catch(() => {}); // trình duyệt chặn tự phát → giữ ảnh chờ
      return;
    }
    const segs = JSON.parse(segKey);
    let k = 0;
    const jump = () => {
      if (!segs) return;
      v.currentTime = segs[k][0];
    };
    const onTime = () => {
      if (!segs || v.currentTime < segs[k][1]) return;
      k = (k + 1) % segs.length; // hết đoạn → sang đoạn kế (hết danh sách → quay lại đoạn đầu)
      jump();
    };
    v.addEventListener("loadedmetadata", jump, { once: true });
    v.addEventListener("timeupdate", onTime);
    v.loop = !segs;
    // #t=… : trình duyệt xin ngay phần dữ liệu ở đầu đoạn cần phát thay vì từ giây 0 → hiện video nhanh hơn
    v.src = segs ? `${pickShowreelSrc()}#t=${segs[0][0]}` : pickShowreelSrc();
    v.play().catch(() => {}); // trình duyệt chặn tự phát → giữ ảnh poster
    return () => v.removeEventListener("timeupdate", onTime);
  }, [segKey, clipKey]);

  return (
    <section
      className="relative isolate flex h-(--screen) min-h-[560px] items-center justify-center overflow-hidden bg-navy-950 pt-24 pb-12 text-center text-white"
      data-nav-theme="dark"
    >
      <video
        ref={ref}
        poster={still}
        muted
        playsInline
        autoPlay
        preload="auto"
        aria-hidden="true"
        className="absolute inset-0 -z-20 size-full object-cover"
      />
      {/* Phủ tối vừa đủ đọc chữ (giảm so với trước để video rõ, không đục): lớp đều nhẹ + quầng nhẹ giữa khung
          + đậm dần ở mép trên (header) và mép dưới */}
      <div className="absolute inset-0 -z-10 bg-navy-950/35 max-sm:bg-navy-950/45" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgb(8_12_22/0.35)_0%,transparent_65%)]" />
      <div className="absolute inset-0 -z-10 bg-linear-to-b from-navy-950/60 via-transparent to-navy-950/70" />

      {/* Nội dung canh giữa cả 2 chiều; bề rộng chữ theo ký tự (ch) → thu / phóng trình duyệt vẫn cân */}
      <Container className="flex flex-col items-center">
        {/* Logo thương hiệu thay cho breadcrumb + số dịch vụ (logo đầy đủ: biểu tượng TD + chữ TRAN DUY MEDIA) */}
        <div className="relative [animation:fadeUp_1s_.1s_both]">
          <span
            aria-hidden="true"
            className="absolute top-[28%] left-[62%] -z-10 size-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/20 blur-2xl"
          />
          <Image
            src="/images/brand/logo-light.webp"
            alt="Tran Duy Media"
            width={989}
            height={768}
            preload
            sizes="200px"
            className="h-[clamp(4rem,12svh,7rem)] w-auto drop-shadow-[0_4px_18px_rgba(0,0,0,0.45)]"
          />
        </div>
        <p className="sr-only">{eyebrow}</p>
        <h1 className="mt-6 max-w-[16ch] [animation:fadeUp_1s_.2s_both] text-[2.4rem] h-display text-balance text-legible-lg sm:mt-7 sm:text-6xl lg:text-[4.5rem]">
          {keepWords(title)}
        </h1>
        <p className="mt-5 max-w-[58ch] [animation:fadeUp_1s_.4s_both] text-center text-base leading-relaxed font-medium text-balance text-white/85 text-legible sm:text-lg">
          {keepWords(description)}
        </p>
        <div className="mt-8 flex [animation:fadeUp_1s_.55s_both] flex-wrap justify-center gap-3">
          <button
            type="button"
            data-booking={slug}
            className="group inline-flex items-center gap-3 rounded-full bg-white py-1.5 pr-1.5 pl-7 text-[15px] font-semibold text-navy-900 shadow-[0_14px_36px_-16px_rgba(0,0,0,0.6)] transition hover:bg-paper-100"
          >
            Liên hệ tư vấn
            <span className="flex size-10 items-center justify-center rounded-full bg-orange-500 text-white transition-transform group-hover:translate-x-0.5">
              <Icon name="arrowRight" className="size-[18px]" />
            </span>
          </button>
        </div>
      </Container>
    </section>
  );
}
