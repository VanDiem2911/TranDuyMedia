import Link from "next/link";
import { ImageTools } from "@/components/admin/about/inline-edit";
import { Pic, T } from "@/components/about/edit-kit";
import { Icon } from "@/components/icons";
import { Container } from "@/components/ui";
import { getService } from "@/data/services";
import { servicesDefaults } from "@/data/services-content";
import { cn } from "@/lib/utils";

/**
 * 5 dịch vụ chính (theo mẫu ButStudio): mỗi dịch vụ một hàng, ảnh dọc và chữ xen kẽ trái/phải
 * (editorial zig-zag), số thứ tự lớn mờ phía sau, các hạng mục + nút báo giá & xem chi tiết trang con.
 * content: nội dung chỉnh được từ trang quản trị (mặc định = servicesDefaults.list); edit: chế độ sửa trực tiếp.
 */
export function ServiceList({ content = servicesDefaults.list, edit }) {
  return (
    <section id="dich-vu-chinh" className="relative isolate overflow-hidden bg-paper section-y">
      <Container>
        <div className="max-w-2xl">
          <p className="reveal eyebrow">
            <T edit={edit} path="list.eyebrow" value={content.eyebrow} />
          </p>
          <h2 className="reveal mt-4 h-section" style={{ "--reveal-delay": "80ms" }}>
            <T edit={edit} path="list.title" value={content.title} />
          </h2>
        </div>

        <div className="mt-12 space-y-16 lg:mt-16 lg:space-y-24">
          {content.items.map((s, i) => {
            const flip = i % 2 === 1;
            const meta = getService(s.slug); // số thứ tự + biểu tượng gắn với trang con, không đổi
            const frame = cn(
              "reveal group relative mx-auto block aspect-4/5 w-full max-w-[440px] overflow-hidden rounded-[2rem] bg-paper-200 lg:mx-0",
              flip && "lg:ml-auto",
            );
            const photo = (
              <>
                <Pic
                  edit={edit}
                  src={s.image.src}
                  alt=""
                  pos={s.image.pos}
                  sizes="(min-width:1024px) 34vw, 90vw"
                  className={cn(
                    "object-cover",
                    !edit &&
                      "transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]",
                  )}
                />
                <span className="absolute top-5 left-5 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-semibold tracking-[0.25em] text-ink uppercase">
                  <Icon name={meta.icon} className="size-3.5" />
                  Dịch vụ {meta.number}
                </span>
              </>
            );
            return (
              <article
                key={s.slug}
                className={cn(
                  "relative grid items-center gap-10 lg:gap-16 xl:gap-20",
                  flip
                    ? "lg:grid-cols-[1.1fr_0.9fr] lg:[&>*:first-child]:order-2"
                    : "lg:grid-cols-[0.9fr_1.1fr]",
                )}
              >
                {/* Ảnh */}
                {edit ? (
                  <div className={frame} data-reveal="clip">
                    {photo}
                    <ImageTools edit={edit} path={`list.items.${i}.image`} />
                  </div>
                ) : (
                  <Link
                    href={`/dich-vu/${s.slug}`}
                    className={frame}
                    data-reveal="clip"
                    aria-label={s.title}
                  >
                    {photo}
                  </Link>
                )}

                {/* Chữ */}
                <div className="relative">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-24 -left-4 hidden text-[12rem] h-display leading-none text-ink/[0.05] select-none lg:block"
                  >
                    {meta.number}
                  </span>
                  <div className="relative">
                    <p className="reveal eyebrow">
                      <T edit={edit} path={`list.items.${i}.menuDesc`} value={s.menuDesc} />
                    </p>
                    <h3
                      className="reveal mt-3 text-[2rem] h-display sm:text-[2.5rem]"
                      style={{ "--reveal-delay": "80ms" }}
                    >
                      <T edit={edit} path={`list.items.${i}.title`} value={s.title} />
                    </h3>
                    <p
                      className="reveal mt-3 text-lg font-medium text-orange-600"
                      style={{ "--reveal-delay": "120ms" }}
                    >
                      <T edit={edit} path={`list.items.${i}.tagline`} value={s.tagline} />
                    </p>
                    <p
                      className="reveal mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft"
                      style={{ "--reveal-delay": "160ms" }}
                    >
                      <T edit={edit} path={`list.items.${i}.description`} value={s.description} />
                    </p>
                    <ul
                      className="reveal mt-6 grid gap-2.5 sm:grid-cols-2"
                      style={{ "--reveal-delay": "240ms" }}
                    >
                      {s.features.map((it, k) => (
                        <li key={k} className="flex items-start gap-2.5 text-sm text-ink">
                          <Icon
                            name="check"
                            className="mt-0.5 size-4 shrink-0 text-orange-500"
                            strokeWidth={2.5}
                          />
                          <span>
                            <T
                              edit={edit}
                              path={`list.items.${i}.features.${k}.text`}
                              value={it.text}
                            />
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div
                      className="reveal mt-8 flex flex-wrap gap-3"
                      style={{ "--reveal-delay": "320ms" }}
                    >
                      <button
                        type="button"
                        data-booking={s.slug}
                        className="group inline-flex items-center gap-2 rounded-full bg-navy-900 px-6 py-3 text-[13px] font-medium text-white transition hover:bg-navy-700"
                      >
                        <T edit={edit} path="list.quoteLabel" value={content.quoteLabel} />
                        <Icon
                          name="arrowRight"
                          className="size-4 transition-transform group-hover:translate-x-1"
                        />
                      </button>
                      <Link
                        href={`/dich-vu/${s.slug}`}
                        className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-6 py-3 text-[13px] font-medium text-ink transition hover:border-navy-900 hover:bg-navy-900 hover:text-white"
                      >
                        <T edit={edit} path="list.detailLabel" value={content.detailLabel} />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
