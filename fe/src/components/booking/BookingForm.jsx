"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { DateField } from "@/components/ui/DateField";
import { siteConfig } from "@/config/site";
import { BUDGETS } from "@/data/bookings";
import { services } from "@/data/services";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { normalizeName, normalizePhone, validateName, validatePhone } from "@/lib/validate-booking";

const EMPTY = { name: "", phone: "", service: "", date: "", budget: "", note: "", website: "" };
const RULES = { name: validateName, phone: validatePhone };

/** Lỗi từ backend → nội dung toast thân thiện (+ lỗi theo từng ô nếu có). */
function describe(err) {
  if (err.code === "VALIDATION_ERROR") {
    const fields = Object.fromEntries((err.details ?? []).map((d) => [d.field, d.message]));
    return {
      title: "Thông tin chưa hợp lệ",
      message: "Vui lòng kiểm tra lại các ô được đánh dấu.",
      fields,
    };
  }
  if (err.code === "DUPLICATE_BOOKING") {
    return {
      type: "info",
      title: "Đã nhận yêu cầu trước đó",
      message: "Chúng tôi sẽ liên hệ sớm — bạn không cần gửi lại.",
    };
  }
  if (err.status === 429) {
    return {
      type: "warning",
      title: "Gửi quá nhiều lần",
      message: "Vui lòng thử lại sau ít phút hoặc gọi trực tiếp cho chúng tôi.",
    };
  }
  return {
    title: "Chưa gửi được yêu cầu",
    message: `Vui lòng thử lại hoặc gọi ${siteConfig.contact.phone}.`,
  };
}

/**
 * Form đặt lịch tư vấn — gửi về backend (POST /api/v1/bookings), hiển thị trong trang quản trị.
 * - Họ tên & số điện thoại bắt buộc, kiểm tra khi rời ô / khi gửi (cùng quy tắc với backend).
 * - Lỗi chung / thành công hiện bằng toast; lỗi từng ô hiện ngay dưới ô đó.
 * - Ô `website` ẩn là bẫy bot (honeypot): người thật không thấy nên không điền.
 * preset: slug dịch vụ chọn sẵn (từ data-booking="slug"). note: nội dung điền sẵn ô mô tả (data-booking-note).
 */
const SERVICE_SLUGS = new Set(services.map((s) => s.slug));

