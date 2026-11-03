"use client";

import { useCallback, useEffect, useState } from "react";
import { SmartImage as Image } from "@/components/ui/SmartImage";
import { Icon } from "@/components/icons";
import { Logo } from "@/components/ui";
import { siteConfig } from "@/config/site";
import { lockScroll } from "@/lib/utils";
import { BookingForm } from "./BookingForm";

const bullets = [
  "Phản hồi trong 24 giờ làm việc",
  "Dự toán chi tiết theo hạng mục",
  "Định hướng phù hợp theo mục tiêu dự án",
];

/**
 * Popup đặt lịch dùng chung toàn site.
 * Mở bằng bất kỳ phần tử nào có thuộc tính data-booking (giá trị tuỳ chọn = slug dịch vụ để chọn sẵn);
 * data-booking-note (tuỳ chọn) = nội dung điền sẵn ô mô tả.
 */
export function BookingModal() {
  const [open, setOpen] = useState(false);
  const [preset, setPreset] = useState("");
  const [note, setNote] = useState(""); // nội dung điền sẵn ô mô tả (data-booking-note)

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onClick = (e) => {
      const el = e.target.closest("[data-booking]");
      if (!el) return;
      e.preventDefault();
      setPreset(el.getAttribute("data-booking") || "");
      setNote(el.getAttribute("data-booking-note") || "");
      setOpen(true);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    lockScroll(true);
    return () => {
      window.removeEventListener("keydown", onKey);
      lockScroll(false);
    };
  }, [open, close]);

  if (!open) return null;

  const quick = [
    { href: siteConfig.socials.messenger, label: "Messenger", icon: "messenger", ext: true },
    { href: siteConfig.socials.zalo, label: "Zalo", icon: "zalo", ext: true },
    { href: siteConfig.contact.phoneHref, label: siteConfig.contact.phone, icon: "phone" },
  ];

  return (
    <div
      className="fixed inset-0 z-150 flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Đặt lịch tư vấn"
    >
      <div
        className="absolute inset-0 [animation:fadeIn_.4s_ease-out_both] bg-navy-950/75 backdrop-blur-sm"
        onClick={close}
      />

      <div className="relative grid max-h-[calc(100svh-1.5rem)] w-full max-w-[980px] [animation:popIn_.55s_cubic-bezier(.22,1,.36,1)_both] overflow-hidden rounded-[1.5rem] bg-paper shadow-soft sm:max-h-[92svh] sm:rounded-[1.75rem] lg:grid-cols-[0.42fr_0.58fr]">
        {/* Cột ảnh (desktop) */}
        <div className="relative hidden lg:block">
          <Image src="/images/bts/bts-05.webp" alt="" fill sizes="420px" className="object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-navy-950/90 via-navy-950/30 to-navy-950/10" />
          <div className="absolute inset-x-0 bottom-0 px-8 pt-8 pb-10 text-white">
            {/* Ngắt dòng chủ động theo cụm nghĩa → không tách từ ghép (gia công, hình ảnh, doanh nghiệp) */}
            <p className="text-[1.6rem] h-display leading-[1.32]">
              10+ năm gia công
              <br />
              video, hình ảnh
              <br />
              <span className="text-orange-500">
                toàn diện cho
                <br />
                doanh nghiệp.
              </span>
            </p>
            <ul className="mt-5 space-y-2">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-2 text-[13px] text-white/85">
                  <Icon name="check" className="mt-0.5 size-3.5 shrink-0 text-orange-500" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Cột form — data-lenis-prevent: Lenis không chặn cuộn bên trong popup */}
        <div
          data-lenis-prevent
          className="relative no-scrollbar overflow-y-auto overscroll-contain px-5 pt-6 pb-5 sm:px-9 sm:py-8"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Đóng"
            className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full text-ink/70 transition hover:bg-ink/5 hover:text-ink sm:top-4 sm:right-4"
          >
            <Icon name="close" className="size-5" />
          </button>

          <div className="flex flex-col items-center text-center">
            <Logo className="h-10 sm:h-12" />
            <h3 className="mt-2.5 text-[1.45rem] h-display text-ink sm:mt-3 sm:text-[2rem]">
              Đặt lịch tư vấn miễn phí
            </h3>
            <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-ink-soft sm:mt-2 sm:text-[13.5px]">
              Cảm ơn quý khách đã quan tâm. Để lại thông tin, chúng tôi sẽ phản hồi lại trong 24 giờ
              để trao đổi định hướng và gửi dự toán tới bạn.
            </p>
          </div>

          <div className="mt-4 sm:mt-6">
            <BookingForm preset={preset} note={note} compact />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-ink/10 pt-4 text-[12px] text-ink-muted sm:mt-6 sm:pt-5">
            <span>Hoặc liên hệ trực tiếp:</span>
            {quick.map(({ href, label, icon, ext }) => (
              <a
                key={label}
                href={href}
                target={ext ? "_blank" : undefined}
                rel={ext ? "noopener noreferrer" : undefined}
                className="inline-flex items-center gap-1.5 text-ink/80 transition hover:text-ink"
              >
                <Icon name={icon} className={icon === "zalo" ? "size-5" : "size-4"} /> {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
