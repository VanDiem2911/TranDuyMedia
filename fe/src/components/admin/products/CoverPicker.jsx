"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/icons";
import { zoomStyle } from "@/lib/crop";
import { fillTrio } from "@/lib/header-collage";
import { detectSmartPos } from "@/lib/smart-focal";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { ImageCropper } from "./ImageCropper";
import {
  captureFrames,
  checkFile,
  isImage,
  newKey,
  playUrl,
  previewOf,
  proxyUrl,
} from "./media-utils";

export const MAX_FEATURED = 3;
const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

/**
 * Ảnh tự động khi chưa chọn riêng — khớp toView (lib/products.js): ảnh trong thư viện trước;
 * không có ảnh nào → ảnh đại diện của các video, rồi tới các cảnh phụ (frames) tự chụp từ video.
 */
export function autoCovers(library) {
  const photos = library.filter(isImage);
  if (photos.length) return photos.filter((m) => previewOf(m));
  const videos = library.filter((m) => m.type !== "image");
  const scenes = videos.flatMap((m) =>
    (m.frames ?? []).map((u, i) => ({
      key: `${m.key}:canh-${i}`,
      type: "image",
      url: u,
      preview: u,
      pos: "center",
    })),
  );
  return [...videos.filter((m) => m.poster), ...scenes].filter((m) => previewOf(m));
}

const sameImage = (c, m) =>
  c.ref === m.key || (c.url && c.url === (m.type === "image" ? m.url : m.poster));

/** Tìm chủ thể để đặt sẵn khung cắt (tối đa ~1,2s, quá lâu thì để giữa). */
const smartPos = (src) =>
  Promise.race([
    detectSmartPos(src).catch(() => null),
    new Promise((r) => setTimeout(() => r(null), 1200)),
  ]);

/**
 * ẢNH ĐẠI DIỆN (1, thẻ sản phẩm) & ẢNH NỔI BẬT (3) — chọn riêng (ảnh bìa đầu trang luôn tự ghép từ thư viện), độc lập nhau và độc lập với thư viện; dùng được cho mọi
 * kiểu sản phẩm (vừa ảnh vừa video, chỉ ảnh, chỉ video):
 * - Tải ảnh từ máy · chọn lại ảnh trong thư viện · lấy một khung hình bất kỳ từ video.
 * - Ảnh vừa chọn → MỞ NGAY công cụ cắt khung; bấm vào ảnh đã chọn để cắt lại.
 * - Ô bỏ trống hiện mờ ảnh website đang TỰ DÙNG thay thế.
 * cover: item | null · featured: item[] · onChange({ cover, featured })
 */
