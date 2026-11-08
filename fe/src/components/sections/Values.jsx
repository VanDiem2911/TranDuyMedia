import { ImageTools } from "@/components/admin/about/inline-edit";
import { Pic, T } from "@/components/about/edit-kit";
import { Container } from "@/components/ui";
import { values } from "@/data/services";
import { cn } from "@/lib/utils";

const CORNERS = [
  "top-3 left-3 border-t-2 border-l-2",
  "top-3 right-3 border-t-2 border-r-2",
  "bottom-3 left-3 border-b-2 border-l-2",
  "bottom-3 right-3 border-b-2 border-r-2",
];

/**
 * USP "Uy tín – Tối ưu chi phí – Tận tâm" (feedback 02/11) dạng một DẢI PHIM: hàng lỗ răng cưa trên/dưới,
 * 3 khung hình là ảnh hậu trường thật, nhãn kiểu bảng clapper (SCENE · TAKE).
 * Rê chuột: ảnh trắng-đen → màu, 4 góc khung ngắm cam hiện ra, ● REC nhấp nháy (đồng bộ màn chào).
 * Dùng chung: trang Về chúng tôi ("Khách hàng tin tưởng…") và "3 thế mạnh" ở trang dịch vụ.
 */
export function Values({
  eyebrow = "Vì sao chọn chúng tôi",
  description = "Ba giá trị chúng tôi giữ trong mọi khung hình — từ buổi trao đổi đầu tiên đến file bàn giao cuối cùng.",
  titleLead = "Uy tín. Tối ưu chi phí.",
  titleAccent = "Tận tâm.",
  items = values,
  className,
  edit, // chỉ trang quản trị truyền vào: chữ + ảnh sửa trực tiếp (xem components/admin/about)
}) {
  return (
    <section
      className={cn("grain relative overflow-hidden bg-navy-950 text-white", className)}
      data-nav-theme="dark"
    >
      <Container className="relative py-16 sm:py-20">
        <p className="reveal mb-4 eyebrow">
          <T edit={edit} path="values.eyebrow" value={eyebrow} />
        </p>
        {/* Mô tả canh giữa theo chiều cao tiêu đề */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="reveal h-section" style={{ "--reveal-delay": "80ms" }}>
            <T edit={edit} path="values.titleLead" value={titleLead} />{" "}
            <span className="text-orange-500">
              <T edit={edit} path="values.titleAccent" value={titleAccent} />
            </span>
          </h2>
          <p
            className="reveal max-w-sm text-base leading-relaxed text-white/65"
            style={{ "--reveal-delay": "160ms" }}
          >
            <T edit={edit} path="values.description" value={description} />
          </p>
        </div>

        {/* Dải phim */}
        <div
          className="reveal mt-10 rounded-2xl bg-black/55 px-3 ring-1 ring-white/10 sm:px-4"
          data-reveal="clip"
        >
          <div aria-hidden="true" className="h-6 sprockets" />
          <ul className="grid gap-3 sm:gap-4 md:grid-cols-3">
            {items.map((v, i) => (
              <li
                key={v.title}
                className="group relative aspect-4/3 overflow-hidden rounded-md bg-navy-900 md:aspect-16/10"
              >
                <Pic
                  edit={edit}
                  src={v.image}
                  alt=""
                  sizes="(min-width: 768px) 33vw, 100vw"
                  pos={v.imagePos}
                  className="object-cover grayscale transition-[transform,filter] duration-[1200ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-105 group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-linear-to-t from-navy-950 via-navy-950/60 to-navy-950/20" />

                {/* Góc khung ngắm — hiện khi rê chuột */}
                {CORNERS.map((c) => (
                  <span
                    key={c}
                    aria-hidden="true"
                    className={`absolute size-5 border-orange-500 opacity-0 transition-all duration-500 group-hover:opacity-100 ${c}`}
                  />
                ))}

                {/* Nhãn clapper */}
                <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5 text-[10px] font-semibold tracking-[0.25em] uppercase">
                  <span className="rounded-sm bg-white px-2 py-1 text-navy-950">
                    Scene 0{i + 1}
                  </span>
                  <span className="flex items-center gap-1.5 text-white/70">
                    <span className="size-1.5 rounded-full bg-white/40 group-hover:animate-[introBlink_1s_steps(2,start)_infinite] group-hover:bg-red-500" />
                    Take 1
                  </span>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <h3 className="flex items-center gap-3 text-2xl font-bold tracking-tight sm:text-[1.7rem]">
                    <span className="h-0.5 w-6 bg-orange-500 transition-all duration-500 group-hover:w-10" />
                    <T edit={edit} path={`values.items.${i}.title`} value={v.title} />
                  </h3>
                  <p className="mt-2 text-left text-sm leading-relaxed text-white/75">
                    <T edit={edit} path={`values.items.${i}.desc`} value={v.desc} />
                  </p>
                </div>
                {edit && <ImageTools edit={edit} path={`values.items.${i}.image`} />}
              </li>
            ))}
          </ul>
          <div aria-hidden="true" className="h-6 sprockets" />
        </div>
      </Container>
    </section>
  );
}
