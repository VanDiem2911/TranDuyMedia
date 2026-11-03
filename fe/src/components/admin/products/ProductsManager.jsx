"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { api } from "@/lib/api";
import { toast } from "@/lib/toast";
import { coverCdn } from "@/lib/cdn";
import { zoomStyle } from "@/lib/crop";
import { mediaCount } from "@/lib/media-count";
import { cn } from "@/lib/utils";
import {
  describeError,
  discardJob,
  dismissJob,
  revalidateSite,
  saveProductInBackground,
  subscribeJobs,
} from "./jobs";
import { ProductEditor } from "./ProductEditor";

/** Ảnh bìa: ảnh bìa chọn riêng → ảnh đầu tiên trong thư viện → ảnh đại diện video (khớp toView). */
const coverItem = (p) =>
  p.cover ?? p.media?.find((x) => x.type === "image") ?? p.media?.find((x) => x.poster) ?? null;
const coverOf = (p) => {
  const m = coverItem(p);
  // Thẻ 3:4 (~360×480px, Retina ×2) → bản vừa đủ phủ kín thẻ kể cả khi cắt / phóng ảnh ngang (nét)
  return m ? coverCdn(m.type === "image" ? m.url : m.poster, m, 720, 960) : null;
};

/**
 * Quản lý sản phẩm: lưới thẻ giống ngoài website + thao tác nhanh (sửa, ẩn/hiện, xoá, xem trên web).
 * Thêm / sửa mở popup ProductEditor; lưu chạy nền (jobs.js) — thẻ "đang lưu" hiện ngay trong lưới.
 */
