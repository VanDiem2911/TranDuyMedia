"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/icons";
import { cdn } from "@/lib/cdn";
import { formatPos, parsePos } from "@/lib/crop";
import { cn } from "@/lib/utils";
import { limitOf } from "./about-limits";

/**
 * Sửa trực tiếp trên giao diện trang "Về chúng tôi" (trang quản trị).
 *  • EditableText: rê chuột → viền xanh nét đứt "Click để sửa"; bấm vào → gõ ngay tại chỗ (viền cam),
 *    "Xong" / Enter để giữ, "Bỏ" / Esc để huỷ. Chỉ sửa NỘI DUNG chữ — font, cỡ chữ, màu, đậm nhạt do thiết kế quyết định.
 *  • ImageTools: rê chuột vào ảnh → nút "Đổi ảnh" · "Cắt ảnh" (chọn phần ảnh giữ lại) · "Alt text".
 * `edit` do AboutEditor cung cấp: { get, isChanged, setText, pickImage, setPosLive, snapshot, record }.
 */

/** Toạ độ (theo màn hình) của một phần tử — theo dõi khi cuộn / đổi cỡ để thanh nổi luôn bám đúng chỗ. */
function useRect(ref, active, token) {
  const [rect, setRect] = useState(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!active || !el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, bottom: r.bottom, right: r.right });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      ro.disconnect();
      setRect(null);
    };
  }, [ref, active, token]);
  return active ? rect : null;
}

export function EditableText({ edit, path }) {
  const value = edit.get(path) ?? "";
  const max = limitOf(path);
  const ref = useRef(null);
  const [initial, setInitial] = useState(value); // nội dung đứng yên trong lúc gõ (trình duyệt tự quản lý chữ đang gõ)
  const [editing, setEditing] = useState(false);
  const [hover, setHover] = useState(false);
  const [len, setLen] = useState(0);
  const [empty, setEmpty] = useState(false);
  const rect = useRect(ref, editing || hover, editing);
  const changed = edit.isChanged(path);

  const start = () => {
    setInitial(value);
    setLen(value.length);
    setEmpty(false);
    setHover(false);
    setEditing(true);
  };

  // Vào chế độ gõ → focus + đặt con trỏ ở cuối chữ
  useEffect(() => {
    const el = ref.current;
    if (!editing || !el) return;
    el.focus({ preventScroll: true });
    // Ô sát mép màn hình (hoặc nằm dưới thanh trên cùng) → cuộn ra giữa cho dễ nhìn, dễ gõ
    const r = el.getBoundingClientRect();
    if (r.top < 150 || r.bottom > window.innerHeight - 90)
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }, [editing]);

  const read = () => (ref.current?.textContent ?? "").replace(/\s+/g, " ").trim();

  /** commit = true: giữ chữ vừa gõ (không cho để trống) · false: bỏ, trở lại chữ cũ */
  const finish = (commit) => {
    if (commit) {
      const text = read();
      if (!text) return setEmpty(true);
      if (text !== value) edit.setText(path, text);
    }
    setEditing(false);
    setEmpty(false);
  };

  const onInput = () => {
    const el = ref.current;
    let t = el.textContent ?? "";
    if (t.length > max) {
      t = t.slice(0, max);
      el.textContent = t;
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
    setLen(t.length);
    setEmpty(!t.trim());
  };

  const onKeyDown = (e) => {
    if (!editing) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        start();
      }
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      finish(true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      finish(false);
    }
  };

  // Dán: chỉ lấy chữ thuần, gộp xuống dòng (không mang theo kiểu chữ của nơi khác)
  const onPaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain").replace(/\s*\n\s*/g, " ");
    document.execCommand("insertText", false, text);
  };

  return (
    <>
      <span
        // Dựng lại thẻ khi vào / ra chế độ gõ → "Bỏ" luôn trả về đúng chữ cũ (trình duyệt đã sửa trực tiếp chữ trong thẻ cũ)
        key={editing ? "editing" : "view"}
        ref={ref}
        role={editing ? "textbox" : "button"}
        tabIndex={0}
        aria-label={
          editing ? "Đang sửa chữ" : `Sửa: ${value.length > 70 ? `${value.slice(0, 70)}…` : value}`
        }
        contentEditable={editing}
        suppressContentEditableWarning
        spellCheck={editing}
        onClick={editing ? undefined : start}
        onKeyDown={onKeyDown}
        onInput={editing ? onInput : undefined}
        onPaste={editing ? onPaste : undefined}
        onDrop={(e) => e.preventDefault()}
        onBlur={() => {
          if (editing) read() ? finish(true) : finish(false);
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(false)}
        className={cn(
          "cursor-text rounded-[3px] outline-2 outline-offset-[3px] transition-[outline-color,background-color] duration-150 focus-visible:outline-blue-500 focus-visible:outline-dashed",
          editing
            ? cn(
                "bg-orange-500/10 caret-orange-500 outline-solid",
                empty ? "outline-red-500" : "outline-orange-500",
              )
            : cn(
                "outline-transparent outline-dashed hover:outline-blue-500",
                changed && "underline decoration-orange-400 decoration-dotted underline-offset-4",
              ),
        )}
      >
        {editing ? initial : value}
      </span>

      {rect &&
        hover &&
        !editing &&
        createPortal(
          <span
            className="pointer-events-none fixed z-[200] rounded bg-blue-600 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-white shadow"
            style={{ top: Math.max(4, rect.top - 24), left: Math.max(4, rect.left) }}
          >
            Click để sửa
          </span>,
          document.body,
        )}

      {rect &&
        editing &&
        createPortal(
          <div
            className="fixed z-[200] flex items-center gap-1 rounded-lg bg-navy-950 p-1 text-xs font-semibold text-white shadow-lg ring-1 ring-white/10"
            style={{
              top: rect.top > 56 ? rect.top - 46 : rect.bottom + 10,
              left: Math.max(8, Math.min(rect.left, window.innerWidth - 260)),
            }}
          >
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => finish(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 hover:bg-white/15"
            >
              <Icon name="check" className="size-3.5" strokeWidth={2.5} />
              Xong
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => finish(false)}
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 hover:bg-white/15"
            >
              <Icon name="close" className="size-3.5" strokeWidth={2.5} />
              Bỏ
            </button>
            <span
              className={cn(
                "px-2 font-normal tabular-nums",
                empty ? "text-red-300" : len >= max * 0.9 ? "text-orange-300" : "text-white/55",
              )}
            >
              {empty ? "Không được để trống" : `${len}/${max}`}
            </span>
          </div>,
          document.body,
        )}
    </>
  );
}

