import { AddTile, ImageTools } from "@/components/admin/about/inline-edit";
import { Pic, T } from "@/components/about/edit-kit";
import { ZoomGroup, ZoomImage } from "@/components/gallery";
import { Button, Container } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Không gian sản xuất — mỗi room một khối (theo kiểu trang cho thuê studio phổ biến):
 * tiêu đề "ROOM · DIỆN TÍCH" canh giữa kẹp giữa 2 đường kẻ → loại phòng + 1 câu mô tả ngắn + nút đặt lịch
 * → lưới ảnh 3 cột cùng tỉ lệ, nhãn tên room ở góc phải ảnh. Bấm ảnh → xem lớn.
 * Hai room xen kẽ nền trắng / nền giấy để tách bạch.
 * rooms: [{ name, size, label, short, images[] }]
 * edit + base ("items.4"): trang quản trị — sửa chữ, thư mục ảnh, thêm / xoá / đổi ảnh từng room.
 */
export function StudioRooms({ rooms, slug, edit, base }) {
  return (
    <div id="khong-gian">
      {rooms.map((r, i) => {
        const imgs = r.images
          .slice(0, edit ? 12 : 6)
          .map((src) => ({ src, alt: `${r.name} ${r.size} - ${r.label}` }));
        const rp = `${base}.rooms.${i}`;
        return (
          <section
            key={i}
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
                  <T edit={edit} path={`${rp}.name`} value={r.name} />{" "}
                  <span className="text-ink/25">·</span>{" "}
                  <span className="text-orange-500">
                    <T edit={edit} path={`${rp}.size`} value={r.size} />
                  </span>
                </h2>
                <span className="h-px flex-1 bg-ink/15" />
              </div>

              {/* Ngắn gọn: loại phòng + 1 câu mô tả + nút đặt lịch → vào ảnh nhanh */}
              <div className="mx-auto mt-5 max-w-2xl text-center">
                <p
                  className="reveal text-sm font-semibold tracking-eyebrow text-ink-muted uppercase"
                  style={{ "--reveal-delay": "60ms" }}
                >
                  <T edit={edit} path={`${rp}.label`} value={r.label} />
                </p>
                <p
                  className="reveal mt-2.5 text-center text-base leading-relaxed text-balance text-ink-soft sm:text-lg"
                  style={{ "--reveal-delay": "100ms" }}
                >
                  <T edit={edit} path={`${rp}.short`} value={r.short} />
                </p>
                {edit && (
                  <p className="mt-3 text-xs break-all text-ink-muted">
                    Thư mục ảnh (Google Drive):{" "}
                    <T edit={edit} path={`${rp}.folder`} value={r.folder} />
                  </p>
                )}
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

              {edit ? (
                <ul className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-5 lg:grid-cols-3 lg:gap-6">
                  {imgs.map((img, k) => (
                    <li
                      key={k}
                      className="group relative aspect-4/3 overflow-hidden rounded-2xl bg-paper-200 shadow-card"
                    >
                      <Pic edit={edit} src={img.src} alt="" pos="center" className="object-cover" />
                      <ImageTools
                        edit={edit}
                        path={`${rp}.images.${k}`}
                        listPath={`${rp}.images`}
                        index={k}
                      />
                    </li>
                  ))}
                  <li className="aspect-4/3">
                    <AddTile
                      edit={edit}
                      listPath={`${rp}.images`}
                      label="Thêm ảnh"
                      className="h-full rounded-2xl"
                    />
                  </li>
                </ul>
              ) : (
                <ZoomGroup images={imgs}>
                  <ul className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:gap-5 lg:grid-cols-3 lg:gap-6">
                    {imgs.map((img, k) => (
                      <li
                        key={`${img.src}-${k}`}
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
              )}
            </Container>
          </section>
        );
      })}
    </div>
  );
}
