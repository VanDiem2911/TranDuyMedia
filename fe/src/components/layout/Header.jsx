"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons";
import { Logo } from "@/components/ui";
import { mainNav, siteConfig } from "@/config/site";
import { services } from "@/data/services";
import { onLayoutChange, pageTop, subscribeScroll } from "@/lib/scroll";
import { cn, lockScroll } from "@/lib/utils";

/**
 * Header dạng "viên thuốc" kính mờ nổi cách mép (theo mẫu ButStudio):
 * - trên hero (ảnh tối) là kính tối chữ trắng; cuộn xuống chuyển sang kính sáng chữ navy.
 * - menu giữa có ô active, CTA kèm vòng tròn mũi tên.
 * - Section nào muốn header tối: đặt data-nav-theme="dark" lên section đó.
 */
export function Header() {
  const pathname = usePathname();
  // Menu mobile: lưu kèm pathname lúc mở → đổi trang là tự đóng (không cần setState trong effect)
  const [menu, setMenu] = useState({ open: false, path: "" });
  const [onDark, setOnDark] = useState(false);
  const darkRef = useRef(false);
  const open = menu.open && menu.path === pathname;
  const setOpen = (v) =>
    setMenu((m) => ({
      open: typeof v === "function" ? v(m.open && m.path === pathname) : v,
      path: pathname,
    }));

  // Dò section nằm sau header: phần tử data-nav-theme="dark" phủ qua tâm header → kính tối chữ trắng.
  // Vị trí các section được đo sẵn (đo lại khi bố cục đổi); mỗi frame cuộn chỉ so sánh với scrollY —
  // không gọi getBoundingClientRect cho từng section, không setState khi theme không đổi.
  useEffect(() => {
    let sections = [];
    const update = () => {
      const y = window.scrollY + 52; // tâm header (top 20px + 64/2)
      let dark = false;
      for (const s of sections) if (s.top <= y && s.bottom >= y) dark = s.dark;
      if (dark !== darkRef.current) {
        darkRef.current = dark;
        setOnDark(dark);
      }
    };
    const measure = () => {
      sections = [...document.querySelectorAll("[data-nav-theme]")].map((el) => {
        const top = pageTop(el);
        return { top, bottom: top + el.offsetHeight, dark: el.dataset.navTheme === "dark" };
      });
      update();
    };
    const offLayout = onLayoutChange(measure);
    const offScroll = subscribeScroll(update);
    // Trang vừa đổi: nội dung mới có thể chưa gắn xong → đo lại sau khi hiệu ứng chuyển trang chạy xong
    const t = setTimeout(measure, 500);
    return () => {
      offLayout();
      offScroll();
      clearTimeout(t);
    };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    lockScroll(true);
    return () => lockScroll(false);
  }, [open]);

  const dark = onDark && !open;
  const isActive = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="fixed inset-x-3 top-3 z-50 sm:inset-x-5 sm:top-5">
      <div
        className={cn(
          "mx-auto flex h-16 w-full max-w-[86rem] items-center justify-between rounded-full border pr-2 pl-4 backdrop-blur-md transition-[background-color,border-color,color,box-shadow] duration-500 sm:pl-6 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:pl-2",
          dark
            ? "border-white/15 bg-navy-950/45 text-white shadow-[0_10px_40px_-20px_rgba(0,0,0,0.7)]"
            : "border-white/70 bg-paper/85 text-ink shadow-[0_12px_40px_-24px_rgba(11,18,32,0.35)]",
        )}
      >
        <Link
          href="/"
          aria-label={`${siteConfig.name} – Trang chủ`}
          className="-my-2 flex shrink-0 items-center justify-self-start py-2 lg:pl-4"
        >
          <Logo className="h-10 sm:h-11" light={dark} preload />
        </Link>

        {/* Desktop: 3 cột logo | menu | nút — menu nằm đúng giữa thanh, không đè 2 bên */}
        <nav aria-label="Điều hướng chính" className="hidden items-center gap-1 lg:flex">
          {mainNav.map((item) => {
            const active = isActive(item.href);
            const linkCls = cn(
              "inline-flex items-center gap-1 rounded-full px-4 py-2 text-[15px] font-semibold tracking-wide transition-all duration-300 xl:px-5",
              active
                ? dark
                  ? "bg-white text-navy-900"
                  : "bg-navy-900 text-white"
                : dark
                  ? "text-white/80 hover:bg-white/10 hover:text-white"
                  : "text-ink/75 hover:bg-navy-900/5 hover:text-ink",
            );
            if (item.href !== "/dich-vu") {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={linkCls}
                >
                  {item.label}
                </Link>
              );
            }
            // "Dịch vụ": bấm → trang tổng hợp; rê chuột / Tab → dropdown 3 dịch vụ con, căn giữa dưới nút
            return (
              <div key={item.href} className="group/dd relative">
                <Link
                  href={item.href}
                  aria-current={pathname === item.href ? "page" : undefined}
                  aria-haspopup="true"
                  className={linkCls}
                >
                  {item.label}
                  <Icon
                    name="chevronDown"
                    className="size-3.5 transition-transform duration-300 group-hover/dd:rotate-180 group-has-[:focus-visible]/dd:rotate-180"
                    strokeWidth={2.2}
                  />
                </Link>
                {/* pt-3: cầu nối vô hình giữa nút và bảng → rê chuột xuống không bị tắt */}
                <div className="invisible absolute top-full left-1/2 w-80 -translate-x-1/2 translate-y-1 pt-3 opacity-0 transition-all duration-200 group-hover/dd:visible group-hover/dd:translate-y-0 group-hover/dd:opacity-100 group-has-[:focus-visible]/dd:visible group-has-[:focus-visible]/dd:translate-y-0 group-has-[:focus-visible]/dd:opacity-100">
                  {/* Mũi nhọn chỉ lên nút */}
                  <span className="absolute top-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 rounded-[2px] bg-white" />
                  <ul className="relative rounded-2xl bg-white p-2 text-ink shadow-[0_24px_60px_-20px_rgba(11,18,32,0.45)] ring-1 ring-ink/5">
                    {services.map((sv) => {
                      const on = pathname === `/dich-vu/${sv.slug}`;
                      return (
                        <li key={sv.slug}>
                          <Link
                            href={`/dich-vu/${sv.slug}`}
                            aria-current={on ? "page" : undefined}
                            className={cn(
                              "group/it flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-paper",
                              on && "bg-paper",
                            )}
                          >
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-navy-900 text-white transition-colors group-hover/it:bg-orange-500">
                              <Icon name={sv.icon} className="size-5" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold">{sv.title}</span>
                              <span className="block truncate text-xs text-ink-muted">
                                {sv.menuDesc}
                              </span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5 justify-self-end sm:gap-2">
          <a
            href={siteConfig.contact.phoneHref}
            className={cn(
              "hidden h-9 items-center gap-2 rounded-full px-3 text-[13px] font-medium transition md:flex",
              dark
                ? "text-white/80 hover:bg-white/10 hover:text-white"
                : "text-ink/70 hover:bg-navy-900/5 hover:text-ink",
            )}
          >
            <Icon name="phone" className="size-4" />
            {siteConfig.contact.phone}
          </a>

          <button
            type="button"
            data-booking
            className={cn(
              "group hidden items-center gap-3 rounded-full py-1.5 pr-1.5 pl-5 text-[13px] font-medium transition-all duration-300 md:inline-flex",
              dark
                ? "bg-white text-navy-900 hover:bg-paper-100"
                : "bg-navy-900 text-white hover:bg-navy-700",
            )}
          >
            Đặt lịch
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-full transition-transform duration-300 group-hover:translate-x-0.5",
                dark ? "bg-orange-500 text-white" : "bg-orange-500 text-white",
              )}
            >
              <Icon name="arrowRight" className="size-4" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Đóng menu" : "Mở menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className={cn(
              "flex size-11 items-center justify-center rounded-full transition lg:hidden",
              dark ? "text-white hover:bg-white/10" : "text-ink hover:bg-navy-900/5",
            )}
          >
            {open ? (
              <Icon name="close" className="size-6" />
            ) : (
              <span className="flex flex-col gap-[5px]">
                <span className="block h-px w-6 bg-current" />
                <span className="block h-px w-4 bg-current" />
                <span className="block h-px w-6 bg-current" />
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Menu mobile toàn màn hình */}
      <div
        id="mobile-menu"
        className={cn(
          "fixed inset-0 -z-10 bg-paper transition-all duration-500 lg:hidden",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <nav aria-label="Điều hướng mobile" className="flex h-full flex-col px-7 pt-28 pb-8">
          {mainNav.map((item, i) => (
            <div
              key={item.href}
              className={cn(
                "border-b border-ink/10 transition-all duration-500",
                open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
              )}
              style={{ transitionDelay: open ? `${120 + i * 50}ms` : "0ms" }}
            >
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between py-4 text-2xl font-semibold tracking-tight text-ink"
              >
                {item.label}
                <Icon
                  name="arrowRight"
                  className={cn(
                    "size-5",
                    isActive(item.href) ? "text-orange-500" : "text-ink-muted",
                  )}
                />
              </Link>
              {item.href === "/dich-vu" && (
                <ul className="-mt-1 mb-4 space-y-1 border-l-2 border-orange-500/40 pl-4">
                  {services.map((sv) => (
                    <li key={sv.slug}>
                      <Link
                        href={`/dich-vu/${sv.slug}`}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-2 py-1.5 text-[15px]",
                          pathname === `/dich-vu/${sv.slug}` ? "text-orange-500" : "text-ink-soft",
                        )}
                      >
                        <Icon name={sv.icon} className="size-4" />
                        {sv.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          <button
            type="button"
            data-booking
            onClick={() => setOpen(false)}
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-navy-900 px-6 py-4 text-sm font-medium text-white"
          >
            Đặt lịch tư vấn miễn phí <Icon name="arrowRight" className="size-4" />
          </button>
          {/* Kênh mạng xã hội của studio */}
          <ul className="mt-auto mb-5 flex justify-center gap-3">
            {[
              ["facebook", siteConfig.socials.facebook],
              ["youtube", siteConfig.socials.youtube],
              ["tiktok", siteConfig.socials.tiktok],
            ].map(([name, href]) => (
              <li key={name}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  className="flex size-11 items-center justify-center rounded-full bg-navy-900/5 text-ink transition-colors hover:bg-orange-500 hover:text-white"
                >
                  <Icon name={name} className="size-5" />
                </a>
              </li>
            ))}
          </ul>
          <p className="text-center text-xs text-ink-muted">
            Hotline:{" "}
            <a href={siteConfig.contact.phoneHref} className="-my-2 inline-block py-2 text-ink">
              {siteConfig.contact.phone}
            </a>
          </p>
        </nav>
      </div>
    </header>
  );
}
