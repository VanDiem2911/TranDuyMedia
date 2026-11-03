"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/icons";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { CoverPicker } from "./CoverPicker";
import { MediaManager } from "./MediaManager";
import { newKey, slugify } from "./media-utils";

const EMPTY = {
  title: "",
  slug: "",
  category: "",
  summary: "",
  description: "",
  usage: "",
  location: "",
  published: true,
};

function validate(f, media) {
  const e = {};
  if (f.title.trim().length < 2) e.title = "Vui lòng nhập tên sản phẩm";
  if (f.category.trim().length < 2) e.category = "Vui lòng nhập thể loại";
  if (f.summary.trim().length < 5) e.summary = "Mô tả ngắn cần ít nhất 5 ký tự";
  if (f.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(f.slug))
    e.slug = "Chỉ gồm chữ thường không dấu, số và dấu gạch ngang";
  if (!media.length) e.media = "Thêm ít nhất 1 ảnh hoặc video";
  return e;
}

/**
 * Popup thêm / sửa sản phẩm. Trái: thông tin · Phải: ảnh bìa & ảnh nổi bật (chọn riêng) + thư viện ảnh & video.
 * Bấm "Lưu" → kiểm tra dữ liệu → gửi bản nháp cho onSubmit (lưu nền) và đóng popup ngay.
 * initial: sản phẩm từ API (sửa) | bản nháp lỗi cần thử lại | null (tạo mới)
 */