export function CoverPicker({ cover, featured, library, onChange }) {
  const fileInput = useRef(null);
  const [target, setTarget] = useState(null); // { group: "cover" | "featured", i }
  const [chooser, setChooser] = useState(null); // ô đang mở popup chọn từ thư viện
  const [crop, setCrop] = useState(null); // { group, key }
  // Giá trị mới nhất cho các bước chạy sau await (tìm chủ thể) — cập nhật trong handler, không trong render
  const valueRef = useRef(null);
  const latest = () => valueRef.current ?? { cover, featured };
  const commit = (v) => {
    valueRef.current = v;
    onChange(v);
  };

  const cropItem =
    crop && (crop.group === "cover" ? cover : featured.find((m) => m.key === crop.key));

  const autos = autoCovers(library);
  const autoCover = autos[0] ?? null;
  const autoFeatured = autos.filter((m) => !featured.some((c) => sameImage(c, m)));
  // Đúng như website: thiếu ảnh thì ô trống được bù bằng vùng cắt khác của ảnh đang có
  const trio = fillTrio([...featured, ...autoFeatured]);

  const revoke = (m) => m?.preview?.startsWith("blob:") && URL.revokeObjectURL(m.preview);

  /** Đặt ảnh vào ô → tự tìm chủ thể → mở công cụ cắt khung ngay. */
  const place = async ({ group, i }, item) => {
    setTarget(null);
    setChooser(null);
    const v = { cover, featured };
    if (group === "cover") {
      revoke(v.cover);
      commit({ ...v, cover: item });
    } else {
      revoke(v.featured[i]);
      const next = [...v.featured];
      next[Math.min(i, next.length)] = item;
      commit({ ...v, featured: next });
    }
    const src = previewOf(item);
    const pos =
      src && (item.pos ?? "center") === "center" && !item.zoom ? await smartPos(src) : null;
    if (pos) {
      const now = latest();
      if (group === "cover" && now.cover?.key === item.key)
        commit({ ...now, cover: { ...now.cover, pos } });
      else if (group === "featured")
        commit({
          ...now,
          featured: now.featured.map((m) => (m.key === item.key ? { ...m, pos } : m)),
        });
    }
    setCrop({ group, key: item.key });
  };

  const removeCover = () => {
    revoke(cover);
    commit({ cover: null, featured });
  };
  const removeFeatured = (key) => {
    revoke(featured.find((m) => m.key === key));
    commit({ cover, featured: featured.filter((m) => m.key !== key) });
  };
  const moveFeatured = (i, d) => {
    const next = [...featured];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    commit({ cover, featured: next });
  };
  const applyCrop = (patch) => {
    if (crop.group === "cover") commit({ cover: { ...cover, ...patch }, featured });
    else
      commit({
        cover,
        featured: featured.map((m) => (m.key === crop.key ? { ...m, ...patch } : m)),
      });
    setCrop(null);
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !target) return;
    if (!file.type.startsWith("image/"))
      return toast.warning("Ảnh đại diện và ảnh nổi bật chỉ nhận tệp ảnh (JPG, PNG, WEBP).", {
        title: "Không phải tệp ảnh",
      });
    const problem = checkFile(file);
    if (problem) return toast.warning(problem, { title: "Không thêm được ảnh" });
    place(target, {
      key: newKey(),
      source: "file",
      type: "image",
      file,
      name: file.name,
      preview: URL.createObjectURL(file),
      pos: "center",
    });
  };

  const choose = (slot, how) => {
    valueRef.current = null;
    setTarget(slot);
    if (how === "upload") requestAnimationFrame(() => fileInput.current?.click());
    else setChooser(slot);
  };

  return (
    <div className="space-y-6">
      {/* Ảnh đại diện */}
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-center gap-4 sm:gap-5">
        <Slot
          label="Ảnh đại diện"
          short="Đại diện"
          primary
          item={cover}
          ghost={!cover ? autoCover : null}
          onCrop={() => setCrop({ group: "cover", key: cover.key })}
          onRemove={removeCover}
          library={library}
          onPick={(how) => choose({ group: "cover", i: 0 }, how)}
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">Ảnh đại diện</p>
          <p className="mt-1 text-left text-xs leading-relaxed text-ink-muted">
            Hiện trên thẻ sản phẩm và khi chia sẻ link. Bỏ trống thì{" "}
            <strong className="font-semibold text-ink">tự động lấy từ thư viện</strong>.
          </p>
          <p className="mt-2 text-left text-xs leading-relaxed text-ink-muted">
            Chọn ảnh xong sẽ mở ngay công cụ cắt; muốn cắt lại thì bấm vào ảnh.
          </p>
        </div>
      </div>

      {/* Ảnh nổi bật */}
      <div>
        <p className="text-sm font-semibold text-ink">
          Ảnh nổi bật <span className="font-normal text-ink-muted">- tối đa 3</span>
        </p>
        <p className="mt-1 mb-3 text-left text-xs leading-relaxed text-ink-muted">
          Cụm 3 ảnh ở phần giới thiệu của trang chi tiết. Bỏ trống thì tự động lấy ảnh từ thư viện.
        </p>
        <ul className="grid grid-cols-3 gap-3">
          {Array.from({ length: MAX_FEATURED }, (_, i) => {
            const m = featured[i];
            return (
              <li key={m?.key ?? `f-${i}`} className="min-w-0">
                <Slot
                  label={`Nổi bật ${i + 1}`}
                  short={String(i + 1)}
                  item={m}
                  ghost={!m ? trio[i] : null}
                  onCrop={() => setCrop({ group: "featured", key: m.key })}
                  onRemove={() => removeFeatured(m?.key)}
                  onLeft={m && i > 0 ? () => moveFeatured(i, -1) : null}
                  onRight={m && i < featured.length - 1 ? () => moveFeatured(i, 1) : null}
                  library={library}
                  onPick={(how) =>
                    choose({ group: "featured", i: Math.min(i, featured.length) }, how)
                  }
                />
              </li>
            );
          })}
        </ul>
      </div>

      <input ref={fileInput} type="file" accept={IMAGE_ACCEPT} onChange={onFile} hidden />

      {chooser && (
        <LibraryChooser
          library={library}
          title={chooser.group === "cover" ? "Chọn ảnh đại diện" : "Chọn ảnh nổi bật"}
          onUpload={() => {
            const slot = chooser;
            setChooser(null);
            choose(slot, "upload");
          }}
          onPick={(item) => place(chooser, item)}
          onClose={() => {
            setChooser(null);
            setTarget(null);
          }}
        />
      )}

      {cropItem && (
        <ImageCropper
          item={{
            key: cropItem.key,
            src: previewOf(cropItem, 0), // khung cắt ảnh: dùng bản lớn cho nét
            pos: cropItem.pos,
            zoom: cropItem.zoom,
          }}
          role={crop.group}
          onClose={() => setCrop(null)}
          onApply={applyCrop}
        />
      )}
    </div>
  );
}

