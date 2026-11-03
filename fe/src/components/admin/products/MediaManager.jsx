"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { detectSmartPos } from "@/lib/smart-focal";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { OversizeDialog } from "./OversizeDialog";
import { VideoPreview } from "./VideoPreview";
import {
  ACCEPT,
  captureFrames,
  checkFile,
  guessLinkType,
  MAX_FILES,
  MAX_IMAGE_MB,
  MAX_VIDEO_MB,
  newKey,
  oversize,
  parseEmbed,
  playUrl,
  previewOf,
} from "./media-utils";

const TYPE_LABEL = { image: "Ảnh", video: "Video", embed: "Link video" };

/**
 * Quản lý ảnh & video của sản phẩm:
 * - Kéo-thả hoặc bấm để chọn tệp từ máy (nhiều tệp một lúc).
 * - Dán link ảnh / video / YouTube / Vimeo / Google Drive.
 * - Kéo thả thẻ để sắp xếp thứ tự trong thư viện.
 * - Ảnh bìa & ảnh nổi bật chọn RIÊNG ở CoverPicker (không còn phụ thuộc thứ tự thư viện).
 * Tệp chỉ được tải lên khi bấm "Lưu" (xem jobs.js).
 */
export function MediaManager({ items, onChange, error }) {
  const input = useRef(null);
  const [link, setLink] = useState("");
  const [over, setOver] = useState(false);
  const [dragKey, setDragKey] = useState(null);
  const [playKey, setPlayKey] = useState(null);
  const [tooBig, setTooBig] = useState(null); // tệp quá nặng → hộp thoại gợi ý dán link Drive / YouTube
  const linkInput = useRef(null);
  const playItem = playKey && items.find((m) => m.key === playKey);
  const commit = (list) => onChange(list);

  // Bản sao mới nhất của danh sách + các ảnh người dùng ĐÃ cắt tay — để cơ chế tự căn chỉnh
  // chạy nền bên dưới không bao giờ ghi đè lựa chọn thủ công.
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);
  const manualCropKeys = useRef(new Set());

  /**
   * Tự căn chỉnh ảnh bìa cho ảnh VỪA thêm: tìm vùng chủ thể rồi đặt sẵn pos (thay căn giữa),
   * người dùng vẫn cắt tay lại được như thường. Chạy nền, không chặn thao tác; ảnh đã bị gỡ
   * hoặc đã được cắt tay trong lúc phân tích thì bỏ qua.
   */
  const autoFit = (item) => {
    if (item.type !== "image") return;
    detectSmartPos(previewOf(item)).then((pos) => {
      if (!pos || manualCropKeys.current.has(item.key)) return;
      const list = itemsRef.current;
      const cur = list.find((m) => m.key === item.key);
      if (cur && cur.pos === "center" && !cur.zoom) {
        onChange(list.map((m) => (m.key === item.key ? { ...m, pos } : m)));
      }
    });
  };

  /**
   * Video vừa chọn từ máy → TỰ ĐỘNG chụp 3 cảnh (tải lên cùng video khi bấm Lưu): cảnh đầu làm ảnh đại diện,
   * 2 cảnh sau (frames) cho ảnh nổi bật / ảnh bìa ghép; kèm kích thước + thời lượng thật.
   */
  const autoPoster = (item) => {
    captureFrames(item.preview).then((r) => {
      const list = itemsRef.current;
      if (!list.some((m) => m.key === item.key)) return;
      // Không chụp được (định dạng lạ…) → bỏ cờ "đang chụp", Cloudinary tự tạo ảnh đại diện khi lưu
      if (!r) {
        onChange(list.map((m) => (m.key === item.key ? { ...m, capturing: false } : m)));
        return;
      }
      const base = item.name.replace(/\.[^.]+$/, "");
      const [posterFile, ...frameFiles] = r.blobs.map(
        (b, i) =>
          new File([b], `${base}-${i ? `canh-${i}` : "poster"}.jpg`, { type: "image/jpeg" }),
      );
      onChange(
        list.map((m) =>
          m.key === item.key
            ? {
                ...m,
                capturing: false,
                posterFile,
                poster: URL.createObjectURL(posterFile),
                frameFiles,
                frames: frameFiles.map((x) => URL.createObjectURL(x)),
                width: r.width,
                height: r.height,
                duration: r.duration,
              }
            : m,
        ),
      );
    });
  };

  const addFiles = (files) => {
    const next = [];
    const problems = [];
    const big = [];
    let skipped = 0;
    for (const file of files) {
      const heavy = oversize(file);
      const problem = heavy ? null : checkFile(file);
      if (heavy) big.push(heavy);
      else if (problem) problems.push(problem);
      else if (items.length + next.length >= MAX_FILES) skipped++;
      else
        next.push({
          key: newKey(),
          source: "file",
          type: file.type.startsWith("video/") ? "video" : "image",
          // Video: đang tự chụp ảnh đại diện + cảnh phụ (vài giây) → chặn bấm Lưu tới khi xong
          capturing: file.type.startsWith("video/"),
          file,
          preview: URL.createObjectURL(file),
          name: file.name,
          pos: "center",
        });
    }
    if (skipped && !next.length) {
      // Đã đủ từ trước → không thêm được tệp nào
      toast.warning(`Sản phẩm đã có đủ ${MAX_FILES} ảnh và video. Hãy xoá bớt rồi thêm tệp mới.`, {
        title: `Đã đủ ${MAX_FILES} ảnh và video`,
      });
    } else if (skipped) {
      // Còn chỗ cho một phần → thêm phần vừa đủ, báo số tệp chưa thêm
      toast.warning(
        `Mỗi sản phẩm chỉ chứa tối đa ${MAX_FILES} ảnh và video, nên ${skipped} tệp còn lại chưa được thêm.`,
        { title: `Đã thêm ${next.length}/${next.length + skipped} tệp` },
      );
    }
    if (big.length) setTooBig(big);
    if (problems.length) {
      toast.warning(problems.slice(0, 3).join(" "), {
        title: problems.length > 1 ? `${problems.length} tệp chưa được thêm` : "Tệp chưa được thêm",
      });
    }
    if (next.length) {
      commit([...items, ...next]);
      next.forEach(autoFit);
      next.filter((m) => m.type === "video").forEach(autoPoster);
    }
  };

  const addLink = () => {
    const url = link.trim();
    if (!url) return;
    if (!/^https?:\/\/\S+\.\S+/i.test(url)) {
      return toast.warning("Link cần bắt đầu bằng http:// hoặc https://", {
        title: "Link chưa hợp lệ",
      });
    }
    if (items.some((m) => m.url === url || m.sourceUrl === url)) {
      return toast.info("Link này đã có trong danh sách.", { title: "Đã thêm trước đó" });
    }
    if (items.length >= MAX_FILES) {
      return toast.warning(
        `Mỗi sản phẩm chỉ chứa tối đa ${MAX_FILES} ảnh và video. Hãy xoá bớt để thêm mới.`,
        { title: `Đã đủ ${MAX_FILES} ảnh và video` },
      );
    }
    const embed = parseEmbed(url);
    const item = embed
      ? { key: newKey(), source: "existing", ...embed, sourceUrl: url, pos: "center" }
      : {
          key: newKey(),
          source: "link",
          type: guessLinkType(url),
          url,
          preview: url,
          sourceUrl: url,
          pos: "center",
        };
    commit([...items, item]);
    if (!embed) autoFit(item);
    setLink("");
  };

  const update = (key, patch) =>
    onChange(items.map((m) => (m.key === key ? { ...m, ...patch } : m)));
  const remove = (key) => {
    const m = items.find((x) => x.key === key);
    if (m?.source === "file") URL.revokeObjectURL(m.preview);
    commit(items.filter((x) => x.key !== key));
  };
  const move = (from, to) => {
    if (to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    commit(next);
  };

  return (
    <div>
      {/* Vùng chọn tệp */}
      <button
        type="button"
        data-invalid={error ? "true" : undefined}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          if (!e.dataTransfer.files.length) return;
          e.preventDefault();
          setOver(false);
          addFiles([...e.dataTransfer.files]);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-7 text-center transition",
          over
            ? "border-orange-500 bg-orange-50"
            : error
              ? "border-red-300 bg-red-50/40"
              : "border-ink/15 bg-paper/60 hover:border-ink/30",
        )}
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-white text-orange-600 shadow-sm ring-1 ring-ink/5">
          <Icon name="image" className="size-5" />
        </span>
        <span className="mt-3 text-sm font-semibold text-ink">
          Kéo thả ảnh / video vào đây hoặc bấm để chọn
        </span>
        <span className="mt-1 text-xs text-ink-muted">
          JPG, PNG, WEBP (≤ {MAX_IMAGE_MB}MB) - MP4, MOV, WEBM (≤ {MAX_VIDEO_MB}MB) - tối đa{" "}
          {MAX_FILES} ảnh và video
        </span>
      </button>
      <input
        ref={input}
        type="file"
        accept={ACCEPT}
        multiple
        hidden
        onChange={(e) => {
          addFiles([...e.target.files]);
          e.target.value = "";
        }}
      />

      {/* Thêm bằng link */}
      <div className="mt-3 flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Dán link ảnh, video hoặc YouTube</span>
          <Icon
            name="external"
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-muted"
          />
          <input
            ref={linkInput}
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addLink();
              }
            }}
            placeholder="Hoặc dán link ảnh, video, YouTube, Google Drive…"
            className="field pl-11"
          />
        </label>
        <button
          type="button"
          onClick={addLink}
          disabled={!link.trim()}
          className="shrink-0 rounded-xl bg-navy-950 px-5 text-sm font-semibold text-white transition hover:bg-navy-800 disabled:opacity-40"
        >
          Thêm
        </button>
      </div>
      {error && <p className="mt-2 pl-1 text-left text-[12px] text-red-600">{error}</p>}

      {/* Danh sách */}
      {items.length > 0 && (
        <>
          <p className="mt-5 mb-2 text-left text-xs text-ink-muted">
            {items.length} tệp - kéo thả để sắp xếp thứ tự trong thư viện
          </p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((m, i) => {
              const src = previewOf(m);
              return (
                <li
                  key={m.key}
                  draggable
                  onDragStart={(e) => {
                    setDragKey(m.key);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => dragKey && e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    move(
                      items.findIndex((x) => x.key === dragKey),
                      i,
                    );
                    setDragKey(null);
                  }}
                  onDragEnd={() => setDragKey(null)}
                  className={cn(
                    "group overflow-hidden rounded-xl bg-white ring-1 ring-ink/10 transition",
                    dragKey === m.key && "opacity-40",
                  )}
                >
                  <div className="relative aspect-4/3 cursor-grab overflow-hidden bg-paper-200 active:cursor-grabbing">
                    {src ? (
                      <span className="absolute inset-0">
                        {/* eslint-disable-next-line @next/next/no-img-element -- xem trước tệp cục bộ / link bất kỳ */}
                        <img
                          src={src}
                          loading="lazy"
                          decoding="async"
                          alt=""
                          className="size-full object-cover"
                          draggable={false}
                        />
                      </span>
                    ) : m.type === "video" && playUrl(m) ? (
                      // Chưa có ảnh đại diện → lấy 1 khung hình ở khoảng 1/3 video (đầu video thường tối)
                      <video
                        src={playUrl(m)}
                        muted
                        playsInline
                        preload="metadata"
                        onLoadedMetadata={(e) => {
                          const v = e.currentTarget;
                          v.currentTime = Math.min(Math.max(v.duration * 0.3, 1), 15) || 1;
                        }}
                        className="size-full object-cover"
                      />
                    ) : (
                      <span className="flex size-full items-center justify-center text-ink-muted">
                        <Icon name="film" className="size-6" />
                      </span>
                    )}

                    {m.type !== "image" && (
                      <>
                        {/* Video / link nhúng: bấm → xem trước (phát, tua, dừng) */}
                        <button
                          type="button"
                          onClick={() => setPlayKey(m.key)}
                          aria-label="Xem trước video"
                          className="absolute inset-0 flex items-center justify-center bg-navy-950/10 transition group-hover:bg-navy-950/35 focus-visible:bg-navy-950/35"
                        >
                          <span className="flex size-11 items-center justify-center rounded-full bg-white/95 text-navy-950 shadow-soft transition group-hover:scale-110">
                            <Icon
                              name="play"
                              className="ml-0.5 size-4"
                              strokeWidth={0}
                              fill="currentColor"
                            />
                          </span>
                        </button>
                      </>
                    )}
                    <span className="absolute top-2 left-2 flex gap-1">
                      {m.type !== "image" && (
                        <span className="rounded-full bg-navy-950/80 px-2 py-0.5 text-[10px] font-semibold text-white">
                          {TYPE_LABEL[m.type]}
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => remove(m.key)}
                      aria-label="Gỡ tệp này"
                      className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm transition hover:bg-red-600 hover:text-white"
                    >
                      <Icon name="close" className="size-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-center gap-2 p-1.5">
                    <IconBtn
                      label="Lên trước"
                      icon="chevronLeft"
                      disabled={i === 0}
                      onClick={() => move(i, i - 1)}
                    />
                    <IconBtn
                      label="Ra sau"
                      icon="chevronRight"
                      disabled={i === items.length - 1}
                      onClick={() => move(i, i + 1)}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {tooBig && (
        <OversizeDialog
          items={tooBig}
          onClose={() => setTooBig(null)}
          onPasteLink={() => {
            setTooBig(null);
            const el = linkInput.current;
            el?.scrollIntoView({ block: "center", behavior: "smooth" });
            setTimeout(() => el?.focus({ preventScroll: true }), 250);
          }}
        />
      )}

      {playItem && (
        <VideoPreview
          type={playItem.type}
          url={playUrl(playItem)}
          poster={playItem.poster}
          name={playItem.name}
          onClose={() => setPlayKey(null)}
        />
      )}
    </div>
  );
}

function IconBtn({ label, icon, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className="flex size-7 items-center justify-center rounded-lg text-ink-soft transition hover:bg-paper hover:text-ink disabled:opacity-30"
      {...props}
    >
      <Icon name={icon} className="size-3.5" />
    </button>
  );
}
