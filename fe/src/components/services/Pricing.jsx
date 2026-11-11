import { T } from "@/components/about/edit-kit";
import { Icon } from "@/components/icons";
import { Container } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Báo giá theo dịch vụ — 3 gói, gói nổi bật nền tối. Gói chưa có giá (price: null) hiện "Liên hệ báo giá".
 * Mỗi gói có nút nhận báo giá mở form đặt lịch, chọn sẵn dịch vụ (data-booking = slug).
 */
const NOTE =
  "Chi phí thay đổi theo thời lượng, số ngày quay và yêu cầu hậu kỳ — gửi báo giá chi tiết theo hạng mục trong 24 giờ.";

export function Pricing({
  slug,
  plans,
  title = "Báo giá tham khảo.",
  note = NOTE,
  children,
  className,
  edit, // chỉ trang quản trị truyền vào: chữ sửa trực tiếp
  base, // đường dẫn nội dung báo giá của dịch vụ, vd. "items.0.pricing"
}) {
  return (
    // className = màu nền thay cho nền giấy mặc định (vd. "bg-white")
    <section
      id="bao-gia"
      className={cn(className || "bg-paper", "section-y")}
      data-nav-theme="light"
    >
      <Container>
        <p className="reveal mb-4 eyebrow">Báo giá</p>
        <div className="mb-10 flex flex-col gap-5 lg:mb-12 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="reveal h-section" style={{ "--reveal-delay": "80ms" }}>
            <T edit={edit} path={`${base}.title`} value={title} />
          </h2>
          <p
            className="reveal max-w-md text-base leading-relaxed text-ink-soft"
            style={{ "--reveal-delay": "160ms" }}
          >
            <T edit={edit} path={`${base}.note`} value={note} />
          </p>
        </div>

        <ul className="grid gap-5 lg:grid-cols-3">
          {plans.map((p, i) => (
            <li
              key={i}
              className={cn(
                "reveal flex flex-col rounded-3xl p-7 ring-1 transition-all duration-500 hover:-translate-y-1 hover:shadow-soft sm:p-8",
                // Gói nổi bật: nền cam kem nhạt + viền cam (thay nền đen) — nổi bật mà vẫn hài hoà
                p.featured ? "bg-[#fff1e6] ring-2 ring-orange-500/70" : "bg-white ring-ink/5",
              )}
              style={{ "--reveal-delay": `${i * 100}ms` }}
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-xl font-bold tracking-tight sm:text-2xl">
                  <T edit={edit} path={`${base}.plans.${i}.name`} value={p.name} />
                </h3>
                {p.featured && (
                  <span className="shrink-0 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-semibold tracking-eyebrow text-white uppercase">
                    Phổ biến
                  </span>
                )}
              </div>
              <p className={cn("mt-1 text-sm", "text-ink-muted")}>
                <T edit={edit} path={`${base}.plans.${i}.desc`} value={p.desc} />
              </p>
              <p
                className={cn(
                  "mt-6 border-y py-5 text-2xl h-display sm:text-[1.75rem]",
                  p.featured
                    ? "border-orange-500/20 text-orange-600"
                    : "border-ink/10 text-navy-900",
                )}
              >
                {edit ? (
                  <T
                    edit={edit}
                    path={`${base}.plans.${i}.price`}
                    value={p.price ?? "Liên hệ báo giá"}
                  />
                ) : (
                  (p.price ?? "Liên hệ báo giá")
                )}
                {p.price && p.price !== "Liên hệ báo giá" && p.unit && (
                  <span className={cn("ml-1 text-sm font-medium", "text-ink-muted")}>{p.unit}</span>
                )}
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {p.includes.map((x, k) => (
                  <li key={k} className="flex items-start gap-2.5 text-[15px]">
                    <Icon
                      name="check"
                      className="mt-0.5 size-4 shrink-0 text-orange-500"
                      strokeWidth={2.5}
                    />
                    <span>
                      <T edit={edit} path={`${base}.plans.${i}.includes.${k}`} value={x} />
                    </span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                data-booking={slug}
                className={cn(
                  "group mt-8 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition",
                  p.featured
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "bg-navy-900 text-white hover:bg-navy-700",
                )}
              >
                Nhận báo giá
                <Icon
                  name="arrowRight"
                  className="size-4 transition-transform group-hover:translate-x-1"
                />
              </button>
            </li>
          ))}
        </ul>
        {children}
      </Container>
    </section>
  );
}
