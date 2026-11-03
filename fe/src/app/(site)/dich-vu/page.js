import { SmartImage as Image } from "@/components/ui/SmartImage";
import { Icon } from "@/components/icons";
import { Journey, ServiceList, ServicesHero } from "@/components/services";
import { Button, Container } from "@/components/ui";
import { Faq } from "@/components/sections";
import { getService, packages } from "@/data/services";
import { createMetadata } from "@/lib/metadata";
import { cn } from "@/lib/utils";

export const metadata = createMetadata({
  title: "Dịch vụ sản xuất video & hình ảnh",
  description:
    "Sản xuất video short marketing, iTVC & viral, phim doanh nghiệp & sự kiện, chụp ảnh quảng cáo và cho thuê studio (Room 24m² & 150m²) — một ekip, trọn gói.",
  path: "/dich-vu",
  image: "/images/bts/bts-02.webp",
});

/**
 * Trang tổng hợp dịch vụ (bố cục theo trang Dịch vụ của ButStudio):
 * Hero (chữ + 3 ảnh so le) → Hành trình 7 bước (nền tối, cột ảnh nở rộng) → 5 dịch vụ zig-zag
 * (dẫn tới trang con /dich-vu/[slug]) → Gói gợi ý → FAQ. CTA cuối trang nằm ở footer.
 */
export default function ServicesPage() {
  return (
    <>
      <ServicesHero />
      <Journey />
      <ServiceList />

      {/* Gói gợi ý */}
      <section className="bg-white section-y" data-nav-theme="light">
        <Container>
          <p className="reveal mb-4 eyebrow">Gói gợi ý</p>
          <div className="mb-12 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="reveal max-w-2xl h-section" style={{ "--reveal-delay": "80ms" }}>
              Kết hợp dịch vụ theo mục tiêu kinh doanh.
            </h2>
            <p
              className="reveal max-w-md text-base leading-relaxed text-ink-soft"
              style={{ "--reveal-delay": "160ms" }}
            >
              Ba cách SME & Startup thường bắt đầu với chúng tôi. Mọi gói đều tuỳ chỉnh được theo
              ngân sách.
            </p>
          </div>

          <ul className="grid gap-5 lg:grid-cols-3">
            {packages.map((p, i) => (
              <li
                key={p.title}
                className={cn(
                  "reveal group flex flex-col overflow-hidden rounded-3xl ring-1 transition-all duration-500 hover:-translate-y-1 hover:shadow-soft",
                  p.featured ? "bg-navy-950 text-white ring-navy-950" : "bg-paper ring-ink/5",
                )}
                style={{ "--reveal-delay": `${i * 110}ms` }}
              >
                <div className="relative aspect-16/9 overflow-hidden">
                  <Image
                    src={p.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                    style={{ objectPosition: p.pos }}
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-navy-950/70 to-transparent" />
                  {p.featured && (
                    <span className="absolute top-4 left-4 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-semibold tracking-eyebrow text-white uppercase">
                      Phổ biến nhất
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
                </div>
                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <h3 className="text-xl font-bold tracking-tight sm:text-2xl">{p.title}</h3>
                  <p
                    className={cn("mt-1 text-sm", p.featured ? "text-white/60" : "text-ink-muted")}
                  >
                    {p.goal}
                  </p>
                  <ul className="mt-5 flex-1 space-y-2.5">
                    {p.includes.map((x) => (
                      <li key={x} className="flex items-start gap-2.5 text-sm">
                        <Icon
                          name="check"
                          className="mt-0.5 size-4 shrink-0 text-orange-500"
                          strokeWidth={2.5}
                        />
                        {x}
                      </li>
                    ))}
                  </ul>
                  <Button
                    pill
                    variant={p.featured ? "white" : "primary"}
                    data-booking={p.services[0]}
                    className="mt-7 self-center"
                  >
                    Tư vấn gói này
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <Faq />
    </>
  );
}
