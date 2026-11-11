import Link from "next/link";
import { AddTile, ImageTools } from "@/components/admin/about/inline-edit";
import { Pic, T } from "@/components/about/edit-kit";
import { Icon } from "@/components/icons";
import { BentoGallery } from "@/components/gallery";
import { Button, Container } from "@/components/ui";
import { ClipGrid } from "./ClipGrid";
import { cn } from "@/lib/utils";

/**
 * Các khối của trang chi tiết dịch vụ dùng chung cho website (/dich-vu/[slug]) và trang quản trị (truyền `edit`).
 * `s` = dịch vụ (đã gộp nội dung chỉnh được); `base` = đường dẫn nội dung của dịch vụ trong trang quản trị, vd. "items.2".
 */

/** Tiêu đề có vế nhấn màu cam; giữ liền các cụm từ ghép (không tách 2 dòng). */
const KEEP = [
  "Sản xuất",
  "video short",
  "doanh nghiệp,",
  "sự kiện.",
  "Chụp ảnh",
  "quảng cáo.",
  "Cho thuê",
  "bối cảnh.",
];
function Accent({ text, accent }) {
  const i = accent ? text.indexOf(accent) : -1;
  const keep = (str) => {
    // Bọc các cụm từ ghép bằng span không ngắt dòng
    const parts = [];
    let rest = str;
    while (rest) {
      let hit = null;
      for (const k of KEEP) {
        const j = rest.indexOf(k);
        if (j >= 0 && (!hit || j < hit.j)) hit = { j, k };
      }
      if (!hit) {
        parts.push(rest);
        break;
      }
      if (hit.j) parts.push(rest.slice(0, hit.j));
      parts.push(
        <span key={parts.length} className="whitespace-nowrap">
          {hit.k}
        </span>,
      );
      rest = rest.slice(hit.j + hit.k.length);
    }
    return parts;
  };
  if (i < 0) return keep(text);
  return (
    <>
      {keep(text.slice(0, i))}
      <span className="text-orange-500">{keep(accent)}</span>
    </>
  );
}