/** Một ô ảnh: đã chọn (rê chuột → bấm để cắt khung) hoặc trống (ảnh tự động mờ + nút chọn). */
function Slot({
  label,
  short,
  primary,
  item,
  ghost,
  library,
  onPick,
  onCrop,
  onRemove,
  onLeft,
  onRight,
}) {
  return (
    <div
      className={cn(
        // @container: ô hẹp (điện thoại) → nút chỉ còn biểu tượng, không bị cắt chữ / đè nhãn
        "group @container relative aspect-3/4 overflow-hidden rounded-xl bg-paper-200",
        item
          ? primary
            ? "ring-2 ring-orange-500"
            : "ring-1 ring-ink/10"
          : "border-2 border-dashed border-ink/15 bg-paper/60",
      )}
    >
      {item ? (
        <>
          <span className="absolute inset-0" style={zoomStyle(item)}>
            {/* eslint-disable-next-line @next/next/no-img-element -- xem trước tệp cục bộ / link bất kỳ */}
            <img
              src={previewOf(item)}
              alt=""
              className="size-full object-cover"
              style={{ objectPosition: item.pos }}
              draggable={false}
            />
          </span>
          {/* Rê chuột lên ảnh → hiện "Cắt ảnh"; bấm bất kỳ đâu trên ảnh để cắt lại */}
          <button
            type="button"
            onClick={onCrop}
            aria-label="Cắt khung ảnh"
            title="Bấm để cắt khung"
            className="absolute inset-0 flex cursor-pointer items-center justify-center bg-navy-950/0 transition group-hover:bg-navy-950/40 focus-visible:bg-navy-950/40"
          >
            <span className="inline-flex scale-90 items-center gap-1.5 rounded-full bg-white px-3 py-2 text-[12px] font-semibold text-navy-950 opacity-0 shadow-soft transition group-hover:scale-100 group-hover:opacity-100 in-focus-visible:opacity-100 [@media(hover:none)]:opacity-100">
              <Icon name="pen" className="size-3.5" />
              Cắt ảnh
            </span>
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Gỡ ảnh này"
            className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm transition hover:bg-red-600 hover:text-white"
          >
            <Icon name="close" className="size-3.5" />
          </button>
          <span className="absolute inset-x-2 bottom-2 flex justify-center gap-1.5 opacity-0 transition group-hover:opacity-100 [@media(hover:none)]:opacity-100">
            {onLeft && <SlotBtn label="Lên trước" icon="chevronLeft" onClick={onLeft} />}
            <SlotBtn label="Đổi ảnh khác" icon="refresh" onClick={() => onPick("menu")} />
            {onRight && <SlotBtn label="Ra sau" icon="chevronRight" onClick={onRight} />}
          </span>
        </>
      ) : (
        <>
          {ghost && (
            <span className="absolute inset-0 opacity-35 grayscale-[.4]" style={zoomStyle(ghost)}>
              {/* eslint-disable-next-line @next/next/no-img-element -- ảnh website đang tự dùng */}
              <img
                src={previewOf(ghost)}
                alt=""
                className="size-full object-cover"
                style={{ objectPosition: ghost.pos }}
              />
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center gap-2 p-2 @[8.5rem]:flex-col @[8.5rem]:gap-1.5">
            <EmptyBtn icon="plus" onClick={() => onPick("upload")}>
              Tải ảnh lên
            </EmptyBtn>
            <EmptyBtn
              icon="image"
              onClick={() => onPick("menu")}
              disabled={!library.length}
              title={library.length ? undefined : "Thư viện chưa có ảnh / video"}
            >
              Từ thư viện
            </EmptyBtn>
          </span>
        </>
      )}
      <span
        className={cn(
          "pointer-events-none absolute top-2 left-2 max-w-[calc(100%-2.75rem)] truncate rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap",
          primary ? "bg-orange-500 text-white" : "bg-white/90 text-ink",
        )}
      >
        {/* Ô hẹp (điện thoại) → nhãn ngắn, không bị cắt chữ */}
        <span className="@[8.5rem]:hidden">{short ?? label}</span>
        <span className="hidden @[8.5rem]:inline">{label}</span>
      </span>
      {/* Ô trống đang hiện ảnh website TỰ lấy từ thư viện (ảnh mờ) */}
      {!item && ghost && (
        <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-navy-950/75 px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-white">
          Tự động
        </span>
      )}
    </div>
  );
}

function SlotBtn({ label, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="relative flex size-8 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm transition hover:bg-orange-500 hover:text-white"
    >
      <Icon name={icon} className="size-3.5" />
    </button>
  );
}

/** Nút trong ô trống: ô đủ rộng → biểu tượng + chữ; ô hẹp (điện thoại) → nút tròn chỉ biểu tượng. */
function EmptyBtn({ icon, children, title, ...props }) {
  return (
    <button
      type="button"
      aria-label={children}
      title={title ?? children}
      {...props}
      className="inline-flex size-10 items-center justify-center gap-1.5 rounded-full bg-white text-[12px] font-semibold text-ink shadow-sm ring-1 ring-ink/10 transition hover:bg-orange-500 hover:text-white hover:ring-orange-500 disabled:pointer-events-none disabled:opacity-40 @[8.5rem]:h-auto @[8.5rem]:w-full @[8.5rem]:max-w-[9.5rem] @[8.5rem]:px-3 @[8.5rem]:py-2"
    >
      <Icon name={icon} className="size-4 shrink-0 @[8.5rem]:size-3.5" />
      <span className="hidden truncate @[8.5rem]:inline">{children}</span>
    </button>
  );
}

/** Mục thư viện → ảnh đại diện / ảnh nổi bật dùng lại đúng tệp đó (không tải lên lần nữa). */
function fromLibrary(m) {
  const base = { key: newKey(), type: "image", pos: m.pos ?? "center", zoom: m.zoom };
  if (m.type === "image") {
    if (m.source === "existing" || !m.source)
      return {
        ...base,
        source: "existing",
        url: m.url,
        publicId: m.publicId ?? null,
        width: m.width,
        height: m.height,
      };
    // Ảnh chưa tải lên: tham chiếu tới mục thư viện — lúc lưu dùng lại kết quả tải lên của mục đó.
    // Giữ bản sao tệp / link để vẫn lưu được nếu mục thư viện bị gỡ trước khi bấm Lưu.
    return {
      ...base,
      source: "ref",
      ref: m.key,
      fallback: m.source,
      file: m.file,
      url: m.source === "link" ? m.url : undefined,
      preview: m.file ? URL.createObjectURL(m.file) : m.url,
      name: m.name,
    };
  }
  // Ảnh đại diện có sẵn của video / YouTube
  return {
    ...base,
    pos: "center",
    zoom: undefined,
    source: "existing",
    url: m.poster,
    publicId: null,
  };
}

/**
 * Popup chọn ảnh từ thư viện của sản phẩm: bấm ảnh → dùng ngay; bấm video → tua tới khung hình
 * ưng ý rồi "Dùng khung hình này".
 */
function LibraryChooser({ library, title, onPick, onUpload, onClose }) {
  const [video, setVideo] = useState(null);
  const pickable = library.filter((m) => m.type !== "embed" || m.poster);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      if (video) setVideo(null);
      else onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [video, onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-stretch justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cover-chooser-title"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 [animation:fadeIn_.2s_ease-out_both] bg-navy-950/70 backdrop-blur-sm"
      />
      <div className="relative flex h-full w-full max-w-3xl [animation:popIn_.35s_cubic-bezier(.22,1,.36,1)_both] flex-col overflow-hidden bg-white shadow-soft sm:h-auto sm:max-h-[88svh] sm:rounded-3xl">
        <div className="flex items-center gap-3 border-b border-ink/10 px-5 py-4">
          {video ? (
            <button
              type="button"
              onClick={() => setVideo(null)}
              aria-label="Quay lại"
              className="flex size-10 items-center justify-center rounded-full text-ink-soft hover:bg-paper hover:text-ink"
            >
              <Icon name="chevronLeft" className="size-5" />
            </button>
          ) : (
            <span className="flex size-10 items-center justify-center rounded-xl bg-navy-950 text-orange-500">
              <Icon name="image" className="size-[18px]" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h3 id="cover-chooser-title" className="text-base font-bold tracking-tight text-ink">
              {video ? "Lấy khung hình từ video" : title}
            </h3>
            <p className="text-left text-xs text-ink-muted">
              {video
                ? "Tua tới khung hình đẹp nhất rồi bấm “Dùng khung hình này”"
                : "Bấm ảnh để dùng ngay - bấm video để chọn khung hình"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="flex size-10 items-center justify-center rounded-full text-ink-soft hover:bg-paper hover:text-ink"
          >
            <Icon name="close" className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {video ? (
            <FrameGrabber item={video} onPick={onPick} />
          ) : (
            <>
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {pickable.map((m) => {
                  const src = previewOf(m);
                  const isVid = m.type === "video";
                  return (
                    <li key={m.key}>
                      <button
                        type="button"
                        onClick={() => (isVid ? setVideo(m) : onPick(fromLibrary(m)))}
                        className="group relative block aspect-3/4 w-full overflow-hidden rounded-xl bg-paper-200 ring-1 ring-ink/10 transition hover:ring-2 hover:ring-orange-500"
                      >
                        {src ? (
                          // eslint-disable-next-line @next/next/no-img-element -- xem trước tệp cục bộ / link bất kỳ
                          <img
                            src={src}
                            loading="lazy"
                            decoding="async"
                            alt=""
                            className="size-full object-cover"
                            style={{ objectPosition: m.pos }}
                          />
                        ) : isVid && playUrl(m) ? (
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
                          <span className="absolute top-2 left-2 rounded-full bg-navy-950/80 px-2 py-0.5 text-[10px] font-semibold text-white">
                            {isVid ? "Video - chọn khung" : "Ảnh YouTube"}
                          </span>
                        )}
                        <span className="absolute inset-0 flex items-center justify-center bg-navy-950/0 transition group-hover:bg-navy-950/30">
                          <span className="flex size-9 scale-75 items-center justify-center rounded-full bg-white text-navy-950 opacity-0 shadow-soft transition group-hover:scale-100 group-hover:opacity-100">
                            <Icon name={isVid ? "film" : "check"} className="size-4" />
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {!pickable.length && (
                <p className="py-10 text-center text-sm text-ink-muted">
                  Thư viện chưa có ảnh hoặc video nào.
                </p>
              )}
            </>
          )}
        </div>

        {!video && (
          <div className="flex items-center justify-between gap-3 border-t border-ink/10 bg-paper/60 px-5 py-3.5">
            <p className="text-left text-xs text-ink-muted">
              Hoặc dùng ảnh riêng không có trong thư viện
            </p>
            <button
              type="button"
              onClick={onUpload}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-navy-950 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-navy-800"
            >
              <Icon name="plus" className="size-3.5" />
              Tải ảnh lên
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

const fmt = (t) => {
  const s = Math.max(0, t || 0);
  return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`;
};

/**
 * Tua video tới khung hình cần lấy → chụp đúng độ phân giải gốc của video thành ảnh JPG.
 * Tua MƯỢT: chỉ giữ 1 lệnh tua đang chạy + vị trí mới nhất (kéo nhanh không bị dồn hàng trăm lệnh);
 * lúc kéo dùng tua nhanh tới khung khoá gần nhất (fastSeek, nếu trình duyệt hỗ trợ), thả tay → đúng khung.
 * Video trên kho lưu trữ được tải ngầm vào bộ nhớ → tải xong, mọi lần tua hiện hình gần như tức thì.
 */
function FrameGrabber({ item, onPick }) {
  const ref = useRef(null);
  const [dur, setDur] = useState(0);
  const [t, setT] = useState(0);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [vertical, setVertical] = useState(false);
  const [waiting, setWaiting] = useState(false); // đang chờ khung hình (hiện vòng xoay nhỏ)
  const remote = item.source !== "file";
  const url = playUrl(item);
  // Tua trên BẢN XEM TRƯỚC 480p (vài MB, tải nhanh); chưa có bản này → tự quay về video gốc
  const [base, setBase] = useState(() => (remote && proxyUrl(url)) || url);
  const [src, setSrc] = useState(base);
  const onProxy = base !== url;
  const [cached, setCached] = useState(remote ? 0 : 1); // tiến độ tải ngầm 0–1
  const seeking = useRef(false);
  const want = useRef(null);
  const dragging = useRef(false);
  const restore = useRef(null); // vị trí cần giữ khi đổi sang bản đã tải về máy
  // Khung hình đầu đã hiện → mới tải ngầm cả video (không tranh băng thông với khung hình đầu tiên)
  const [shown, setShown] = useState(!remote);
  useEffect(() => {
    if (shown) return;
    const t = setTimeout(() => setShown(true), 5000); // mạng chậm: vẫn bắt đầu tải ngầm sau 5 giây
    return () => clearTimeout(t);
  }, [shown]);

  // Tải ngầm cả video (đã cho phép đọc từ trang này — CORS) → đổi sang bản trong bộ nhớ, giữ nguyên vị trí
  useEffect(() => {
    if (!remote || !shown) return;
    const ctrl = new AbortController();
    let objectUrl = null;
    (async () => {
      try {
        const res = await fetch(base, { signal: ctrl.signal });
        if (!res.ok || !res.body) return;
        const total = Number(res.headers.get("content-length")) || 0;
        const reader = res.body.getReader();
        const parts = [];
        let got = 0;
        let last = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          parts.push(value);
          got += value.length;
          if (total && got - last > total / 50) {
            last = got;
            setCached(got / total);
          }
        }
        objectUrl = URL.createObjectURL(
          new Blob(parts, { type: res.headers.get("content-type") || "video/mp4" }),
        );
        restore.current = want.current ?? ref.current?.currentTime ?? null;
        setSrc(objectUrl);
        setCached(1);
      } catch {
        // mất mạng / huỷ → vẫn tua trực tiếp trên link gốc như bình thường
      }
    })();
    return () => {
      ctrl.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [base, remote, shown]);

  const run = () => {
    const el = ref.current;
    const v = want.current;
    want.current = null;
    if (!el || v == null) {
      seeking.current = false;
      return;
    }
    seeking.current = true;
    if (dragging.current && typeof el.fastSeek === "function") el.fastSeek(v);
    else el.currentTime = v;
  };

  const seek = (v) => {
    setT(v);
    const el = ref.current;
    if (!el) return;
    el.pause();
    want.current = v;
    if (!seeking.current) run();
  };

  const endDrag = () => {
    if (!dragging.current) return;
    dragging.current = false;
    seek(t); // về đúng khung hình đã chọn (fastSeek chỉ tới khung khoá gần nhất)
  };

  const grab = async () => {
    const v = ref.current;
    if (!v?.videoWidth) return;
    setBusy(true);
    // Đang tua trên bản xem trước → chụp đúng giây đó từ VIDEO GỐC (nét đủ độ phân giải)
    if (onProxy) {
      const at = v.currentTime;
      const r = await captureFrames(url, { crossOrigin: true, at: [at / v.duration], exact: true });
      setBusy(false);
      if (!r?.blobs?.[0])
        return toast.warning("Chưa lấy được khung hình gốc, vui lòng thử lại.", {
          title: "Không lấy được khung hình",
        });
      const name = `${(item.name || "video").replace(/\.[^.]+$/, "")}-${Math.round(at * 10) / 10}s.jpg`;
      const file = new File([r.blobs[0]], name, { type: "image/jpeg" });
      return onPick({
        key: newKey(),
        source: "file",
        type: "image",
        file,
        name,
        preview: URL.createObjectURL(file),
        width: r.width,
        height: r.height,
        pos: "center",
      });
    }
    try {
      const c = document.createElement("canvas");
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
      c.toBlob(
        (blob) => {
          setBusy(false);
          if (!blob) return toast.error("Không tạo được ảnh từ khung hình này.");
          const name = `${(item.name || "video").replace(/\.[^.]+$/, "")}-${Math.round(v.currentTime * 10) / 10}s.jpg`;
          const file = new File([blob], name, { type: "image/jpeg" });
          onPick({
            key: newKey(),
            source: "file",
            type: "image",
            file,
            name,
            preview: URL.createObjectURL(file),
            width: c.width,
            height: c.height,
            pos: "center",
          });
        },
        "image/jpeg",
        0.92,
      );
    } catch {
      // Video trên máy chủ khác không cho phép đọc điểm ảnh (CORS) → không chụp được
      setBusy(false);
      toast.warning(
        "Trình duyệt không cho chụp khung hình của video này. Hãy tải ảnh lên thay thế.",
        { title: "Không lấy được khung hình" },
      );
    }
  };

  const pct = dur ? (t / dur) * 100 : 0;
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl bg-black",
          // Vừa 1 màn hình, không phải cuộn: chiều cao khung video = phần còn lại sau tiêu đề, thanh tua
          // và nút (~19rem); video ngang thu bề ngang theo đó để giữ đúng tỉ lệ 16:9
          vertical
            ? "aspect-9/16 h-[min(calc(88svh-19rem),30rem)]"
            : "aspect-video w-[min(100%,calc((88svh-19rem)*16/9))]",
        )}
      >
        {failed ? (
          <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-white/80">
            Không mở được video này để chọn khung hình.
          </p>
        ) : (
          <video
            ref={ref}
            src={src}
            // Ảnh đại diện hiện NGAY trong lúc chờ khung hình (thay cho khung đen)
            poster={item.poster ? previewOf(item, 1280) : undefined}
            crossOrigin={src.startsWith("blob:") ? undefined : "anonymous"}
            muted
            playsInline
            preload="auto"
            onLoadedMetadata={(e) => {
              const el = e.currentTarget;
              setDur(el.duration || 0);
              setVertical(el.videoHeight > el.videoWidth);
              // Lần đầu: khoảng 1/3 video. Đổi sang bản tải về máy: giữ đúng vị trí đang xem
              const at = restore.current ?? (Math.min(Math.max(el.duration * 0.3, 1), 15) || 0);
              restore.current = null;
              want.current = at;
              setT(at);
              run();
            }}
            onSeeking={() => setWaiting(true)}
            onLoadedData={() => setShown(true)}
            onSeeked={(e) => {
              if (want.current != null) return run(); // đã có vị trí mới hơn → tua tiếp
              seeking.current = false;
              setWaiting(false);
              if (!dragging.current) setT(e.currentTarget.currentTime);
            }}
            onError={() => {
              // Bản xem trước chưa sẵn sàng (vừa tải lên) → dùng video gốc như trước
              if (onProxy && !src.startsWith("blob:")) {
                restore.current = want.current;
                setBase(url);
                setSrc(url);
              } else setFailed(true);
            }}
            className="absolute inset-0 size-full object-contain"
          />
        )}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute top-3 right-3 size-5 animate-spin rounded-full border-2 border-white/30 border-t-white transition-opacity duration-200",
            waiting && cached < 1 ? "opacity-100 delay-150" : "opacity-0",
          )}
        />
      </div>

      <div className="flex w-full items-center gap-3">
        <button
          type="button"
          onClick={() => seek(Math.max(0, t - 1 / 25))}
          aria-label="Lùi 1 khung hình"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-ink-soft ring-1 ring-ink/10 hover:bg-paper"
        >
          <Icon name="chevronLeft" className="size-4" />
        </button>
        {/* Thanh tua: phần đã chọn (cam) + phần video đã tải sẵn về máy (xám nhạt) */}
        <div className="relative flex h-6 min-w-0 flex-1 items-center">
          <span className="absolute inset-x-0 h-1.5 rounded-full bg-ink/10" />
          <span
            className="absolute left-0 h-1.5 rounded-full bg-ink/15 transition-[width] duration-300"
            style={{ width: `${cached * 100}%` }}
          />
          <span
            className="absolute left-0 h-1.5 rounded-full bg-orange-500"
            style={{ width: `${pct}%` }}
          />
          <input
            type="range"
            min={0}
            max={dur || 1}
            step={0.04}
            value={t}
            onPointerDown={() => (dragging.current = true)}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onKeyUp={endDrag}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="Chọn thời điểm"
            className="relative h-6 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgb(248_104_8/0.18)] [&::-webkit-slider-thumb]:transition-transform active:[&::-webkit-slider-thumb]:scale-125"
          />
        </div>
        <button
          type="button"
          onClick={() => seek(Math.min(dur, t + 1 / 25))}
          aria-label="Tiến 1 khung hình"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-ink-soft ring-1 ring-ink/10 hover:bg-paper"
        >
          <Icon name="chevronRight" className="size-4" />
        </button>
        <span className="w-24 shrink-0 text-right text-xs font-medium text-ink-muted tabular-nums">
          {fmt(t)} / {fmt(dur)}
        </span>
      </div>

      <div className="flex w-full flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={grab}
          disabled={busy || failed || !dur}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
        >
          <Icon name="camera" className="size-4" />
          {busy ? "Đang lấy khung hình…" : "Dùng khung hình này"}
        </button>
      </div>
    </div>
  );
}
