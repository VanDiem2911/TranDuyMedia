import { ZoomGroup, ZoomImage } from "@/components/gallery";
import { Button, Container } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Không gian sản xuất — mỗi room một khối (theo kiểu trang cho thuê studio phổ biến):
 * tiêu đề "ROOM · DIỆN TÍCH" canh giữa kẹp giữa 2 đường kẻ → loại phòng + 1 câu mô tả ngắn + nút đặt lịch
 * → lưới ảnh 3 cột cùng tỉ lệ, nhãn tên room ở góc phải ảnh. Bấm ảnh → xem lớn.
 * Hai room xen kẽ nền trắng / nền giấy để tách bạch.
 * rooms: [{ name, size, label, short, images[] }]
 */
export function StudioRooms({ rooms, slug }) {
  return (
    <div id="khong-gian">
      {rooms.map((r, i) => {
        const imgs = r.images
          .slice(0, 6)
          .map((src) => ({ src, alt: `${r.name} ${r.size} - ${r.label}` }));
        return (
          <section
            key={r.name}
            className={cn("section-y", i % 2 ? "bg-paper" : "bg-white")}
            data-nav-theme="light"
            aria-labelledby={`room-${i}`}
          >
            <Container>
              {/* Tiêu đề kẹp giữa 2 đường kẻ */}
              <div className="reveal flex items-center gap-5 sm:gap-8">
                <span className="h-px flex-1 bg-ink/15" />
                <h2
                  id={`room-${i}`}
                  className="text-center text-2xl h-display tracking-tight uppercase sm:text-4xl"
                >
                  {r.name} <span className="text-ink/25">·</span>{" "}
                  <span className="text-orange-500">{r.size}</span>
                </h2>
                <span className="h-px flex-1 bg-ink/15" />
              </div>

              {/* Ngắn gọn: loại phòng + 1 câu mô tả + nút đặt lịch → vào ảnh nhanh */}
              <div className="mx-auto mt-5 max-w-2xl text-center">
                <p
                  className="reveal text-sm font-semibold tracking-eyebrow text-ink-muted uppercase"
                  style={{ "--reveal-delay": "60ms" }}
                >
                  {r.label}
                </p>
                <p
                  className="reveal mt-2.5 text-center text-base leading-relaxed text-balance text-ink-soft sm:text-lg"
                  style={{ "--reveal-delay": "100ms" }}
                >
                  {r.short}
                </p>
                <div className="reveal mt-6" style={{ "--reveal-delay": "140ms" }}>
                  {/* data-booking-note: điền sẵn room vào ô mô tả của form đặt lịch */}
                  <Button
                    pill
                    data-booking={slug}
                    data-booking-note={`Thuê ${r.name} (${r.size}) - ${r.label}`}
                  >
                    Đặt lịch {r.name}
                  </Button>
                </div>
              </div>

              <ZoomGroup images={imgs}>
                <ul className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-5 lg:grid-cols-3 lg:gap-6">
                  {imgs.map((img, k) => (
                    <li
                      key={img.src}
                      className="reveal"
                      data-reveal="scale"
                      style={{ "--reveal-delay": `${(k % 3) * 80}ms` }}
                    >
                      <ZoomImage
                        index={k}
                        src={img.src}
                        alt={img.alt}
                        sizes="(min-width: 1024px) 30vw, 46vw"
                        className="aspect-4/3 w-full rounded-2xl bg-paper-200 shadow-card"
                      >
                        <span className="pointer-events-none absolute right-0 bottom-4 rounded-l-md bg-navy-950/80 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-white backdrop-blur-sm sm:bottom-5 sm:px-4 sm:text-xs">
                          {r.name} · {r.size}
                        </span>
                      </ZoomImage>
                    </li>
                  ))}
                </ul>
              </ZoomGroup>
            </Container>
          </section>
        );
      })}
    </div>
  );
}
