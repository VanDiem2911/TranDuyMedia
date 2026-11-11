"use client";

import { useState } from "react";
import { AddTile, ImageTools } from "@/components/admin/about/inline-edit";
import { Pic, T } from "@/components/about/edit-kit";
import { Container } from "@/components/ui";
import { SmartImage as Image } from "@/components/ui/SmartImage";
import { processSteps } from "@/data/services";
import { servicesDefaults } from "@/data/services-content";
import { cn, pad } from "@/lib/utils";

// Trang chi tiết dịch vụ dùng nội dung gốc (7 bước trong data/services.js); trang Dịch vụ truyền nội dung chỉnh được
const DEFAULT_CONTENT = {
  ...servicesDefaults.journey,
  steps: processSteps.map((s) => ({
    title: s.title,
    desc: s.desc,
    image: { src: s.image, pos: s.imagePos },
  })),
};

/**
 * Hành trình sản xuất (nền tối, theo mẫu ButStudio): desktop là các cột ảnh, bước đang chọn nở rộng
 * và hiện mô tả (rê chuột / chạm / Tab để đổi); bước thu gọn hiện tên xoay dọc.
 * Mobile: danh sách dọc có đường nối và số thứ tự.
 * content: nội dung chỉnh được từ trang quản trị; edit: chế độ sửa (các bước xếp thành lưới để thêm / xoá / đổi ảnh).
 */
export function Journey({ content = DEFAULT_CONTENT, edit }) {
  const [active, setActive] = useState(0);
  const steps = content.steps.map((s, i) => ({ ...s, step: pad(i + 1) }));

  return (
    <section
      data-nav-theme="dark"
      className="grain relative flex screen items-center overflow-hidden bg-navy-950 py-16 text-white"
    >
      <div className="pointer-events-none absolute top-1/3 -left-32 size-[480px] rounded-full bg-orange-500/15 blur-[150px]" />
      <Container className="relative">
        <p className="reveal mb-4 eyebrow">
          <T edit={edit} path="journey.eyebrow" value={content.eyebrow} />
        </p>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="reveal max-w-xl h-section" style={{ "--reveal-delay": "80ms" }}>
            <T edit={edit} path="journey.titleLead" value={content.titleLead} />{" "}
            <span className="text-orange-500">
              <T edit={edit} path="journey.titleAccent" value={content.titleAccent} />
            </span>
          </h2>
          <p
            className="reveal hidden max-w-xs text-sm text-white/60 lg:block"
            style={{ "--reveal-delay": "200ms" }}
          >
            <T edit={edit} path="journey.hint" value={content.hint} />
          </p>
        </div>

        {edit ? (
          // Trang quản trị: các bước xếp thành lưới để thấy, sửa, thêm, xoá cùng lúc
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div
                key={i}
                className="group relative aspect-4/5 overflow-hidden rounded-2xl bg-navy-900 ring-1 ring-white/10"
              >
                <Pic
                  edit={edit}
                  src={s.image.src}
                  alt=""
                  pos={s.image.pos}
                  sizes="25vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-navy-950/95 via-navy-950/40 to-navy-950/15" />
                <span className="absolute top-4 left-4 flex size-10 items-center justify-center rounded-full bg-orange-500 text-sm font-semibold tabular-nums">
                  {s.step}
                </span>
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="text-xl font-bold tracking-tight">
                    <T edit={edit} path={`journey.steps.${i}.title`} value={s.title} />
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/80">
                    <T edit={edit} path={`journey.steps.${i}.desc`} value={s.desc} />
                  </p>
                </div>
                <ImageTools
                  edit={edit}
                  path={`journey.steps.${i}.image`}
                  listPath="journey.steps"
                  index={i}
                />
              </div>
            ))}
            <AddTile
              edit={edit}
              listPath="journey.steps"
              label="Thêm bước"
              className="aspect-4/5 rounded-2xl border-white/25 text-white/80 hover:border-orange-500 hover:text-white"
            />
          </div>
        ) : (
          <>
            {/* Desktop: các cột, cột đang chọn rộng hơn */}
            <div
              className="reveal mt-10 hidden gap-3 lg:flex"
              style={{ "--reveal-delay": "250ms" }}
            >
              {steps.map((s, i) => {
                const on = active === i;
                return (
                  <button
                    key={i}
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
                      src={s.image.src}
                      alt=""
                      fill
                      sizes="(min-width:1024px) 45vw, 100vw"
                      className={cn(
                        "object-cover transition-transform duration-[1400ms] ease-out",
                        on ? "scale-100" : "scale-110 grayscale",
                      )}
                      style={{ objectPosition: s.image.pos }}
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
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-white/80">
                        {s.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Mobile: danh sách dọc có đường nối */}
            <ol className="relative mt-10 space-y-8 border-l border-white/15 pl-8 lg:hidden">
              {steps.map((s, i) => (
                <li key={i} className="reveal relative">
                  <span className="absolute top-0 -left-[2.55rem] flex size-9 items-center justify-center rounded-full border border-white/40 bg-navy-950 text-xs font-semibold tabular-nums">
                    {s.step}
                  </span>
                  <div className="relative mb-4 aspect-4/3 w-full overflow-hidden rounded-2xl">
                    <Image
                      src={s.image.src}
                      alt=""
                      fill
                      sizes="90vw"
                      className="object-cover"
                      style={{ objectPosition: s.image.pos }}
                    />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight">{s.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/75">{s.desc}</p>
                </li>
              ))}
            </ol>
          </>
        )}
      </Container>
    </section>
  );
}
