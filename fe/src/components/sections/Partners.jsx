import { AddTile, ImageTools } from "@/components/admin/about/inline-edit";
import { Pic, T } from "@/components/about/edit-kit";
import { SmartImage as Image } from "@/components/ui/SmartImage";
import { partners } from "@/data/partners";
import { PartnersTrack } from "./PartnersTrack";

/**
 * Dải "thương hiệu đã đồng hành" — nền cam nhạt, 1 dòng tiêu đề ngắn + logo đặt thẳng trên nền (không khung),
 * tự lướt ngang liên tục (máy tính: rê chuột → dừng, logo nở to + hiện tên; điện thoại: nhấn giữ → dừng & lướt tay,
 * thả ra → chạy tiếp — xem PartnersTrack). Ít chữ.
 * Theo feedback 02/11: đặt ở CUỐI trang, ngay trên dải "Bắt đầu dự án… cùng chúng tôi" của chân trang
 * (trang chủ, Về chúng tôi); trang dịch vụ đặt sau phần Sản phẩm thực tế.
 * Trang chủ truyền thêm `content` ({ title, items }) + `edit` (trang quản trị: logo xếp thành lưới để thêm / xoá / đổi).
 */
export function Partners({ content, edit }) {
  const title = content?.title ?? "Đối tác tiêu biểu đồng hành";
  const list = content
    ? content.items.map((p) => ({ name: p.name, logo: p.logo.src, w: p.w || 300, big: p.big }))
    : partners;
  // Một nửa track (12 thẻ) dài hơn khung 1920px → lặp 2 lần cho vòng liền mạch
  const row = [...list, ...list];

  return (
    <section
      className="relative overflow-hidden bg-[#fff1e6] pt-14 pb-8 sm:pt-16 sm:pb-10"
      data-nav-theme="light"
      aria-labelledby="partners-title"
    >
      <h2
        id="partners-title"
        className="reveal px-5 text-center text-xl font-bold tracking-tight text-balance text-navy-900 uppercase sm:text-2xl lg:text-[1.75rem]"
      >
        <T edit={edit} path="partners.title" value={title} />
      </h2>

      {edit ? (
        // Trang quản trị: logo xếp thành lưới để thấy, đổi, xoá, thêm cùng lúc
        <div className="mx-auto mt-8 grid max-w-6xl grid-cols-2 gap-4 px-5 pb-6 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((p, i) => (
            <div
              key={i}
              className="group relative flex h-36 flex-col items-center justify-center gap-2 rounded-2xl bg-white/70 p-3 ring-1 ring-ink/10"
            >
              <div className="relative h-16 w-full">
                <Pic
                  edit={edit}
                  src={p.logo}
                  alt={p.name}
                  pos="center"
                  sizes="240px"
                  className="object-contain"
                />
              </div>
              <span className="w-full truncate text-center text-[12px] font-semibold text-ink">
                <T edit={edit} path={`partners.items.${i}.name`} value={p.name} />
              </span>
              <ImageTools
                edit={edit}
                path={`partners.items.${i}.logo`}
                listPath="partners.items"
                index={i}
                crop={false}
              />
            </div>
          ))}
          <AddTile
            edit={edit}
            listPath="partners.items"
            label="Thêm đối tác"
            className="h-36 rounded-2xl"
          />
        </div>
      ) : (
        /* 2 mép mờ dần vào nền cho mềm */
        <div
          className="mt-6 [mask-image:linear-gradient(to_right,transparent,#000_7%,#000_93%,transparent)] sm:mt-8"
          aria-label="Thương hiệu đã đồng hành"
        >
          <PartnersTrack>
            {row.map((p, i) => (
              // ô bề rộng cố định thay cho gap → 2 nửa track nối nhau không bị lệch
              <li
                key={i}
                aria-hidden={i >= list.length ? "true" : undefined}
                draggable={false}
                className="group relative flex h-[110px] w-[170px] shrink-0 items-center justify-center sm:h-[150px] sm:w-[290px]"
              >
                <Image
                  src={p.logo}
                  alt={p.name}
                  width={p.w}
                  height={160}
                  sizes="240px"
                  className={`h-auto w-auto max-w-[130px] object-contain ${p.big ? "max-h-14 sm:max-h-[68px]" : "max-h-11 sm:max-h-[52px]"} opacity-85 transition-[opacity,transform,filter,scale,translate] duration-[1100ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:-translate-y-2 group-hover:scale-[1.3] group-hover:opacity-100 group-hover:drop-shadow-[0_10px_18px_rgba(15,20,32,0.18)] sm:max-w-[160px]`}
                />
                <span className="pointer-events-none absolute inset-x-2 bottom-1.5 translate-y-1 truncate text-center text-[12px] font-semibold text-ink opacity-0 transition-[opacity,translate,transform] delay-150 duration-700 ease-out group-hover:translate-y-0 group-hover:opacity-100 sm:bottom-3">
                  {p.name}
                </span>
              </li>
            ))}
          </PartnersTrack>
        </div>
      )}
    </section>
  );
}
