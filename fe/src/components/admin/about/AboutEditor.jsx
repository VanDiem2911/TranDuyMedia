"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ABOUT_TAG, aboutDefaults, mergeAbout } from "@/data/about-content";
import { api } from "@/lib/api";
import { cdn } from "@/lib/cdn";
import { formatPos, parsePos } from "@/lib/crop";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { describeError, revalidateSite, uploadFile } from "../products/jobs";
import { MAX_IMAGE_MB } from "../products/media-utils";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const UPLOAD_FOLDER = "about"; // thư mục Cloudinary — backend chỉ tự dọn ảnh cũ trong thư mục này

/* ── Tiện ích đọc / ghi theo đường dẫn "story.paragraphs.0" (bất biến) ── */
const getIn = (o, path) => path.split(".").reduce((x, k) => x?.[k], o);
function setIn(o, path, value) {
  const [k, ...rest] = path.split(".");
  const copy = Array.isArray(o) ? [...o] : { ...o };
  copy[k] = rest.length ? setIn(o[k], rest.join("."), value) : value;
  return copy;
}

/** Nội dung mặc định dùng "center 30%" cho vị trí ảnh; backend + thanh trượt dùng "x% y%" → quy về một dạng. */
function normalize(node) {
  if (Array.isArray(node)) return node.map(normalize);
  if (node && typeof node === "object")
    return Object.fromEntries(
      Object.entries(node).map(([k, v]) => [
        k,
        k === "pos" && typeof v === "string" ? formatPos(parsePos(v)) : normalize(v),
      ]),
    );
  return node;
}

/** Mọi ô chữ / đường dẫn ảnh đều bắt buộc có nội dung (khớp backend) → { "story.titleLead": "…" } */
function validate(node, path = "", out = {}) {
  if (Array.isArray(node)) node.forEach((v, i) => validate(v, path ? `${path}.${i}` : `${i}`, out));
  else if (node && typeof node === "object")
    Object.entries(node).forEach(([k, v]) => validate(v, path ? `${path}.${k}` : k, out));
  else if (typeof node === "string" && !node.trim()) out[path] = "Vui lòng không để trống mục này";
  return out;
}

const formatTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

/**
 * Chỉnh nội dung + hình ảnh trang "Về chúng tôi". Bố cục trang giữ nguyên — chỉ đổi chữ và ảnh.
 * Bấm "Lưu" → tải ảnh mới lên Cloudinary (nếu có) → ghi vào DB → báo website làm mới ngay (revalidate theo thẻ).
 */
