import { SmartImage as Image } from "@/components/ui/SmartImage";
import { Icon } from "@/components/icons";
import LIBRARY from "@/data/media-library.json";
import { cn, pad } from "@/lib/utils";

/** Link nhúng trình phát Google Drive (file đã chia sẻ công khai). */
export const driveEmbed = (id) => `https://drive.google.com/file/d/${id}/preview`;

/**
 * Lưới clip sản phẩm thực tế — ảnh bìa + nút play; bấm → popup phát clip (VideoModal).
 * Clip đã nén & đưa lên Cloudinary (be: npm run media:showcase → src/data/media-library.json) → phát MP4
 * trực tiếp, sắc nét & nhanh; clip chưa có trong thư viện → dự phòng bằng trình phát nhúng của Drive.
 * Clip dọc (9:16) xếp 2 / 3 / 4 cột; clip ngang (16:9) xếp 1 / 2 / 3 cột; hàng cuối thiếu thẻ canh giữa.
 * clips: [{ id, title, poster, vertical }]
 */
export function ClipGrid({ clips, dark = false }) {
  const vertical = clips.every((c) => c.vertical);
  return (
    // flex-wrap + bề rộng cố định theo số cột (thay cho grid) → hàng cuối thiếu thẻ tự canh giữa
    <ul className="flex flex-wrap justify-center gap-3 sm:gap-5">
      {clips.map((c, i) => (
        <li
          key={c.id}
          className={cn(
            "reveal",
            vertical
              ? "w-[calc((100%-0.75rem)/2)] sm:w-[calc((100%-2.5rem)/3)] lg:w-[calc((100%-3.75rem)/4)]"
              : "w-full sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]",
          )}
          style={{ "--reveal-delay": `${(i % 4) * 80}ms` }}
        >
          <button
            type="button"
            data-video={LIBRARY[c.id] ? undefined : driveEmbed(c.id)}
            data-video-src={LIBRARY[c.id]?.url}
            data-video-poster={LIBRARY[c.id]?.poster}
            data-video-title={c.title}
            data-video-vertical={c.vertical ? "" : undefined}
            aria-label={`Xem video: ${c.title}`}
            className="group block w-full text-left"
          >
            <span
              className={cn(
                "relative block overflow-hidden rounded-2xl bg-navy-900 ring-1 transition-[box-shadow,transform] duration-500 group-hover:-translate-y-1 group-hover:shadow-soft",
                c.vertical ? "aspect-9/16" : "aspect-video",
                dark ? "ring-white/10" : "ring-ink/5",
              )}
            >
              <Image
                src={c.poster}
                alt=""
                fill
                sizes={
                  c.vertical
                    ? "(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw"
                    : "(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
                }
                className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-linear-to-t from-navy-950/80 via-navy-950/5 to-transparent" />
              <span className="absolute top-3 left-3 rounded bg-white/90 px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest text-navy-950">
                {pad(i + 1)}
              </span>
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-white/20 text-white ring-1 ring-white/40 backdrop-blur-sm transition-all duration-500 group-hover:scale-110 group-hover:bg-orange-500 group-hover:ring-orange-500">
                  <Icon name="play" className="ml-0.5 size-5" strokeWidth={0} fill="currentColor" />
                </span>
              </span>
              <span className="absolute inset-x-0 bottom-0 p-4 text-sm leading-snug font-semibold text-white">
                {c.title}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