/* ── Ảnh ── */

function Chip({ icon, children, onClick, active, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold text-ink shadow-md ring-1 ring-ink/10 transition hover:bg-paper",
        active ? "bg-orange-50 ring-orange-500" : "bg-white",
        danger && "text-red-600 hover:bg-red-50",
      )}
    >
      <Icon name={icon} className="size-3.5" />
      {children}
    </button>
  );
}

function PosSlider({ label, value, onChange }) {
  return (
    <label className="flex items-center gap-3 text-xs text-ink-soft">
      <span className="w-12 shrink-0">{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-6 min-w-0 flex-1 cursor-pointer accent-orange-500"
      />
      <span className="w-9 shrink-0 text-right text-ink-muted tabular-nums">
        {Math.round(value)}%
      </span>
    </label>
  );
}

/**
 * Nút trên ảnh (cha phải có class `group` + `relative`): Đổi ảnh · Cắt ảnh · Alt text.
 * path = đường dẫn của ảnh (vd. "story.image"); altPath = đường dẫn ô mô tả ảnh (chỉ ảnh có mô tả mới có nút Alt text).
 */
export function ImageTools({ edit, path, altPath, hrefPath, listPath, index }) {
  const [open, setOpen] = useState(null); // null | "crop" | "alt" | "href"
  const box = useRef(null);
  const snap = useRef(null);
  const [alt, setAlt] = useState("");
  const pos = parsePos(edit.get(`${path}.pos`));

  const close = () => {
    if (open === "crop" && snap.current) edit.record(snap.current); // 1 lần cắt ảnh = 1 bước Hoàn tác
    snap.current = null;
    setOpen(null);
  };
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  });

  useEffect(() => {
    if (!open) return;
    const down = (e) => !box.current?.contains(e.target) && closeRef.current();
    const key = (e) => e.key === "Escape" && closeRef.current();
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  const toggleCrop = () => {
    if (open === "crop") return close();
    snap.current = edit.snapshot();
    setOpen("crop");
  };
  const toggleAlt = () => {
    if (open === "alt") return close();
    setAlt(edit.get(altPath) ?? "");
    setOpen("alt");
  };
  const saveAlt = () => {
    const v = alt.trim();
    if (v && v !== edit.get(altPath)) edit.setText(altPath, v);
    setOpen(null);
  };
  // Liên kết của thẻ (bấm thẻ trên website thì đi tới đâu)
  const [href, setHref] = useState("");
  const hrefOk = /^(\/(?!\/)|https:\/\/)\S*$/.test(href.trim());
  const toggleHref = () => {
    if (open === "href") return close();
    setHref(edit.get(hrefPath) ?? "");
    setOpen("href");
  };
  const saveHref = () => {
    const v = href.trim();
    if (hrefOk && v !== edit.get(hrefPath)) edit.setText(hrefPath, v);
    setOpen(null);
  };
  const info = listPath ? edit.listInfo(listPath) : null;
  const canRemove = info && info.len > info.min;

  return (
    <div
      ref={box}
      className="absolute top-2 right-2 z-30 flex flex-col items-end gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className={cn(
          "flex flex-wrap justify-end gap-1.5 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100",
          open ? "opacity-100" : "opacity-0",
        )}
      >
        <Chip icon="image" onClick={() => edit.pickImage(path)}>
          Đổi ảnh
        </Chip>
        <Chip icon="expand" onClick={toggleCrop} active={open === "crop"}>
          Cắt ảnh
        </Chip>
        {altPath && (
          <Chip icon="note" onClick={toggleAlt} active={open === "alt"}>
            Alt text
          </Chip>
        )}
        {hrefPath && (
          <Chip icon="external" onClick={toggleHref} active={open === "href"}>
            Liên kết
          </Chip>
        )}
        {canRemove && (
          <Chip icon="trash" danger onClick={() => edit.removeItem(listPath, index)}>
            Xóa thẻ
          </Chip>
        )}
      </div>

      {open === "crop" && (
        <div className="w-64 max-w-[80vw] space-y-2 rounded-2xl bg-white p-3.5 text-left shadow-xl ring-1 ring-ink/10">
          <p className="text-xs font-semibold text-ink">Chọn phần ảnh giữ lại</p>
          <PosSlider
            label="Ngang"
            value={pos.x}
            onChange={(x) => edit.setPosLive(path, formatPos({ x, y: pos.y }))}
          />
          <PosSlider
            label="Dọc"
            value={pos.y}
            onChange={(y) => edit.setPosLive(path, formatPos({ x: pos.x, y }))}
          />
          <button
            type="button"
            onClick={close}
            className="mt-1 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-navy-950 text-xs font-semibold text-white hover:bg-navy-800"
          >
            <Icon name="check" className="size-3.5" strokeWidth={2.5} />
            Xong
          </button>
        </div>
      )}

      {open === "href" && (
        <div className="w-72 max-w-[80vw] space-y-2 rounded-2xl bg-white p-3.5 text-left shadow-xl ring-1 ring-ink/10">
          <label className="block text-xs font-semibold text-ink" htmlFor={`href-${hrefPath}`}>
            Bấm vào thẻ thì mở trang nào?
          </label>
          <input
            id={`href-${hrefPath}`}
            value={href}
            onChange={(e) => setHref(e.target.value.slice(0, 300))}
            onKeyDown={(e) => e.key === "Enter" && saveHref()}
            autoFocus
            placeholder="/dich-vu/cho-thue-studio"
            aria-invalid={!hrefOk}
            className="field py-2 text-sm text-ink"
          />
          <p className={cn("text-[11px]", hrefOk ? "text-ink-muted" : "text-red-600")}>
            Trang trong website (bắt đầu bằng /) hoặc địa chỉ https://…
          </p>
          <button
            type="button"
            onClick={saveHref}
            disabled={!hrefOk}
            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-navy-950 text-xs font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
          >
            <Icon name="check" className="size-3.5" strokeWidth={2.5} />
            Xong
          </button>
        </div>
      )}

      {open === "alt" && (
        <div className="w-72 max-w-[80vw] space-y-2 rounded-2xl bg-white p-3.5 text-left shadow-xl ring-1 ring-ink/10">
          <label className="block text-xs font-semibold text-ink" htmlFor={`alt-${path}`}>
            Mô tả ảnh (alt text)
          </label>
          <textarea
            id={`alt-${path}`}
            value={alt}
            onChange={(e) => setAlt(e.target.value.slice(0, limitOf(altPath)))}
            rows={3}
            autoFocus
            className="min-h-0 field resize-none py-2 text-sm text-ink"
          />
          <p className="text-[11px] text-ink-muted">
            Cho người khiếm thị và công cụ tìm kiếm. {alt.length}/{limitOf(altPath)}
          </p>
          <button
            type="button"
            onClick={saveAlt}
            disabled={!alt.trim()}
            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-navy-950 text-xs font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
          >
            <Icon name="check" className="size-3.5" strokeWidth={2.5} />
            Xong
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Thẻ (card): thêm / xoá ── */

/** Ô "＋ Thêm thẻ" ở cuối danh sách (ẩn khi đã đủ số thẻ tối đa). className quyết định hình dạng cho khớp danh sách. */
export function AddTile({ edit, listPath, label, className }) {
  const info = edit.listInfo(listPath);
  if (info.len >= info.max) return null;
  return (
    <button
      type="button"
      onClick={() => edit.addItem(listPath)}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink/25 text-sm font-semibold text-ink-soft transition hover:border-orange-500 hover:text-ink",
        className,
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-orange-500 text-white shadow-md">
        <Icon name="plus" className="size-5" strokeWidth={2.5} />
      </span>
      {label}
      <span className="text-xs font-normal opacity-70">
        {info.len}/{info.max}
      </span>
    </button>
  );
}

/** Nút "Xóa" nhỏ cho thẻ không có ảnh (cha phải có `group` + `relative`). Hiện khi rê chuột. */
export function RemoveButton({ edit, listPath, index }) {
  const info = edit.listInfo(listPath);
  if (info.len <= info.min) return null;
  return (
    <button
      type="button"
      onClick={() => edit.removeItem(listPath, index)}
      className="absolute top-3 right-0 z-10 inline-flex h-9 items-center gap-1.5 rounded-full bg-white px-3.5 text-xs font-semibold text-red-600 opacity-0 shadow-md ring-1 ring-ink/10 transition group-hover:opacity-100 hover:bg-red-50 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
    >
      <Icon name="trash" className="size-3.5" />
      Xóa {info.noun}
    </button>
  );
}

/* ── Ảnh nền đầu trang (banner): 6 cột × 3 ảnh ── */

/** Nút "Đổi ảnh nền" trên banner + bảng 18 ảnh để chọn ảnh cần thay. */
export function BannerTools({ edit, columns }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const key = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", key);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.documentElement.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="absolute top-4 right-4 z-30 inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-xs font-semibold text-ink shadow-lg ring-1 ring-ink/10 transition hover:bg-paper"
      >
        <Icon name="image" className="size-4" />
        Đổi ảnh nền
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[250] flex items-center justify-center p-3 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="banner-title"
          >
            <div
              onClick={() => setOpen(false)}
              className="absolute inset-0 [animation:fadeIn_.2s_ease-out_both] bg-navy-950/65 backdrop-blur-sm"
            />
            <div className="relative flex max-h-[92svh] w-full max-w-4xl [animation:popIn_.35s_cubic-bezier(.22,1,.36,1)_both] flex-col overflow-hidden rounded-3xl bg-white shadow-soft">
              <div className="flex items-start justify-between gap-4 border-b border-ink/10 px-5 py-4 sm:px-6">
                <div>
                  <h2 id="banner-title" className="text-lg font-bold tracking-tight text-ink">
                    Ảnh nền đầu trang
                  </h2>
                  <p className="mt-0.5 text-left text-sm text-ink-soft">
                    18 ảnh trôi chậm phía sau tiêu đề “Về chúng tôi”. Bấm vào ảnh muốn thay rồi chọn
                    ảnh mới từ máy.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Đóng"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full text-ink-soft hover:bg-paper hover:text-ink"
                >
                  <Icon name="close" className="size-5" />
                </button>
              </div>

              <div className="overflow-y-auto p-5 sm:p-6">
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
                  {columns.map((col, c) => (
                    <div key={c} className="flex flex-col gap-2.5">
                      {col.map((tile, r) => {
                        const path = `header.columns.${c}.${r}`;
                        const isNew = tile.src.startsWith("blob:");
                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => edit.pickImage(`${path}`)}
                            aria-label={`Đổi ảnh cột ${c + 1}, ảnh ${r + 1}`}
                            className="group relative aspect-3/4 overflow-hidden rounded-xl bg-paper-200 ring-1 ring-ink/10 transition hover:ring-2 hover:ring-orange-500"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element -- xem trước trong trang quản trị */}
                            <img
                              src={cdn(tile.src, 320)}
                              alt=""
                              draggable={false}
                              className="size-full object-cover"
                            />
                            <span className="absolute inset-0 flex items-center justify-center bg-navy-950/55 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                              Đổi ảnh
                            </span>
                            {isNew && (
                              <span className="absolute top-1.5 left-1.5 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                                Mới
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end border-t border-ink/10 bg-paper/60 px-5 py-3.5 sm:px-6">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-navy-950 px-6 text-sm font-semibold text-white hover:bg-navy-800"
                >
                  <Icon name="check" className="size-4" strokeWidth={2.5} />
                  Xong
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