export function AboutEditor() {
  const router = useRouter();
  const [content, setContent] = useState(null);
  const [baseline, setBaseline] = useState("");
  const [savedAt, setSavedAt] = useState(null);
  const [hasCustom, setHasCustom] = useState(false);
  const [files, setFiles] = useState({}); // đường dẫn ô ảnh → tệp mới chọn, chưa tải lên
  const [errors, setErrors] = useState({});
  const [loadError, setLoadError] = useState("");
  const [tick, setTick] = useState(0);
  const [saving, setSaving] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const blobs = useRef([]);

  useEffect(() => {
    let alive = true;
    api("/content/about")
      .then((res) => {
        if (!alive) return;
        const merged = normalize(mergeAbout(aboutDefaults, res.data?.data));
        setContent(merged);
        setBaseline(JSON.stringify(merged));
        setHasCustom(Boolean(res.data));
        setSavedAt(res.data?.updatedAt ?? null);
        setLoadError("");
      })
      .catch((err) => {
        if (err.status === 401) return router.replace("/login");
        if (alive) setLoadError("Không tải được nội dung trang. Vui lòng thử lại.");
      });
    return () => {
      alive = false;
    };
  }, [tick, router]);

  // Giải phóng ảnh xem trước tạm khi rời trang
  useEffect(() => {
    const list = blobs.current;
    return () => list.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const dirty = content !== null && JSON.stringify(content) !== baseline;

  // Cảnh báo khi đóng tab / tải lại lúc còn thay đổi chưa lưu
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const savedSrc = useMemo(() => (baseline ? JSON.parse(baseline) : null), [baseline]);

  const edit = useCallback((path, value) => {
    setContent((c) => setIn(c, path, value));
    setErrors((e) => (e[path] ? { ...e, [path]: undefined } : e));
  }, []);

  const pickImage = useCallback((path, file) => {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.warning(`“${file.name}” không phải ảnh được hỗ trợ (JPG, PNG, WebP hoặc AVIF).`, {
        title: "Chưa chọn được ảnh",
      });
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      toast.warning(
        `“${file.name}” nặng ${(file.size / 1024 / 1024).toFixed(1)}MB (ảnh tối đa ${MAX_IMAGE_MB}MB).`,
        { title: "Ảnh quá nặng" },
      );
      return;
    }
    const url = URL.createObjectURL(file);
    blobs.current.push(url);
    setFiles((f) => ({ ...f, [path]: file }));
    setContent((c) => setIn(c, `${path}.src`, url));
  }, []);

  /** Bỏ ảnh vừa chọn → quay lại ảnh đang hiển thị trên website. */
  const undoImage = useCallback(
    (path) => {
      setFiles((f) => {
        const { [path]: _gone, ...rest } = f;
        return rest;
      });
      setContent((c) => setIn(c, `${path}.src`, getIn(savedSrc, `${path}.src`)));
    },
    [savedSrc],
  );

  const save = async () => {
    if (saving || !content) return;
    const errs = validate(content);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.warning("Có mục đang để trống — vui lòng điền đủ các mục được đánh dấu.", {
        title: "Nội dung chưa đầy đủ",
      });
      requestAnimationFrame(() => {
        const bad = document.querySelector('[aria-invalid="true"], [data-invalid="true"]');
        bad?.scrollIntoView({ behavior: "smooth", block: "center" });
        bad?.focus?.({ preventScroll: true });
      });
      return;
    }

    setSaving(true);
    const pending = Object.entries(files);
    const toastId = toast.loading(
      pending.length ? `Đang tải ${pending.length} ảnh lên…` : "Đang lưu nội dung…",
      { title: "Trang Về chúng tôi", progress: pending.length ? 0 : undefined },
    );
    try {
      let next = content;
      if (pending.length) {
        const prog = pending.map(() => 0);
        const report = () => {
          const p = prog.reduce((a, b) => a + b, 0) / pending.length;
          toast.update(toastId, {
            progress: p * 0.9,
            message: `Đã tải ${prog.filter((x) => x >= 1).length}/${pending.length} ảnh (${Math.round(p * 100)}%)`,
          });
        };
        const uploaded = await Promise.all(
          pending.map(async ([path, file], i) => {
            const res = await uploadFile(
              file,
              UPLOAD_FOLDER,
              (p) => {
                prog[i] = p;
                report();
              },
              undefined,
            );
            return [path, res.url];
          }),
        );
        for (const [path, url] of uploaded) next = setIn(next, `${path}.src`, url);
        // Ảnh đã lên Cloudinary → nhớ lại, lỡ bước lưu lỗi thì thử lại không tải ảnh lần nữa
        setContent(next);
        setFiles({});
      }

      toast.update(toastId, { progress: 0.95, message: "Đang lưu nội dung…" });
      const res = await api("/content/about", { method: "PATCH", body: next });
      await revalidateSite(ABOUT_TAG); // website cập nhật ngay, không phải chờ cache hết hạn

      const saved = normalize(mergeAbout(aboutDefaults, res.data.data));
      setContent(saved);
      setBaseline(JSON.stringify(saved));
      setSavedAt(res.data.updatedAt);
      setHasCustom(true);
      setErrors({});
      toast.update(toastId, {
        type: "success",
        title: "Đã lưu trang Về chúng tôi",
        message: "Nội dung mới đã hiển thị trên website.",
        progress: undefined,
        action: { label: "Xem trang", onClick: () => window.open("/gioi-thieu", "_blank") },
      });
    } catch (err) {
      if (err?.code === "VALIDATION_ERROR" && err.details?.length)
        setErrors(Object.fromEntries(err.details.map((d) => [d.field, d.message])));
      toast.update(toastId, {
        type: "error",
        title: "Chưa lưu được nội dung",
        message: `${describeError(err)} Những thay đổi của bạn vẫn còn trên màn hình.`,
        progress: undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  // Ctrl/Cmd + S = Lưu
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const reset = async () => {
    setResetting(true);
    try {
      await api("/content/about", { method: "DELETE" });
      await revalidateSite(ABOUT_TAG);
      const def = normalize(aboutDefaults);
      setContent(def);
      setBaseline(JSON.stringify(def));
      setFiles({});
      setErrors({});
      setHasCustom(false);
      setSavedAt(null);
      toast.success("Trang Về chúng tôi đã quay về nội dung và hình ảnh ban đầu.", {
        title: "Đã khôi phục mặc định",
      });
    } catch (err) {
      toast.error(describeError(err), { title: "Chưa khôi phục được" });
    } finally {
      setResetting(false);
      setConfirmReset(false);
    }
  };

  if (loadError)
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-ink/15 bg-white px-6 text-center">
        <Icon name="alert" className="size-6 text-orange-600" />
        <p className="mt-3 font-semibold text-ink">{loadError}</p>
        <button
          type="button"
          onClick={() => setTick((t) => t + 1)}
          className="mt-4 rounded-full bg-navy-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-800"
        >
          Thử lại
        </button>
      </div>
    );

  if (!content)
    return (
      <div className="mx-auto max-w-6xl space-y-5" aria-busy="true" aria-live="polite">
        <span className="sr-only">Đang tải nội dung…</span>
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-56 animate-pulse rounded-3xl bg-white ring-1 ring-ink/5" />
        ))}
      </div>
    );

  const status = dirty
    ? { dot: "bg-orange-500", text: "Có thay đổi chưa lưu" }
    : hasCustom
      ? { dot: "bg-emerald-500", text: `Đã lưu${savedAt ? ` lúc ${formatTime(savedAt)}` : ""}` }
      : { dot: "bg-ink/25", text: "Đang dùng nội dung mặc định" };

  /* Ô nhập chữ — một dòng (input) hoặc nhiều dòng (textarea) */
  const text = (path, label, { max = 200, rows, hint } = {}) => (
    <Field
      key={path}
      path={path}
      label={label}
      hint={hint}
      max={max}
      rows={rows}
      value={getIn(content, path)}
      error={errors[path]}
      onChange={edit}
    />
  );
  const image = (path, label, { aspect, hint, frame }) => (
    <ImageField
      key={path}
      path={path}
      label={label}
      hint={hint}
      aspect={aspect}
      frame={frame}
      value={getIn(content, path)}
      changed={path in files}
      error={errors[`${path}.src`]}
      onPick={pickImage}
      onPos={(p) => edit(`${path}.pos`, p)}
      onUndo={undoImage}
    />
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
      {/* Thanh thao tác — dính trên cùng khi cuộn để luôn bấm Lưu được */}
      <div className="sticky top-16 z-30 flex flex-col gap-2 rounded-2xl bg-white/90 p-2.5 shadow-card ring-1 ring-ink/10 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-3 sm:pl-5 lg:top-3">
        <p className="flex items-center gap-2.5 text-sm text-ink-soft" role="status">
          <span className={cn("size-2.5 shrink-0 rounded-full", status.dot)} aria-hidden="true" />
          <span className={cn(dirty && "font-semibold text-ink")}>{status.text}</span>
          <span className="hidden text-xs text-ink-muted lg:inline">
            · Bố cục giữ nguyên, chỉ đổi chữ và ảnh · Ctrl + S để lưu
          </span>
        </p>
        <div className="flex items-center gap-2">
          <Link
            href="/gioi-thieu"
            target="_blank"
            aria-label="Xem trang (mở tab mới)"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-ink/15 bg-white text-sm font-semibold text-ink transition hover:bg-paper max-sm:w-11 sm:px-4"
          >
            <Icon name="external" className="size-4" />
            <span className="max-sm:hidden">Xem trang</span>
          </Link>
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            disabled={!hasCustom || saving}
            aria-label="Khôi phục mặc định"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-ink/15 bg-white text-sm font-semibold text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40 max-sm:w-11 sm:px-4"
          >
            <Icon name="refresh" className="size-4" />
            <span className="max-sm:hidden">Khôi phục mặc định</span>
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            className="group relative inline-flex h-11 min-w-0 flex-1 items-center justify-center rounded-full bg-navy-950 pr-12 pl-6 text-sm leading-none font-semibold text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
          >
            {saving ? "Đang lưu…" : "Lưu thay đổi"}
            <span className="absolute right-1 flex size-9 items-center justify-center rounded-full bg-orange-500">
              {saving ? (
                <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <Icon name="check" className="size-4" strokeWidth={2.5} />
              )}
            </span>
          </button>
        </div>
      </div>

      {/* 1 — Đầu trang */}
      <Card n="1" title="Đầu trang" desc="Dòng nhỏ và mô tả dưới tiêu đề “Về chúng tôi”.">
        <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
          {text("header.eyebrow", "Dòng nhỏ phía trên", { max: 60 })}
          {text("header.description", "Mô tả", { max: 300, rows: 3 })}
        </div>
      </Card>

      {/* 2 — Câu chuyện */}
      <Card
        n="2"
        title="Câu chuyện của chúng tôi"
        desc="Phần giới thiệu đầu tiên, kèm hồ sơ nhanh và ảnh đại diện."
      >
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-4">
            {text("story.eyebrow", "Dòng nhỏ phía trên tiêu đề", { max: 60 })}
            <div className="grid gap-4 sm:grid-cols-2">
              {text("story.titleLead", "Tiêu đề (chữ đen)", { max: 120, rows: 2 })}
              {text("story.titleAccent", "Tiêu đề (chữ cam)", { max: 120, rows: 2 })}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {text("story.taglines.0", "Thông điệp 1", { max: 120, rows: 2 })}
              {text("story.taglines.1", "Thông điệp 2", { max: 120, rows: 2 })}
            </div>
            {text("story.paragraphs.0", "Đoạn giới thiệu 1", { max: 800, rows: 4 })}
            {text("story.paragraphs.1", "Đoạn giới thiệu 2", { max: 800, rows: 4 })}
            <fieldset className="rounded-2xl bg-paper/70 p-4 ring-1 ring-ink/5">
              <legend className="px-1 text-[13px] font-semibold text-ink">Hồ sơ nhanh</legend>
              <div className="mt-1 grid gap-4 sm:grid-cols-2">
                {content.story.facts.map((_, i) => (
                  <div key={i} className="space-y-2.5">
                    {text(`story.facts.${i}.label`, `Mục ${i + 1} — tên`, { max: 40 })}
                    {text(`story.facts.${i}.value`, `Mục ${i + 1} — nội dung`, {
                      max: 160,
                      rows: 2,
                    })}
                  </div>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="space-y-4">
            {image("story.image", "Ảnh đại diện", {
              aspect: "aspect-3/4",
              frame: "max-w-[300px]",
              hint: "Khung dọc, hiển thị bên phải phần giới thiệu.",
            })}
            {text("story.image.alt", "Mô tả ảnh", {
              max: 200,
              hint: "Cho người khiếm thị và công cụ tìm kiếm",
            })}
          </div>
        </div>
      </Card>

      {/* 3 — Giá trị cốt lõi */}
      <Card n="3" title="Giá trị cốt lõi" desc="Hai thẻ Tầm nhìn và Sứ mệnh.">
        <div className="grid gap-4 sm:grid-cols-2">
          {text("core.eyebrow", "Dòng nhỏ phía trên", { max: 60 })}
          {text("core.title", "Tiêu đề", { max: 100 })}
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {[
            ["core.vision", "Tầm nhìn", "bg-orange-500"],
            ["core.mission", "Sứ mệnh", "bg-navy-950"],
          ].map(([base, name, tone]) => (
            <div key={base} className="space-y-4 rounded-2xl bg-paper/70 p-4 ring-1 ring-ink/5">
              <p className="flex items-center gap-2 text-[13px] font-bold text-ink">
                <span className={cn("size-3 rounded-full", tone)} aria-hidden="true" />
                {name}
              </p>
              {image(`${base}.image`, "Ảnh nền thẻ", {
                aspect: "aspect-4/3",
                hint: "Được phủ màu thương hiệu, chữ nằm ở đáy thẻ.",
              })}
              {text(`${base}.text`, "Nội dung", { max: 400, rows: 4 })}
            </div>
          ))}
        </div>
      </Card>

      {/* 4 — Chuẩn mực sản xuất */}
      <Card n="4" title="Chuẩn mực sản xuất" desc="Năm nguyên tắc, hiển thị dạng danh sách có số.">
        <div className="grid gap-4 sm:grid-cols-2">
          {text("standards.eyebrow", "Dòng nhỏ phía trên", { max: 60 })}
          {text("standards.intro", "Câu giới thiệu", { max: 300, rows: 2 })}
          {text("standards.titleLead", "Tiêu đề (chữ đen)", { max: 120 })}
          {text("standards.titleAccent", "Tiêu đề (chữ cam)", { max: 120 })}
        </div>
        <ol className="mt-6 grid gap-4 lg:grid-cols-2">
          {content.standards.items.map((_, i) => (
            <li key={i} className="space-y-3 rounded-2xl bg-paper/70 p-4 ring-1 ring-ink/5">
              <span className="flex size-7 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                {i + 1}
              </span>
              {text(`standards.items.${i}.title`, "Tên chuẩn mực", { max: 80 })}
              {text(`standards.items.${i}.desc`, "Mô tả", { max: 300, rows: 3 })}
            </li>
          ))}
        </ol>
      </Card>

      {/* 5 — Hệ sinh thái dịch vụ */}
      <Card
        n="5"
        title="Hệ sinh thái dịch vụ"
        desc="Sáu thẻ ảnh cuộn ngang. Đường dẫn của từng thẻ (tới trang dịch vụ) được giữ nguyên."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {text("ecosystem.eyebrow", "Dòng nhỏ phía trên", { max: 60 })}
          {text("ecosystem.tagline", "Khẩu hiệu bên phải tiêu đề", { max: 60 })}
        </div>
        <ul className="mt-6 grid gap-4 lg:grid-cols-2">
          {content.ecosystem.items.map((_, i) => (
            <li
              key={i}
              className="flex flex-col gap-4 rounded-2xl bg-paper/70 p-4 ring-1 ring-ink/5 sm:flex-row"
            >
              <div className="shrink-0 sm:w-40">
                {image(`ecosystem.items.${i}.image`, `Ảnh thẻ ${i + 1}`, {
                  aspect: "aspect-4/5",
                  frame: "max-w-[200px]",
                })}
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                {text(`ecosystem.items.${i}.name`, "Tên dịch vụ", { max: 100, rows: 2 })}
                {text(`ecosystem.items.${i}.desc`, "Mô tả ngắn", { max: 200, rows: 3 })}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <p className="pb-4 text-left text-xs leading-relaxed text-ink-muted">
        Ảnh nền đầu trang, khối “Khách hàng tin tưởng”, showreel và danh sách đối tác dùng chung với
        các trang khác nên chưa chỉnh ở đây.
      </p>

      <ConfirmDialog
        open={confirmReset}
        tone="default"
        icon="refresh"
        title="Khôi phục nội dung mặc định?"
        description="Toàn bộ chữ và ảnh bạn đã chỉnh sẽ bị bỏ, trang Về chúng tôi quay về như ban đầu. Ảnh bạn đã tải lên sẽ bị xoá."
        confirmLabel="Khôi phục"
        loading={resetting}
        onConfirm={reset}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}

/* ── Thành phần giao diện ── */

function Card({ n, title, desc, children }) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-ink/5 sm:p-7">
      <header className="mb-5 flex items-start gap-3">
        <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold text-white">
          {n}
        </span>
        <div>
          <h2 className="text-lg font-bold tracking-tight text-ink">{title}</h2>
          {desc && <p className="mt-0.5 text-left text-sm text-ink-soft">{desc}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

function Field({ path, label, hint, max, rows, value, error, onChange }) {
  const Tag = rows ? "textarea" : "input";
  const len = (value ?? "").length;
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-2 text-[13px] font-semibold text-ink">
        <span>
          {label}
          {hint && <span className="font-normal text-ink-muted"> - {hint}</span>}
        </span>
        {rows && (
          <span
            className={cn(
              "shrink-0 text-[11px] font-normal tabular-nums",
              len >= max * 0.9 ? "text-orange-600" : "text-ink-muted",
            )}
          >
            {len}/{max}
          </span>
        )}
      </span>
      <Tag
        value={value ?? ""}
        onChange={(e) => onChange(path, e.target.value)}
        maxLength={max}
        rows={rows}
        aria-invalid={error ? "true" : undefined}
        className={cn(
          "field",
          rows && "min-h-[3.25rem] resize-y leading-relaxed",
          error && "border-red-300",
        )}
      />
      {error && (
        <span role="alert" className="mt-1 block pl-1 text-left text-[12px] text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}

/**
 * Ô ảnh: khung xem trước đúng tỉ lệ khung trên website (object-cover) + 2 thanh trượt chọn phần ảnh được giữ lại
 * khi cắt khung + nút đổi ảnh. Ảnh mới chỉ tải lên Cloudinary khi bấm "Lưu thay đổi".
 */
function ImageField({
  path,
  label,
  hint,
  aspect,
  frame,
  value,
  changed,
  error,
  onPick,
  onPos,
  onUndo,
}) {
  const input = useRef(null);
  const pt = parsePos(value.pos);
  const id = `img-${path.replace(/\./g, "-")}`;
  return (
    <div>
      <p className="mb-1.5 text-[13px] font-semibold text-ink">{label}</p>
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-2xl bg-paper-200 ring-1 ring-ink/10",
          aspect,
          frame,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- xem trước trong trang quản trị */}
        <img
          src={cdn(value.src, 640)}
          alt=""
          draggable={false}
          className="size-full object-cover"
          style={{ objectPosition: value.pos }}
        />
        {changed && (
          <span className="absolute top-2 left-2 rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white uppercase shadow">
            Ảnh mới
          </span>
        )}
      </div>

      <input
        ref={input}
        type="file"
        accept={IMAGE_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          onPick(path, e.target.files?.[0]);
          e.target.value = ""; // cho phép chọn lại đúng tệp vừa chọn
        }}
      />
      <div className="mt-2.5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-navy-950 px-4 text-[13px] font-semibold text-white transition hover:bg-navy-800"
        >
          <Icon name="image" className="size-4" />
          Đổi ảnh
        </button>
        {changed && (
          <button
            type="button"
            onClick={() => onUndo(path)}
            className="inline-flex h-10 items-center rounded-full border border-ink/15 bg-white px-4 text-[13px] font-semibold text-ink transition hover:bg-paper"
          >
            Giữ ảnh cũ
          </button>
        )}
      </div>

      <div className="mt-3 space-y-1.5">
        <Slider
          id={`${id}-x`}
          label="Ngang"
          ctx={label}
          value={pt.x}
          onChange={(x) => onPos(formatPos({ x, y: pt.y }))}
        />
        <Slider
          id={`${id}-y`}
          label="Dọc"
          ctx={label}
          value={pt.y}
          onChange={(y) => onPos(formatPos({ x: pt.x, y }))}
        />
      </div>
      <p className="mt-1.5 text-left text-[11px] leading-snug text-ink-muted">
        {hint ? `${hint} ` : ""}Kéo thanh trượt để chọn phần ảnh giữ lại khi cắt khung. Tối đa{" "}
        {MAX_IMAGE_MB}MB.
      </p>
      {error && (
        <span
          role="alert"
          data-invalid="true"
          className="mt-1 block text-left text-[12px] text-red-600"
        >
          {error}
        </span>
      )}
    </div>
  );
}

function Slider({ id, label, ctx, value, onChange }) {
  return (
    <label htmlFor={id} className="flex items-center gap-3 text-[12px] text-ink-soft">
      <span className="w-11 shrink-0">{label}</span>
      <input
        id={id}
        aria-label={`Vị trí ${label.toLowerCase()} của ${ctx}`}
        type="range"
        min={0}
        max={100}
        step={1}
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
