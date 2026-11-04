"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/icons";
import { BOOKING_STATUSES, statusOf } from "@/data/bookings";
import { cn } from "@/lib/utils";

/** Nhãn trạng thái (chấm màu + chữ). */
export function StatusBadge({ value, className }) {
  const s = statusOf(value);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ring-1",
        s.badge,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

/**
 * Đổi trạng thái nhanh ngay trên dòng bảng: bấm nhãn → menu 3 trạng thái.
 * Menu render qua portal (vị trí fixed) để không bị khung bảng cuộn ngang cắt mất.
 */
export function StatusMenu({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btn = useRef(null);
  const menu = useRef(null);

  useLayoutEffect(() => {
    if (!open || !btn.current) return;
    const r = btn.current.getBoundingClientRect();
    const below = window.innerHeight - r.bottom > 170;
    // Canh giữa menu theo nút, không tràn khỏi mép màn hình (menu w-52 = 208px)
    const half = 104;
    const center = Math.min(Math.max(r.left + r.width / 2, half + 8), window.innerWidth - half - 8);
    setPos({ left: center, top: below ? r.bottom + 6 : r.top - 6, up: !below });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!menu.current?.contains(e.target) && !btn.current?.contains(e.target)) setOpen(false);
    };
    const esc = (e) => e.key === "Escape" && setOpen(false);
    const away = () => setOpen(false);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    window.addEventListener("scroll", away, { capture: true, passive: true });
    window.addEventListener("resize", away);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
      window.removeEventListener("scroll", away, true);
      window.removeEventListener("resize", away);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btn}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          // Rộng cố định → mọi nhãn trong cột bằng nhau; mũi tên nằm bên trong nhãn
          "group inline-flex w-[156px] items-center justify-between gap-2 rounded-full py-1.5 pr-2.5 pl-3 text-xs font-semibold whitespace-nowrap ring-1 transition hover:brightness-95 disabled:opacity-60",
          statusOf(value).badge,
        )}
      >
        <span className="flex items-center gap-1.5">
          <span className={cn("size-1.5 rounded-full", statusOf(value).dot)} />
          {statusOf(value).label}
        </span>
        <Icon
          name="chevronDown"
          className={cn("size-3.5 opacity-70 transition-transform", open && "rotate-180")}
        />
      </button>
      {open &&
        pos &&
        createPortal(
          <ul
            ref={menu}
            role="listbox"
            aria-label="Đổi trạng thái"
            style={{
              left: pos.left,
              top: pos.top,
              transform: `translateX(-50%)${pos.up ? " translateY(-100%)" : ""}`,
            }}
            className="fixed z-[200] w-52 [animation:fadeIn_.15s_ease-out_both] rounded-2xl bg-white p-1.5 shadow-soft ring-1 ring-ink/10"
          >
            {BOOKING_STATUSES.map((s) => (
              <li key={s.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={s.value === value}
                  onClick={() => {
                    setOpen(false);
                    if (s.value !== value) onChange(s.value);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-ink transition hover:bg-paper"
                >
                  <span className={cn("size-2 rounded-full", s.dot)} />
                  <span className="flex-1">{s.label}</span>
                  {s.value === value && <Icon name="check" className="size-4 text-ink-muted" />}
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </>
  );
}

/** Thanh 3 nút chọn trạng thái (dùng trong popup chi tiết). */
export function StatusSegmented({ value, onChange, disabled }) {
  return (
    <div
      role="radiogroup"
      aria-label="Trạng thái"
      className="grid grid-cols-3 gap-1.5 rounded-2xl bg-paper p-1.5"
    >
      {BOOKING_STATUSES.map((s) => {
        const on = s.value === value;
        return (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => !on && onChange(s.value)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-center text-[12px] leading-tight font-semibold ring-1 transition sm:text-[13px]",
              on ? s.active : "bg-white text-ink-soft ring-ink/5 hover:text-ink",
            )}
          >
            <span className={cn("size-1.5 shrink-0 rounded-full", on ? "bg-white" : s.dot)} />
            {/* Cùng chữ với danh sách; điện thoại hẹp → tự xuống dòng gọn trong nút, không đổi tên */}
            <span>{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}