export function ProductsManager() {
  const router = useRouter();
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState(null); // null | { initial }
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(null);
  const [jobs, setJobs] = useState([]);

  const [tick, setTick] = useState(0);
  const [loading, setLoading] = useState(false);
  const load = useCallback(() => {
    setLoading(true);
    setTick((t) => t + 1);
  }, []);

  // Việc lưu được TẢI TIẾP sau khi tải lại trang (UploadResumer) xong → làm mới danh sách
  useEffect(() => {
    window.addEventListener("tdm:product-saved", load);
    return () => window.removeEventListener("tdm:product-saved", load);
  }, [load]);

  useEffect(() => {
    let alive = true;
    const started = Date.now();
    api("/products/manage")
      .then((res) => {
        if (!alive) return;
        setItems(res.data);
        setError("");
      })
      .catch((err) => {
        if (err.status === 401) return router.replace("/login");
        if (alive) setError("Không tải được danh sách sản phẩm. Vui lòng thử lại.");
      })
      .finally(() => {
        // Xoay tối thiểu ~0.6s để thấy nút đã nhận lệnh
        setTimeout(() => alive && setLoading(false), Math.max(0, 600 - (Date.now() - started)));
      });
    return () => {
      alive = false;
    };
  }, [tick, router]);
  useEffect(() => subscribeJobs(setJobs), []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items ?? []).filter(
      (p) => !q || `${p.title} ${p.category} ${p.slug}`.toLowerCase().includes(q),
    );
  }, [items, query]);

  const openNew = () => setEditor({ initial: null });
  const openEdit = async (p) => {
    try {
      const res = await api(`/products/manage/${p.id}`);
      setEditor({ initial: res.data });
    } catch (err) {
      toast.error(describeError(err), { title: "Không mở được sản phẩm" });
    }
  };

  const submit = (draft) => {
    // Thử lại một lần lưu lỗi: giữ mốc bắt đầu cũ → nhận ra sản phẩm đã tạo xong (mất phản hồi), không tạo trùng
    if (editor?.startedAt) draft.startedAt = editor.startedAt;
    setEditor(null);
    saveProductInBackground(draft, { onDone: () => load() });
  };

  const togglePublish = async (p) => {
    setBusy(p.id);
    try {
      const res = await api(`/products/${p.id}`, {
        method: "PATCH",
        body: { published: !p.published },
      });
      setItems((list) => list.map((x) => (x.id === p.id ? res.data : x)));
      await revalidateSite();
      toast.success(
        res.data.published
          ? "Khách đã có thể xem sản phẩm này trên website."
          : "Sản phẩm đã được ẩn khỏi website.",
        { title: res.data.published ? "Đã hiển thị" : "Đã ẩn" },
      );
    } catch (err) {
      toast.error(describeError(err), { title: "Chưa cập nhật được" });
    } finally {
      setBusy(null);
    }
  };

  /** Hoàn tác xoá: khôi phục sản phẩm (xoá mềm) và làm mới website. */
  const restore = async (p) => {
    const id = toast.loading(`Đang khôi phục “${p.title}”…`, { title: "Đang hoàn tác" });
    try {
      const res = await api(`/products/${p.id}/restore`, { method: "POST" });
      await revalidateSite();
      load();
      toast.update(id, {
        type: "success",
        title: "Đã khôi phục sản phẩm",
        message:
          res.data.slug !== p.slug
            ? `“${p.title}” đã quay lại, đường dẫn mới: /san-pham/${res.data.slug}`
            : `“${p.title}” đã quay lại như trước khi xoá.`,
      });
    } catch (err) {
      toast.update(id, {
        type: "error",
        title: "Chưa khôi phục được",
        message: err.status === 404 ? "Đã quá thời gian hoàn tác." : describeError(err),
      });
    }
  };

  const confirmDelete = async () => {
    const p = toDelete;
    setBusy(p.id);
    try {
      await api(`/products/${p.id}`, { method: "DELETE" });
      setItems((list) => list.filter((x) => x.id !== p.id));
      await revalidateSite();
      toast.success(`“${p.title}” đã được xoá khỏi website.`, {
        title: "Đã xoá sản phẩm",
        duration: 8000, // đủ thời gian bấm "Hoàn tác"
        action: { label: "Hoàn tác", onClick: () => restore(p) },
      });
      setToDelete(null);
    } catch (err) {
      setToDelete(null);
      if (err.status === 404) {
        toast.info("Sản phẩm đã được xoá trước đó. Danh sách đã được làm mới.", {
          title: "Không còn tồn tại",
        });
        load();
      } else toast.error(describeError(err), { title: "Chưa xoá được sản phẩm" });
    } finally {
      setBusy(null);
    }
  };

  const visibleCount = (items ?? []).filter((p) => p.published).length;

  return (
    // Khoảng cách giữa các khối = padding trên của <main> (5 / sm:6) → thanh công cụ cách đều trên / dưới
    <div className="space-y-5 sm:space-y-6">
      {/* Thanh công cụ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-soft">
          {items ? (
            <>
              <strong className="font-semibold text-ink">{items.length}</strong> sản phẩm -{" "}
              {visibleCount} đang hiển thị - {items.length - visibleCount} đang ẩn
            </>
          ) : (
            "Đang tải…"
          )}
        </p>
        <div className="flex flex-wrap gap-2 sm:flex-nowrap">
          <label className="relative w-full sm:w-72 sm:flex-none">
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-muted"
            />
            <span className="sr-only">Tìm sản phẩm</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên, thể loại"
              className="field rounded-full pl-11"
            />
          </label>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            aria-label="Tải lại danh sách"
            title="Tải lại danh sách"
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-ink-soft ring-1 ring-ink/10 transition hover:text-ink hover:ring-ink/25 disabled:cursor-wait"
          >
            <Icon name="refresh" className={cn("size-4", loading && "animate-spin")} />
          </button>
          <button
            type="button"
            onClick={openNew}
            className="group relative inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-navy-950 pr-1.5 pl-5 text-sm font-semibold text-white transition hover:bg-navy-800 max-sm:flex-1 max-sm:justify-between max-sm:pl-6"
          >
            Thêm sản phẩm
            <span className="flex size-9 items-center justify-center rounded-full bg-orange-500">
              <Icon name="plus" className="size-4" strokeWidth={2.5} />
            </span>
          </button>
        </div>
      </div>

      {error ? (
        <Empty icon="refresh" title={error}>
          <button
            type="button"
            onClick={load}
            className="mt-4 rounded-full bg-navy-950 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Thử lại
          </button>
        </Empty>
      ) : (
        <ul className="grid items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {/* Đang lưu / lỗi (chạy nền) */}
          {jobs.map((j) => (
            <li
              key={j.id}
              className="flex min-h-[340px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink/15 bg-white p-6 text-center"
            >
              {j.status === "running" ? (
                <>
                  <span className="size-10 animate-spin rounded-full border-4 border-paper-200 border-t-orange-500" />
                  <p className="mt-5 font-semibold text-ink">
                    {j.isEdit ? "Đang cập nhật" : "Đang tạo"} “{j.name}”
                  </p>
                  <div className="mt-4 h-1.5 w-40 overflow-hidden rounded-full bg-paper-200">
                    <div
                      className="h-full bg-orange-500 transition-[width] duration-500"
                      style={{ width: `${Math.round(j.progress * 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-ink-muted">Bạn có thể tiếp tục làm việc khác</p>
                </>
              ) : (
                <>
                  <span className="flex size-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                    <Icon name="alert" className="size-5" />
                  </span>
                  <p className="mt-4 font-semibold text-ink">Chưa lưu được “{j.name}”</p>
                  <p className="mt-1 text-center text-xs text-ink-soft">{j.error}</p>
                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        discardJob(j.id);
                        setEditor({ initial: j.draft, startedAt: j.draft.startedAt });
                      }}
                      className="rounded-full bg-navy-950 px-4 py-2 text-xs font-semibold text-white"
                    >
                      Mở lại & thử lại
                    </button>
                    <button
                      type="button"
                      onClick={() => discardJob(j.id)}
                      className="rounded-full px-4 py-2 text-xs font-semibold text-ink-soft ring-1 ring-ink/10 hover:text-ink"
                    >
                      Bỏ qua
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}

          {items === null &&
            Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="aspect-3/4 animate-pulse rounded-2xl bg-paper-200" />
            ))}

          {shown.map((p) => (
            <li
              key={p.id}
              className="group overflow-hidden rounded-2xl bg-white ring-1 ring-ink/10 transition hover:shadow-card"
            >
              {/* Thẻ giống ngoài website */}
              {/* Cùng khung 3:4 với thẻ ngoài website → phần ảnh bị cắt ở đây giống hệt ngoài web */}
              <div className="relative aspect-3/4 overflow-hidden bg-navy-900">
                {coverOf(p) && (
                  <span className="absolute inset-0" style={zoomStyle(coverItem(p))}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- ảnh bìa từ Cloudinary / website */}
                    <img
                      src={coverOf(p)}
                      loading="lazy"
                      decoding="async"
                      alt={p.title}
                      style={{ objectPosition: coverItem(p)?.pos }}
                      className={cn(
                        "size-full object-cover transition duration-700 group-hover:scale-105",
                        !p.published && "grayscale",
                      )}
                    />
                  </span>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-navy-950/85 via-navy-950/10 to-transparent" />
                <span className="absolute top-3 left-3 rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-semibold tracking-eyebrow text-white uppercase">
                  {p.category}
                </span>
                <span
                  className={cn(
                    "absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                    p.published ? "bg-emerald-500 text-white" : "bg-white text-ink",
                  )}
                >
                  <span
                    className={cn("size-1.5 rounded-full", p.published ? "bg-white" : "bg-ink/40")}
                  />
                  {p.published ? "Đang hiển thị" : "Đang ẩn"}
                </span>
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <p className="text-[11px] tracking-eyebrow text-white/60 uppercase">
                    {mediaCount(p.media ?? [])}
                  </p>
                  <h3 className="mt-0.5 truncate text-lg font-semibold">{p.title}</h3>
                  <p className="truncate text-left text-xs text-white/70">{p.summary}</p>
                </div>
              </div>

              {/* Thao tác */}
              <div className="flex items-center gap-1.5 p-3">
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-navy-950 py-2.5 text-[13px] font-semibold text-white transition hover:bg-navy-800"
                >
                  <Icon name="note" className="size-4" />
                  Sửa
                </button>
                <Action
                  label={p.published ? "Ẩn khỏi website" : "Hiển thị trên website"}
                  icon={p.published ? "eye" : "eyeOff"}
                  disabled={busy === p.id}
                  onClick={() => togglePublish(p)}
                />
                <a
                  href={`/san-pham/${p.slug}`}
                  target="_blank"
                  rel="noopener"
                  aria-label="Xem trên website"
                  title={
                    p.published ? "Xem trên website" : "Sản phẩm đang ẩn — bật hiển thị để xem"
                  }
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full text-ink-soft ring-1 ring-ink/10 transition hover:bg-paper hover:text-ink",
                    !p.published && "pointer-events-none opacity-30",
                  )}
                >
                  <Icon name="external" className="size-4" />
                </a>
                <Action
                  label="Xoá sản phẩm"
                  icon="trash"
                  danger
                  disabled={busy === p.id}
                  onClick={() => setToDelete(p)}
                />
              </div>
            </li>
          ))}

          {items && !shown.length && !jobs.length && (
            <li className="sm:col-span-2 xl:col-span-3">
              <Empty
                icon="film"
                title={query ? "Không tìm thấy sản phẩm phù hợp" : "Chưa có sản phẩm nào"}
              >
                {query
                  ? "Thử tìm với từ khoá khác."
                  : "Bấm “Thêm sản phẩm” để đăng bộ ảnh hoặc video đầu tiên."}
              </Empty>
            </li>
          )}
        </ul>
      )}

      {editor && (
        <ProductEditor initial={editor.initial} onSubmit={submit} onClose={() => setEditor(null)} />
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Xoá sản phẩm này?"
        description={
          toDelete && (
            <>
              <strong className="font-semibold text-ink">“{toDelete.title}”</strong> sẽ bị gỡ khỏi
              website và danh sách <span className="whitespace-nowrap">quản lý.</span>
              <br />
              Bạn có chắc chắn muốn tiếp tục?
            </>
          )
        }
        confirmLabel="Xoá sản phẩm"
        loading={busy === toDelete?.id}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

function Action({ label, icon, danger, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "flex size-10 items-center justify-center rounded-full text-ink-soft ring-1 ring-ink/10 transition disabled:opacity-40",
        danger
          ? "hover:bg-red-600 hover:text-white hover:ring-red-600"
          : "hover:bg-paper hover:text-ink",
      )}
      {...props}
    >
      <Icon name={icon} className="size-4" />
    </button>
  );
}

function Empty({ icon, title, children }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-ink/15 bg-white px-6 py-20 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-paper text-navy-900">
        <Icon name={icon} className="size-6" />
      </span>
      <h2 className="mt-5 text-lg font-bold tracking-tight text-ink">{title}</h2>
      {typeof children === "string" ? (
        <p className="mt-2 max-w-sm text-center text-sm text-ink-soft">{children}</p>
      ) : (
        children
      )}
    </div>
  );
}
