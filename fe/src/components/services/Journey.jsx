"use client";

import { useState } from "react";
import { SmartImage as Image } from "@/components/ui/SmartImage";
import { Container } from "@/components/ui";
import { processSteps } from "@/data/services";
import { cn } from "@/lib/utils";

/**
 * Hành trình sản xuất (nền tối, theo mẫu ButStudio): desktop là các cột ảnh, bước đang chọn nở rộng
 * và hiện mô tả (rê chuột / chạm / Tab để đổi); bước thu gọn hiện tên xoay dọc.
 * Mobile: danh sách dọc có đường nối và số thứ tự.
 */
export function Journey() {
  const [active, setActive] = useState(0);

  return (
    <section
      data-nav-theme="dark"
      className="grain relative flex screen items-center overflow-hidden bg-navy-950 py-16 text-white"
    >
      <div className="pointer-events-none absolute top-1/3 -left-32 size-[480px] rounded-full bg-orange-500/15 blur-[150px]" />
      <Container className="relative">
        <p className="reveal mb-4 eyebrow">Quy trình sản xuất</p>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="reveal max-w-xl h-section" style={{ "--reveal-delay": "80ms" }}>
            Bảy bước, từ <span className="whitespace-nowrap">tiếp nhận</span>{" "}
            <span className="whitespace-nowrap text-orange-500">đến bàn giao.</span>
          </h2>
          <p
            className="reveal hidden max-w-xs text-sm text-white/60 lg:block"
            style={{ "--reveal-delay": "200ms" }}
          >
            Rê chuột qua từng bước để xem chúng tôi làm gì ở mỗi giai đoạn.
          </p>
        </div>

        {/* Desktop: các cột, cột đang chọn rộng hơn */}
        <div className="reveal mt-10 hidden gap-3 lg:flex" style={{ "--reveal-delay": "250ms" }}>
          {processSteps.map((s, i) => {
            const on = active === i;
            return (
              <button
                key={s.step}
                type="button"
                onPointerEnter={(e) => e.pointerType === "mouse" && setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                aria-expanded={on}
                className={cn(
                  "relative h-[calc(var(--screen)*0.56)] min-h-[380px] overflow-hidden rounded-3xl text-left transition-[flex] duration-[800ms] ease-out",
                  on ? "flex-[4]" : "flex-1",
                )}
              >
                <Image
                  src={s.image}
                  alt=""
                  fill
                  sizes="(min-width:1024px) 45vw, 100vw"
                  className={cn(
                    "object-cover transition-transform duration-[1400ms] ease-out",
                    on ? "scale-100" : "scale-110 grayscale",
                  )}
                  style={{ objectPosition: s.imagePos }}
                />
                <div className="absolute inset-0 bg-linear-to-t from-navy-950/95 via-navy-950/35 to-navy-950/15" />
                <span
                  className={cn(
                    "absolute top-5 left-5 flex size-11 items-center justify-center rounded-full border text-sm font-semibold tabular-nums transition-colors duration-500",
                    on ? "border-orange-500 bg-orange-500" : "border-white/40 bg-navy-950/40",
                  )}
                >
                  {s.step}
                </span>
                {/* tên bước xoay dọc khi thu gọn */}
                <span
                  className={cn(
                    "absolute bottom-7 left-1/2 -translate-x-1/2 rotate-180 text-lg font-semibold whitespace-nowrap transition-all duration-500 [writing-mode:vertical-rl] xl:text-xl",
                    on ? "pointer-events-none opacity-0" : "opacity-100",
                  )}
                >
                  {s.title}
                </span>
                <div
                  className={cn(
                    "absolute inset-x-0 bottom-0 p-7 transition-all duration-700",
                    on ? "translate-y-0 opacity-100 delay-200" : "translate-y-6 opacity-0",
                  )}
                >
                  <h3 className="text-3xl font-bold tracking-tight">{s.title}</h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-white/80">{s.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Mobile: danh sách dọc có đường nối */}
        <ol className="relative mt-10 space-y-8 border-l border-white/15 pl-8 lg:hidden">
          {processSteps.map((s) => (
            <li key={s.step} className="reveal relative">
              <span className="absolute top-0 -left-[2.55rem] flex size-9 items-center justify-center rounded-full border border-white/40 bg-navy-950 text-xs font-semibold tabular-nums">
                {s.step}
              </span>
              <div className="relative mb-4 aspect-4/3 w-full overflow-hidden rounded-2xl">
                <Image
                  src={s.image}
                  alt=""
                  fill
                  sizes="90vw"
                  className="object-cover"
                  style={{ objectPosition: s.imagePos }}
                />
              </div>
              <h3 className="text-2xl font-bold tracking-tight">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-white/75">{s.desc}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