export function BookingForm({ preset: rawPreset = "", note: presetNote = "", compact = false }) {
  // data-booking không kèm giá trị (vd. data-booking="true") → không chọn sẵn dịch vụ nào
  const preset = SERVICE_SLUGS.has(rawPreset) ? rawPreset : "";
  const [form, setForm] = useState({ ...EMPTY, service: preset, note: presetNote });
  const [errors, setErrors] = useState({});
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k) => (e) => {
    const value = e?.target ? e.target.value : e;
    setForm((v) => ({ ...v, [k]: value }));
    // Đang báo lỗi → kiểm tra lại ngay khi sửa để lỗi biến mất kịp thời
    if (errors[k]) setErrors((x) => ({ ...x, [k]: RULES[k]?.(value) ?? undefined }));
  };
  const blur = (k) => () => {
    if (form[k]) setErrors((x) => ({ ...x, [k]: RULES[k](form[k]) ?? undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const fields = { name: validateName(form.name), phone: validatePhone(form.phone) };
    setErrors(fields);
    if (fields.name || fields.phone) {
      e.currentTarget.querySelector(fields.name ? "[name=name]" : "[name=phone]")?.focus();
      return;
    }
    setPending(true);
    try {
      const body = {
        ...form,
        name: normalizeName(form.name),
        phone: normalizePhone(form.phone),
      };
      await api("/bookings", { method: "POST", body, retry: false });
      setDone(true);
      toast.success("Chúng tôi sẽ liên hệ lại trong vòng 24 giờ làm việc.", {
        title: "Đã gửi yêu cầu",
      });
    } catch (err) {
      const d = describe(err);
      if (d.fields) setErrors(d.fields);
      toast[d.type ?? "error"](d.message, { title: d.title });
    } finally {
      setPending(false);
    }
  };

  const label = (text) => (
    <span className="pointer-events-none absolute top-1.5 left-4 text-[10px] tracking-wider text-ink-muted uppercase">
      {text}
    </span>
  );
  const fieldError = (k) =>
    errors[k] && (
      <span
        id={`bk-${k}-err`}
        className="mt-1 flex items-center gap-1 pl-1 text-left text-[12px] text-red-600"
      >
        <Icon name="close" className="size-3 shrink-0" strokeWidth={2.5} />
        {errors[k]}
      </span>
    );
  const invalid = (k) => errors[k] && "border-red-300 focus:border-red-400 focus:ring-red-100";
  const aria = (k) => ({
    "aria-invalid": !!errors[k],
    "aria-describedby": errors[k] ? `bk-${k}-err` : undefined,
  });

  if (done) {
    return (
      <div className="flex flex-col items-center py-6 text-center" role="status">
        <span className="flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/60">
          <Icon name="check" className="size-7" strokeWidth={2.5} />
        </span>
        <h4 className="mt-6 text-xl font-bold tracking-tight text-ink">
          Đã gửi yêu cầu thành công!
        </h4>
        <p className="mt-2 max-w-xs text-center text-sm leading-relaxed text-ink-soft">
          Cảm ơn bạn! Chúng tôi sẽ liên hệ qua số{" "}
          <span className="font-semibold text-ink">{normalizePhone(form.phone)}</span> trong vòng 24
          giờ làm việc.
        </p>
        <button
          type="button"
          onClick={() => {
            setForm({ ...EMPTY, service: preset, note: presetNote });
            setErrors({});
            setDone(false);
          }}
          className="mt-6 text-sm font-medium text-ink-soft underline-offset-4 hover:text-ink hover:underline"
        >
          Gửi yêu cầu khác
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2.5 sm:space-y-3" noValidate>
      {/* Honeypot — ẩn hoàn toàn với người dùng & trình đọc màn hình */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} />
        </label>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
        <div>
          <input
            name="name"
            required
            className={cn("field", invalid("name"))}
            placeholder="Họ và tên *"
            autoComplete="name"
            maxLength={60}
            {...aria("name")}
            value={form.name}
            onChange={set("name")}
            onBlur={blur("name")}
          />
          {fieldError("name")}
        </div>
        <div>
          <input
            name="phone"
            required
            className={cn("field", invalid("phone"))}
            type="tel"
            inputMode="tel"
            placeholder="Số điện thoại / Zalo *"
            autoComplete="tel"
            maxLength={16}
            {...aria("phone")}
            value={form.phone}
            onChange={set("phone")}
            onBlur={blur("phone")}
          />
          {fieldError("phone")}
        </div>
      </div>
      <label className="relative block">
        {label("Dịch vụ quan tâm")}
        <select className="field pt-5" value={form.service} onChange={set("service")}>
          <option value="">Chưa xác định — cần tư vấn</option>
          {services.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.title}
            </option>
          ))}
        </select>
      </label>
      {/* Thời gian + ngân sách: luôn 2 cột (kể cả mobile) để form vừa 1 màn hình */}
      <div className="grid grid-cols-[1.1fr_1fr] gap-2.5 sm:grid-cols-2 sm:gap-3">
        <DateField
          label="Ngày mong muốn"
          value={form.date}
          onChange={set("date")}
          min={new Date().toISOString().slice(0, 10)}
          className="pr-2 pl-3 sm:px-4"
        />
        <label className="relative block">
          {label(
            <>
              Ngân sách<span className="max-[379px]:hidden"> dự kiến</span>
            </>,
          )}
          <select
            className="field pt-5 pr-1 pl-3 sm:px-4"
            value={form.budget}
            onChange={set("budget")}
          >
            <option value="">Chưa rõ</option>
            {BUDGETS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <textarea
          className={cn(
            "field resize-none",
            compact ? "min-h-[60px] sm:min-h-[72px]" : "min-h-[110px]",
            invalid("note"),
          )}
          placeholder="Mô tả ngắn: sản phẩm, kênh phát, thời lượng, deadline..."
          maxLength={2000}
          value={form.note}
          onChange={set("note")}
        />
        {fieldError("note")}
      </div>

      <div className="flex justify-center pt-1">
        <button
          type="submit"
          disabled={pending}
          className="group relative inline-flex h-12 min-w-[240px] items-center justify-center rounded-full bg-navy-800 pr-[60px] pl-7 text-sm leading-none font-semibold text-white transition hover:bg-navy-700 disabled:cursor-wait disabled:opacity-70 sm:min-w-[280px]"
        >
          {pending ? "Đang gửi..." : "Gửi yêu cầu"}
          <span className="absolute right-1.5 flex size-9 items-center justify-center rounded-full bg-orange-500 text-white transition-transform group-hover:translate-x-0.5">
            {pending ? (
              <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <Icon name="arrowRight" className="size-4" />
            )}
          </span>
        </button>
      </div>

      <p className="text-center text-[12px] text-ink-muted">
        Thông tin chỉ dùng để liên hệ tư vấn, không chia sẻ cho bên thứ ba.
      </p>
    </form>
  );
}
