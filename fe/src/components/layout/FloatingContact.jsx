"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { siteConfig } from "@/config/site";
import { subscribeScroll } from "@/lib/scroll";
import { cn } from "@/lib/utils";

// Cụm nút chat nhanh: Messenger / Zalo / Gọi — hiện sau khi cuộn qua nửa hero.
export function FloatingContact({ site = siteConfig }) {
  const [show, setShow] = useState(false);

  // Kênh scroll chung (đồng bộ Lenis); chỉ setState khi trạng thái thực sự đổi
  useEffect(() => {
    let last = null;
    return subscribeScroll(() => {
      const next = window.scrollY > window.innerHeight * 0.5;
      if (next !== last) setShow((last = next));
    });
  }, []);

  const items = [
    {
      href: site.socials.messenger,
      label: "Chat Messenger",
      icon: "messenger",
      cls: "bg-[linear-gradient(135deg,#00B2FF_0%,#006AFF_100%)]",
      iconCls: "size-[22px]",
    },
    {
      href: site.socials.zalo,
      label: "Chat Zalo",
      // Widget chuẩn Zalo: nút tròn xanh #0068FF, chữ "Zalo" trắng ở giữa
      icon: "zaloText",
      cls: "bg-[#0068FF]",
      iconCls: "h-[11px] w-[30px]",
    },
    {
      href: site.contact.phoneHref,
      label: `Gọi ${site.contact.phone}`,
      icon: "phone",
      cls: "bg-orange-500",
      iconCls: "size-5",
      tel: true,
      pulse: true,
    },
  ];

  return (
    <div
      className={cn(
        // Khung bao rộng sang trái để chứa nhãn ẩn → tắt nhận chuột cho chúng, chỉ nút tròn bắt chuột
        "pointer-events-none fixed right-3 bottom-3 z-40 flex flex-col gap-2 transition-all duration-500 sm:right-4 sm:bottom-4 sm:gap-2.5",
        show ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
      )}
    >
      {items.map(({ href, label, icon, cls, iconCls, tel, pulse }) => (
        <a
          key={label}
          href={href}
          target={tel ? undefined : "_blank"}
          rel={tel ? undefined : "noopener noreferrer"}
          aria-label={label}
          className="group pointer-events-none flex items-center justify-end gap-3"
        >
          <span className="pointer-events-none translate-x-2 rounded-full bg-navy-900 px-3 py-1.5 text-xs whitespace-nowrap text-white opacity-0 shadow-card transition-all group-hover:translate-x-0 group-hover:opacity-100">
            {label}
          </span>
          <span className="relative flex size-11 items-center justify-center">
            {pulse && (
              <span
                className="pointer-events-none absolute inset-0 [animation:ripple_3s_ease-out_infinite] rounded-full bg-orange-500/50"
                aria-hidden="true"
              />
            )}
            <span
              className={cn(
                "relative flex size-11 items-center justify-center rounded-full text-white shadow-soft transition-transform group-hover:scale-105",
                show && "pointer-events-auto",
                cls,
              )}
            >
              <Icon name={icon} className={iconCls} />
            </span>
          </span>
        </a>
      ))}
    </div>
  );
}
