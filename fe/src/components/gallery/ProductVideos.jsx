import { SmartImage as Image } from "@/components/ui/SmartImage";
import { Icon } from "@/components/icons";
import { cn, pad } from "@/lib/utils";

/**
 * Thư viện của sản phẩm CHỈ CÓ VIDEO — thẻ video cỡ lớn (bấm → popup phát video, VideoModal / data-video-src):
 * - Video ngang: 1 video → trải trọn khung; nhiều video → 2 cột.
 * - Video dọc (9:16): 2 cột (điện thoại) → 3 cột → 4 cột; hàng cuối thiếu thẻ tự canh giữa.
 * images: media của sản phẩm (type "video" | "embed", có url + poster + width/height)
 */
export function ProductVideos({ images, name }) {
  const videos = images.filter((m) => m.type !== "image");
  const vertical = videos.every((v) => v.width && v.height && v.height > v.width);
  const single = videos.length === 1;
  return (
    <ul className="flex flex-wrap justify-center gap-4 sm:gap-6">
      {videos.map((v, i) => (
        <li
          key={v.url}
          className={cn(
            "reveal",
            vertical
              ? "w-[calc((100%-1rem)/2)] sm:w-[calc((100%-3rem)/3)] lg:w-[calc((100%-4.5rem)/4)]"
              : single
                ? "w-full max-w-5xl"
                : "w-full md:w-[calc((100%-1.5rem)/2)]",
          )}
          style={{ "--reveal-delay": `${(i % 4) * 80}ms` }}
        >
          <button
            type="button"
            {...(v.type === "video"
              ? { "data-video-src": v.url, "data-video-poster": v.poster }
              : { "data-video": v.url })}
            data-video-title={`${name} — ${pad(i + 1)}`}
            data-video-vertical={vertical ? "" : undefined}
            aria-label={`Xem video ${i + 1}: ${name}`}
            className="group block w-full text-left"
          >
            <span
              className={cn(
                "relative block overflow-hidden rounded-2xl bg-navy-900 shadow-card ring-1 ring-ink/5 transition-[box-shadow,transform] duration-500 group-hover:-translate-y-1 group-hover:shadow-soft",
                vertical ? "aspect-9/16" : "aspect-video",
              )}
            >
              {v.src && (
                <Image
                  src={v.src}
                  alt=""
                  fill
                  sizes={
                    vertical
                      ? "(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw"
                      : single
                        ? "(min-width: 1024px) 64rem, 100vw"
                        : "(min-width: 768px) 46vw, 100vw"
                  }
                  className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-105"
                />
              )}
              <span className="absolute inset-0 bg-linear-to-t from-navy-950/70 via-transparent to-transparent" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span
                  className={cn(
                    "flex items-center justify-center rounded-full bg-white/90 text-navy-900 shadow-soft transition-all duration-500 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white",
                    single && !vertical ? "size-20 sm:size-24" : "size-14 sm:size-16",
                  )}
                >
                  <Icon
                    name="play"
                    className="ml-1 size-6 sm:size-7"
                    strokeWidth={0}
                    fill="currentColor"
                  />
                </span>
              </span>
              <span className="absolute bottom-3 left-3 rounded bg-white/90 px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest text-navy-950 sm:bottom-4 sm:left-4">
                {pad(i + 1)}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