export function ProductEditor({ initial, onSubmit, onClose }) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState(() => ({ ...EMPTY, ...(initial?.form ?? pick(initial)) }));
  const withKeys = (list) =>
    (list ?? []).map((m) => ({ key: m.key ?? newKey(), source: m.source ?? "existing", ...m }));
  const [media, setMedia] = useState(() => withKeys(initial?.media));
  // Ảnh đại diện (1, field "cover") + ảnh nổi bật (≤ 3) chọn riêng — bỏ trống → website tự lấy từ thư viện
  const [picks, setPicks] = useState(() => ({
    cover: initial?.cover ? withKeys([initial.cover])[0] : null,
    featured: withKeys(initial?.featured),
  }));
  // Đường dẫn tự đi theo tên (cả khi tạo mới lẫn khi sửa) cho tới khi người dùng tự gõ vào ô đường dẫn.
  // Bản nháp lỗi mở lại: giữ nguyên nếu đường dẫn đã được chỉnh tay (khác với tên).
  const [slugTouched, setSlugTouched] = useState(
    () => Boolean(initial?.form?.slug) && initial.form.slug !== slugify(initial.form.title ?? ""),
  );
  const [errors, setErrors] = useState({});
  const [confirmClose, setConfirmClose] = useState(false);
  const dirty = useMemo(
    () =>
      JSON.stringify({
        form,
        media: media.map((m) => [m.key, m.pos, m.zoom]),
        cover: picks.cover && [picks.cover.key, picks.cover.pos, picks.cover.zoom],
        featured: picks.featured.map((m) => [m.key, m.pos, m.zoom]),
      }),
    [form, media, picks],
  );
  const [baseline] = useState(dirty);

  const set = (k) => (e) => {
    const v = e?.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e;
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === "title" && !slugTouched) next.slug = slugify(v);
      return next;
    });
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const requestClose = () => (dirty !== baseline ? setConfirmClose(true) : onClose());

  useEffect(() => {
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const esc = (e) => e.key === "Escape" && requestClose();
    document.addEventListener("keydown", esc);
    return () => {
      document.documentElement.style.overflow = prev;
      document.removeEventListener("keydown", esc);
    };
  });

  const submit = (e) => {
    e.preventDefault();
    const errs = validate(form, media);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.warning("Vui lòng kiểm tra lại các mục được đánh dấu.", {
        title: "Thông tin chưa đầy đủ",
      });
      // Đưa ngay tới ô lỗi đầu tiên (popup dài, nhất là trên điện thoại) + đặt con trỏ vào đó
      const formEl = e.currentTarget;
      requestAnimationFrame(() => {
        const bad = formEl.querySelector('[aria-invalid="true"], [data-invalid="true"]');
        bad?.scrollIntoView({ behavior: "smooth", block: "center" });
        if (bad?.matches("input, textarea")) bad.focus({ preventScroll: true });
      });
      return;
    }
    if (media.some((m) => m.capturing)) {
      toast.info("Đang tạo ảnh đại diện cho video vừa thêm, vui lòng bấm Lưu lại sau vài giây.", {
        title: "Chờ một chút",
      });
      return;
    }
    onSubmit({
      id: initial?.id,
      form: {
        ...form,
        title: form.title.trim(),
        category: form.category.trim(),
        summary: form.summary.trim(),
        slug: form.slug || slugify(form.title),
      },
      media,
      cover: picks.cover,
      featured: picks.featured,
    });
  };

  const field = (k, label, props = {}, Tag = "input") => (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-[13px] font-semibold text-ink">
        {label}
        {props.required && <span className="text-orange-600">*</span>}
        {props.hint && <span className="font-normal text-ink-muted">- {props.hint}</span>}
      </span>
      <Tag
        {...props}
        hint={undefined}
        required={undefined}
        value={form[k]}
        onChange={set(k)}
        aria-invalid={!!errors[k]}
        className={cn(
          "field",
          Tag === "textarea" && "min-h-[110px] resize-y",
          errors[k] && "border-red-300",
          props.className,
        )}
      />
      {errors[k] && (
        <span className="mt-1 block pl-1 text-left text-[12px] text-red-600">{errors[k]}</span>
      )}
    </label>
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[150] flex items-stretch justify-center sm:items-center sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pe-title"
    >
      <div
        onClick={requestClose}
        className="absolute inset-0 [animation:fadeIn_.25s_ease-out_both] bg-navy-950/60 backdrop-blur-sm"
      />
      <form
        onSubmit={submit}
        noValidate
        className="relative flex h-full w-full max-w-6xl [animation:popIn_.4s_cubic-bezier(.22,1,.36,1)_both] flex-col overflow-hidden bg-white shadow-soft sm:h-auto sm:max-h-[92svh] sm:rounded-3xl"
      >
        {/* Đầu */}
        <div className="flex items-center gap-4 border-b border-ink/10 px-6 py-4">
          <span className="flex size-10 items-center justify-center rounded-xl bg-navy-950 text-orange-500">
            <Icon name="film" className="size-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="pe-title" className="text-lg font-bold tracking-tight text-ink">
              {isEdit ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
            </h2>
            <p className="text-left text-xs text-ink-muted">
              Mục có <span className="text-orange-600">*</span> là bắt buộc
            </p>
          </div>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Đóng"
            className="flex size-10 items-center justify-center rounded-full text-ink-soft hover:bg-paper hover:text-ink"
          >
            <Icon name="close" className="size-5" />
          </button>
        </div>

        {/* Nội dung */}
        <div className="grid flex-1 overflow-y-auto lg:grid-cols-[1fr_1.15fr]">
          <div className="space-y-4 border-ink/10 p-6 lg:border-r">
            <SectionTitle n="1" title="Thông tin sản phẩm" />
            {field("title", "Tên sản phẩm", {
              required: true,
              placeholder: "vd. Bộ ảnh Giáng sinh an lành",
              maxLength: 120,
              autoFocus: !isEdit,
            })}
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-ink">
                Đường dẫn <span className="font-normal text-ink-muted">- tự tạo theo tên</span>
              </span>
              <div
                className={cn(
                  "flex field items-center gap-1 py-0 pr-1.5",
                  errors.slug && "border-red-300",
                )}
              >
                <span className="shrink-0 text-ink-muted">/san-pham/</span>
                <input
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    set("slug")(
                      slugify(e.target.value) + (e.target.value.endsWith("-") ? "-" : ""),
                    );
                  }}
                  maxLength={120}
                  className="min-w-0 flex-1 bg-transparent py-3 outline-none"
                  placeholder="bo-anh-giang-sinh"
                />
              </div>
              {errors.slug && (
                <span className="mt-1 block pl-1 text-left text-[12px] text-red-600">
                  {errors.slug}
                </span>
              )}
            </label>

            {field("category", "Thể loại", {
              required: true,
              placeholder: "vd. Concept mùa lễ",
              maxLength: 60,
            })}

            {field("summary", "Mô tả ngắn", {
              required: true,
              hint: "hiện trên thẻ & tiêu đề trang",
              placeholder: "vd. Tuyết trắng, lò sưởi và áo len đỏ.",
              maxLength: 200,
            })}
            {field(
              "description",
              "Mô tả chi tiết",
              {
                placeholder: "Giới thiệu bộ ảnh / video: concept, ánh sáng, cảm xúc…",
                maxLength: 3000,
              },
              "textarea",
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {field("location", "Bối cảnh", {
                placeholder: "vd. Phòng Vintage xanh rêu",
                maxLength: 120,
              })}
              {field("usage", "Ứng dụng", {
                placeholder: "vd. Lookbook, ảnh gia đình…",
                maxLength: 300,
              })}
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl bg-paper/70 p-4 ring-1 ring-ink/5">
              <span>
                <span className="block text-sm font-semibold text-ink">Hiển thị trên website</span>
                <span className="block text-left text-xs text-ink-muted">
                  Tắt để lưu nháp, khách chưa nhìn thấy
                </span>
              </span>
              <span className="relative inline-flex">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={set("published")}
                  className="peer sr-only"
                />
                <span className="h-7 w-12 rounded-full bg-ink/20 transition peer-checked:bg-emerald-500 peer-focus-visible:ring-2 peer-focus-visible:ring-navy-700/30" />
                <span className="absolute top-1 left-1 size-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
              </span>
            </label>
          </div>

          <div className="p-6">
            {/* Thứ tự tự nhiên: tải ảnh / video vào thư viện trước → (tuỳ chọn) chọn ảnh đại diện & ảnh nổi bật */}
            <SectionTitle n="2" title="Thư viện sản phẩm" />
            <div className="mt-4">
              <MediaManager
                items={media}
                onChange={(m) => {
                  setMedia(m);
                  if (errors.media) setErrors((x) => ({ ...x, media: undefined }));
                }}
                error={errors.media}
              />
            </div>
            <div className="mt-7 border-t border-ink/10 pt-6" />
            <SectionTitle n="3" title="Ảnh đại diện & ảnh nổi bật" optional />
            <div className="mt-4">
              <CoverPicker
                cover={picks.cover}
                featured={picks.featured}
                library={media}
                onChange={setPicks}
              />
            </div>
          </div>
        </div>

        {/* Chân */}
        <div className="flex flex-col-reverse gap-2.5 border-t border-ink/10 bg-paper/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={requestClose}
            className="rounded-full border border-ink/15 bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:bg-paper"
          >
            Huỷ
          </button>
          <button
            type="submit"
            className="group relative inline-flex h-12 min-w-[220px] items-center justify-center rounded-full bg-navy-950 pr-[60px] pl-7 text-sm leading-none font-semibold text-white transition hover:bg-navy-800"
          >
            {isEdit ? "Lưu thay đổi" : "Tạo sản phẩm"}
            <span className="absolute right-1.5 flex size-9 items-center justify-center rounded-full bg-orange-500">
              <Icon name="check" className="size-4" strokeWidth={2.5} />
            </span>
          </button>
        </div>

        {/* Xác nhận bỏ thay đổi */}
        {confirmClose && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-soft ring-1 ring-ink/10">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                <Icon name="alert" className="size-5" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-ink">Bỏ các thay đổi chưa lưu?</h3>
              <p className="mt-1.5 text-center text-sm text-ink-soft">
                Nội dung bạn vừa nhập sẽ không được lưu lại.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  autoFocus
                  onClick={() => setConfirmClose(false)}
                  className="rounded-full border border-ink/15 py-2.5 text-sm font-semibold text-ink hover:bg-paper"
                >
                  Tiếp tục sửa
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full bg-navy-950 py-2.5 text-sm font-semibold text-white hover:bg-navy-800"
                >
                  Bỏ thay đổi
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>,
    document.body,
  );
}

/** Sản phẩm từ API → dữ liệu form */
function pick(p) {
  if (!p) return {};
  return {
    title: p.title ?? "",
    slug: p.slug ?? "",
    category: p.category ?? "",
    summary: p.summary ?? "",
    description: p.description ?? "",
    usage: p.usage ?? "",
    location: p.location ?? "",
    published: p.published ?? true,
  };
}

function SectionTitle({ n, title, optional }) {
  return (
    <p className="flex items-center gap-2.5 text-[11px] font-semibold tracking-eyebrow text-ink-muted uppercase">
      <span className="flex size-5 items-center justify-center rounded-full bg-orange-500 text-[10px] text-white">
        {n}
      </span>
      {title}
      {optional && (
        <span className="rounded-full bg-paper px-2 py-0.5 text-[10px] font-semibold tracking-normal text-ink-muted normal-case ring-1 ring-ink/10">
          Tuỳ chọn
        </span>
      )}
    </p>
  );
}
