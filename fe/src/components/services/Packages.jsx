import { AddTile, ImageTools } from "@/components/admin/about/inline-edit";
import { Pic, T } from "@/components/about/edit-kit";
import { Icon } from "@/components/icons";
import { Button, Container } from "@/components/ui";
import { getService } from "@/data/services";
import { servicesDefaults } from "@/data/services-content";
import { cn } from "@/lib/utils";

/**
 * Gói gợi ý (trang Dịch vụ): các dịch vụ kết hợp theo mục tiêu kinh doanh.
 * content: nội dung chỉnh được từ trang quản trị (mặc định = servicesDefaults.packages); edit: chế độ sửa trực tiếp.
 */
export function Packages({ content = servicesDefaults.packages, edit }) {
  return (
    <section className="bg-white section-y" data-nav-theme="light">
      <Container>
        <p className="reveal mb-4 eyebrow">
          <T edit={edit} path="packages.eyebrow" value={content.eyebrow} />
        </p>
        <div className="mb-12 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="reveal max-w-2xl h-section" style={{ "--reveal-delay": "80ms" }}>
            <T edit={edit} path="packages.title" value={content.title} />
          </h2>
          <p
            className="reveal max-w-md text-base leading-relaxed text-ink-soft"
            style={{ "--reveal-delay": "160ms" }}
          >
            <T edit={edit} path="packages.description" value={content.description} />
          </p>
        </div>

        <ul className="grid gap-5 lg:grid-cols-3">
          {content.items.map((p, i) => (
            <li
              key={i}
              className={cn(
                "reveal group relative flex flex-col overflow-hidden rounded-3xl ring-1 transition-all duration-500 hover:-translate-y-1 hover:shadow-soft",
                p.featured ? "bg-navy-950 text-white ring-navy-950" : "bg-paper ring-ink/5",
              )}
              style={{ "--reveal-delay": `${i * 110}ms` }}
            >
              <div className="relative aspect-16/9 overflow-hidden">
                <Pic
                  edit={edit}
                  src={p.image.src}
                  alt=""
                  pos={p.image.pos}
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className={cn(
                    "object-cover",
                    !edit && "transition-transform duration-[1200ms] group-hover:scale-105",
                  )}
                />
                <div className="absolute inset-0 bg-linear-to-t from-navy-950/70 to-transparent" />
                {p.featured && (
                  <span className="absolute top-4 left-4 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-semibold tracking-eyebrow text-white uppercase">
                    <T edit={edit} path="packages.popularLabel" value={content.popularLabel} />
                  </span>
                )}
                {/* Dịch vụ kết hợp */}
                <div className="absolute bottom-4 left-4 flex gap-1.5">
                  {p.services.map((slug) => {
                    const sv = getService(slug);
                    return (
                      <span
                        key={slug}
                        title={sv.title}
                        className="flex size-9 items-center justify-center rounded-full bg-white/90 text-navy-900"
                      >
                        <Icon name={sv.icon} className="size-4" />
                      </span>
                    );
                  })}
                </div>
                {edit && (
                  <ImageTools
                    edit={edit}
                    path={`packages.items.${i}.image`}
                    listPath="packages.items"
                    index={i}
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col p-6 sm:p-7">
                <h3 className="text-xl font-bold tracking-tight sm:text-2xl">
                  <T edit={edit} path={`packages.items.${i}.title`} value={p.title} />
                </h3>
                <p className={cn("mt-1 text-sm", p.featured ? "text-white/60" : "text-ink-muted")}>
                  <T edit={edit} path={`packages.items.${i}.goal`} value={p.goal} />
                </p>
                <ul className="mt-5 flex-1 space-y-2.5">
                  {p.includes.map((x, k) => (
                    <li key={k} className="flex items-start gap-2.5 text-sm">
                      <Icon
                        name="check"
                        className="mt-0.5 size-4 shrink-0 text-orange-500"
                        strokeWidth={2.5}
                      />
                      <span>
                        <T
                          edit={edit}
                          path={`packages.items.${i}.includes.${k}.text`}
                          value={x.text}
                        />
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  pill
                  variant={p.featured ? "white" : "primary"}
                  data-booking={p.services[0]}
                  className="mt-7 self-center"
                >
                  <T edit={edit} path="packages.ctaLabel" value={content.ctaLabel} />
                </Button>
              </div>
            </li>
          ))}
          {edit && (
            <li className="min-h-[360px]">
              <AddTile
                edit={edit}
                listPath="packages.items"
                label="Thêm gói"
                className="h-full min-h-[360px] rounded-3xl"
              />
            </li>
          )}
        </ul>
      </Container>
    </section>
  );
}