/* ── Giới thiệu dịch vụ: tiêu đề nêu tên dịch vụ + mô tả + 3 số liệu | cụm 3 ảnh ── */
// flush: bỏ khoảng đệm dưới để nối liền khối ngay sau (trang Cho thuê studio)
export function ServiceOverview({ s, className, flush = false, edit, base }) {
  const lead = s.accent
    ? s.headline.slice(0, s.headline.length - s.accent.length).trim()
    : s.headline;
  return (
    <section
      className={cn(flush ? "pt-16 pb-14 sm:pt-20 sm:pb-16 lg:pt-24" : "section-y", className)}
      data-nav-theme="light"
    >
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="reveal mb-4 eyebrow">Giới thiệu dịch vụ</p>
            <h2 className="reveal h-section text-balance" style={{ "--reveal-delay": "80ms" }}>
              {edit ? (
                <>
                  <T edit={edit} path={`${base}.overview.headlineLead`} value={lead} />{" "}
                  {s.accent && (
                    <span className="text-orange-500">
                      <T edit={edit} path={`${base}.overview.accent`} value={s.accent} />
                    </span>
                  )}
                </>
              ) : (
                <Accent text={s.headline} accent={s.accent} />
              )}
            </h2>
            <p
              className="reveal mt-5 text-base leading-relaxed text-ink-soft sm:text-lg"
              style={{ "--reveal-delay": "160ms" }}
            >
              <T edit={edit} path={`${base}.overview.description`} value={s.description} />
            </p>
            <dl
              className="reveal mt-8 grid max-w-lg grid-cols-3 gap-6 border-y border-ink/10 py-6"
              style={{ "--reveal-delay": "200ms" }}
            >
              {s.highlights.map((h, i) => (
                <div key={i} className="@container min-w-0">
                  {/* Cỡ chữ theo bề rộng cột (container query) → giá trị dài vẫn 1 dòng, không tràn */}
                  <dd className="text-[clamp(0.9rem,16.5cqi,1.875rem)] h-display whitespace-nowrap text-navy-900">
                    <T
                      edit={edit}
                      path={`${base}.overview.highlights.${i}.value`}
                      value={h.value}
                    />
                  </dd>
                  <dt className="mt-1 text-xs text-ink-muted">
                    <T
                      edit={edit}
                      path={`${base}.overview.highlights.${i}.label`}
                      value={h.label}
                    />
                  </dt>
                </div>
              ))}
            </dl>
            <div
              className="reveal btn-row mt-8 flex flex-wrap gap-3"
              style={{ "--reveal-delay": "260ms" }}
            >
              <Button pill data-booking={s.slug}>
                Liên hệ tư vấn
              </Button>
              <Button href="#bao-gia" variant="outline">
                Xem báo giá
              </Button>
            </div>
          </div>

          {/* Cụm ảnh: 1 ảnh cao + 2 ảnh */}
          <div className="relative grid h-[420px] grid-cols-[1.15fr_1fr] grid-rows-2 gap-4 sm:h-[520px]">
            {[0, 1, 2].map((k) => {
              // phần tử pool: đường dẫn ảnh, hoặc { src, pos } khi cần vị trí cắt riêng
              const p = s.pool[k];
              const src = typeof p === "string" ? p : p.src;
              const pos = typeof p === "string" ? "center" : p.pos;
              return (
                <div key={k} className={cn("group relative", k === 0 && "row-span-2")}>
                  <div
                    className={cn(
                      "reveal relative size-full overflow-hidden rounded-3xl bg-paper-200 shadow-card",
                      k === 0 && "shadow-soft",
                    )}
                    data-reveal="scale"
                    style={{ "--reveal-delay": `${k * 120}ms` }}
                  >
                    <Pic
                      edit={edit}
                      src={src}
                      alt=""
                      pos={pos}
                      sizes="(min-width: 1024px) 25vw, 50vw"
                      className={cn(
                        "object-cover",
                        !edit && "transition-transform duration-[1400ms] hover:scale-105",
                      )}
                    />
                  </div>
                  {edit && <ImageTools edit={edit} path={`${base}.overview.images.${k}`} />}
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ── Cho thuê studio: 4 điểm nổi bật — nối liền phần giới thiệu phía trên (cùng nền giấy, chỉ ngăn bằng
   1 đường kẻ mảnh), không tiêu đề: 4 cột canh giữa, icon nét lớn + tiêu đề + mô tả. Rê chuột: icon chuyển cam. ── */
export function ServiceFeatures({ s, edit, base }) {
  return (
    <section
      className="bg-paper pb-16 sm:pb-20 lg:pb-24"
      data-nav-theme="light"
      aria-label="Điểm nổi bật"
    >
      <Container>
        <ul className="grid gap-12 border-t border-ink/10 pt-14 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-4 lg:gap-x-12 lg:pt-16">
          {s.features.map((f, i) => (
            <li
              key={i}
              className="reveal group flex flex-col items-center text-center"
              style={{ "--reveal-delay": `${i * 90}ms` }}
            >
              <Icon
                name={f.icon}
                className="size-14 text-ink transition-[color,transform] duration-500 group-hover:-translate-y-1 group-hover:text-orange-500"
                strokeWidth={1.3}
              />
              <h3 className="mt-6 text-xl font-bold tracking-tight text-ink sm:text-[1.35rem]">
                <T edit={edit} path={`${base}.features.${i}.title`} value={f.title} />
              </h3>
              <p className="mt-3 max-w-xs text-center text-[15px] leading-relaxed text-ink-soft">
                <T edit={edit} path={`${base}.features.${i}.desc`} value={f.desc} />
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

/* ── Sản phẩm thực tế: clip (Drive) và/hoặc ảnh dự án theo từng dịch vụ ──
   Trang quản trị (edit): clip và ảnh xếp thành lưới để đổi ảnh bìa, đổi link Drive, thêm / xoá. */
export function ServiceWorks({ s, edit, base }) {
  const { works } = s;
  return (
    <section id="san-pham-thuc-te" className="bg-white section-y" data-nav-theme="light">
      <Container>
        <p className="reveal mb-4 eyebrow">Sản phẩm thực tế</p>
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="reveal h-section" style={{ "--reveal-delay": "80ms" }}>
            <T edit={edit} path={`${base}.works.title`} value={works.title} />
          </h2>
          <Link
            href="/san-pham"
            className="reveal group inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap hover:text-orange-500"
          >
            Xem tất cả sản phẩm
            <Icon
              name="arrowRight"
              className="size-4 transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>

        {edit ? (
          <div className="space-y-10">
            <div>
              <p className="mb-3 text-sm font-semibold text-ink">Clip video (link Google Drive)</p>
              <ul
                className={cn(
                  "grid grid-cols-2 gap-4 sm:grid-cols-3",
                  works.clips.every((c) => c.vertical) && "lg:grid-cols-4",
                )}
              >
                {works.clips.map((c, i) => (
                  <li
                    key={i}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl bg-navy-900 ring-1 ring-ink/10",
                      c.vertical ? "aspect-9/16" : "aspect-video",
                    )}
                  >
                    <Pic edit={edit} src={c.poster} alt="" pos="center" className="object-cover" />
                    <span className="absolute inset-0 bg-linear-to-t from-navy-950/80 via-navy-950/5 to-transparent" />
                    <span className="absolute inset-x-0 bottom-0 p-3 text-sm leading-snug font-semibold text-white">
                      <T edit={edit} path={`${base}.works.clips.${i}.title`} value={c.title} />
                      <button
                        type="button"
                        onClick={() =>
                          edit.setText(`${base}.works.clips.${i}.vertical`, !c.vertical)
                        }
                        className="mt-2 block rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-ink hover:bg-white"
                      >
                        {c.vertical ? "Khung dọc 9:16" : "Khung ngang 16:9"} · đổi
                      </button>
                    </span>
                    <ImageTools
                      edit={edit}
                      path={`${base}.works.clips.${i}.poster`}
                      hrefPath={`${base}.works.clips.${i}.link`}
                      hrefLabel="Link video trên Google Drive (đã chia sẻ công khai)"
                      hrefPlaceholder="https://drive.google.com/file/d/…/view"
                      hrefChip="Link video"
                      listPath={`${base}.works.clips`}
                      index={i}
                    />
                  </li>
                ))}
                <li
                  className={cn(
                    works.clips.some((c) => c.vertical) ? "aspect-9/16" : "aspect-video",
                  )}
                >
                  <AddTile
                    edit={edit}
                    listPath={`${base}.works.clips`}
                    label="Thêm clip"
                    className="h-full rounded-2xl"
                  />
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold text-ink">Ảnh dự án</p>
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {works.photos.map((src, i) => (
                  <li
                    key={i}
                    className="group relative aspect-4/3 overflow-hidden rounded-2xl bg-paper-200 ring-1 ring-ink/10"
                  >
                    <Pic edit={edit} src={src} alt="" pos="center" className="object-cover" />
                    <ImageTools
                      edit={edit}
                      path={`${base}.works.photos.${i}`}
                      listPath={`${base}.works.photos`}
                      index={i}
                    />
                  </li>
                ))}
                <li className="aspect-4/3">
                  <AddTile
                    edit={edit}
                    listPath={`${base}.works.photos`}
                    label="Thêm ảnh"
                    className="h-full rounded-2xl"
                  />
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            {works.clips?.length > 0 && <ClipGrid clips={works.clips} />}
            {works.photos?.length > 0 && (
              <div className={cn(works.clips?.length && "mt-12")}>
                <BentoGallery images={works.photos} name={s.title} />
              </div>
            )}
          </>
        )}
      </Container>
    </section>
  );
}
