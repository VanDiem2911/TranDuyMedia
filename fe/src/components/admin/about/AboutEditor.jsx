"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AboutHeader,
  AboutValues,
  CoreValues,
  Ecosystem,
  Profile,
  Standards,
} from "@/components/about/AboutSections";
import { Icon } from "@/components/icons";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ABOUT_TAG, aboutDefaults, mergeAbout } from "@/data/about-content";
import { api } from "@/lib/api";
import { formatPos, parsePos } from "@/lib/crop";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { describeError, revalidateSite, uploadFile } from "../products/jobs";
import { MAX_IMAGE_MB } from "../products/media-utils";
import { LISTS } from "./about-lists";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const UPLOAD_FOLDER = "about"; // thư mục Cloudinary — backend chỉ tự dọn ảnh cũ trong thư mục này
const HISTORY_MAX = 100;

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

let keySeq = 0;
/** Gắn mã tạm cho từng thẻ trong các danh sách thêm / xoá được → so sánh "chỗ đã sửa" đúng dù xoá thẻ giữa chừng. */
function withKeys(content) {
  let next = content;
  for (const path of Object.keys(LISTS))
    next = setIn(
      next,
      path,
      getIn(next, path).map((it) => ({ ...it, _k: it._k ?? `k${++keySeq}` })),
    );
  return next;
}

/** Cây nội dung → { "story.titleLead": "…", … } (mỗi lá một dòng) */
function flatten(node, path = "", out = {}) {
  if (Array.isArray(node)) node.forEach((v, i) => flatten(v, path ? `${path}.${i}` : `${i}`, out));
  else if (node && typeof node === "object")
    Object.entries(node).forEach(([k, v]) => flatten(v, path ? `${path}.${k}` : k, out));
  else out[path] = node;
  return out;
}

/**
 * Số "chỗ đã sửa": mỗi ô chữ = 1; mỗi ảnh = 1 (đổi ảnh hay cắt ảnh đều tính chung một chỗ);
 * mỗi thẻ thêm mới / xoá đi = 1; thẻ còn lại so theo mã thẻ (xoá thẻ giữa chừng không làm các thẻ sau bị tính là đã sửa).
 */
function countChanges(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.some((x) => x?._k) || b.some((x) => x?._k)) {
      const old = new Map(b.map((x) => [x._k, x]));
      const cur = new Set(a.map((x) => x._k));
      let n = b.filter((x) => !cur.has(x._k)).length;
      for (const x of a) n += old.has(x._k) ? countChanges(x, old.get(x._k)) : 1;
      return n;
    }
    let n = Math.abs(a.length - b.length);
    for (let i = 0; i < Math.min(a.length, b.length); i++) n += countChanges(a[i], b[i]);
    return n;
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    if ("src" in a || "src" in b)
      return a.src !== b.src || a.pos !== b.pos || a.alt !== b.alt ? 1 : 0;
    let n = 0;
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)]))
      if (k !== "_k") n += countChanges(a[k], b[k]);
    return n;
  }
  return a === b ? 0 : 1;
}

const formatTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : null;

/**
 * Sửa TRỰC TIẾP trên giao diện trang "Về chúng tôi": khung bên dưới là chính các khối của trang thật
 * (cùng component với website) — rê chuột → bấm chữ để gõ, bấm ảnh để đổi / cắt. Bố cục, font, cỡ chữ, màu giữ nguyên.
 * Bấm "Lưu" → tải ảnh mới lên Cloudinary (nếu có) → ghi vào DB → báo website làm mới ngay (revalidate theo thẻ).
 */
export function AboutEditor() {
  const router = useRouter();
  const [content, setContent] = useState(null);
  const [baseline, setBaseline] = useState("");
  const [history, setHistory] = useState([]); // các bản trước đó, để Hoàn tác
  const [savedAt, setSavedAt] = useState(null);
  const [hasCustom, setHasCustom] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [tick, setTick] = useState(0);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null); // null | "reset" | "discard"
  const [busy, setBusy] = useState(false);
  const contentRef = useRef(null);
  const files = useRef({}); // địa chỉ blob: của ảnh vừa chọn → tệp chưa tải lên
  const blobs = useRef([]);
  const fileInput = useRef(null);
  const pickTarget = useRef(null);

  /** Đặt nội dung mới (state + ref cùng lúc để các thao tác liên tiếp luôn thấy bản mới nhất). */
  const put = useCallback((next) => {
    contentRef.current = next;
    setContent(next);
  }, []);
  /** Thay đổi có ghi nhận để Hoàn tác */
  const commit = useCallback(
    (fn) => {
      const prev = contentRef.current;
      setHistory((h) => [...h.slice(-(HISTORY_MAX - 1)), prev]);
      put(fn(prev));
    },
    [put],
  );

  useEffect(() => {
    let alive = true;
    api("/content/about")
      .then((res) => {
        if (!alive) return;
        const merged = withKeys(normalize(mergeAbout(aboutDefaults, res.data?.data)));
        put(merged);
        setBaseline(JSON.stringify(merged));
        setHistory([]);
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
  }, [tick, router, put]);

  // Giải phóng ảnh xem trước tạm khi rời trang
  useEffect(() => {
    const list = blobs.current;
    return () => list.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const savedObj = useMemo(() => (baseline ? JSON.parse(baseline) : null), [baseline]);
  const changes = content && savedObj ? countChanges(content, savedObj) : 0;
  const dirty = changes > 0;

  // Cảnh báo khi đóng tab / tải lại lúc còn thay đổi chưa lưu
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const pickImage = useCallback(
    (file) => {
      const path = pickTarget.current;
      if (!file || !path) return;
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
      files.current[url] = file;
      commit((c) => setIn(c, `${path}.src`, url));
    },
    [commit],
  );

  const savedRef = useRef(null);
  useEffect(() => {
    savedRef.current = savedObj;
  }, [savedObj]);

  /** Bộ công cụ đưa cho các khối trên trang (xem components/admin/about/inline-edit.jsx) */
  const edit = useMemo(
    () => ({
      get: (path) => getIn(contentRef.current, path),
      isChanged: (path) => {
        const base = getIn(savedRef.current, path);
        return base !== undefined && base !== getIn(contentRef.current, path);
      },
      setText: (path, value) => commit((c) => setIn(c, path, value)),
      pickImage: (path) => {
        pickTarget.current = path;
        fileInput.current?.click();
      },
      setPosLive: (path, pos) => put(setIn(contentRef.current, `${path}.pos`, pos)),
      listInfo: (listPath) => ({
        len: getIn(contentRef.current, listPath).length,
        min: LISTS[listPath].min,
        max: LISTS[listPath].max,
        noun: LISTS[listPath].noun,
      }),
      addItem: (listPath) =>
        commit((c) => {
          const list = getIn(c, listPath);
          if (list.length >= LISTS[listPath].max) return c;
          const item = { ...LISTS[listPath].template(), _k: `k${++keySeq}` };
          return setIn(c, listPath, [...list, item]);
        }),
      removeItem: (listPath, index) =>
        commit((c) => {
          const list = getIn(c, listPath);
          if (list.length <= LISTS[listPath].min) return c;
          return setIn(
            c,
            listPath,
            list.filter((_, i) => i !== index),
          );
        }),
      snapshot: () => contentRef.current,
      record: (prev) => {
        if (prev && JSON.stringify(prev) !== JSON.stringify(contentRef.current))
          setHistory((h) => [...h.slice(-(HISTORY_MAX - 1)), prev]);
      },
    }),
    [commit, put],
  );
  const undo = () => {
    if (!history.length) return;
    put(history[history.length - 1]);
    setHistory(history.slice(0, -1));
  };

  const discard = () => {
    put(JSON.parse(baseline));
    setHistory([]);
    setConfirm(null);
  };

  const save = async () => {
    if (saving || !content || !dirty) return;
    setSaving(true);
    // Ảnh mới chọn = những ô ảnh đang trỏ tới địa chỉ blob:
    const pending = Object.entries(flatten(content)).filter(
      ([k, v]) => k.endsWith(".src") && typeof v === "string" && v.startsWith("blob:"),
    );
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
          pending.map(async ([path, blobUrl], i) => {
            const res = await uploadFile(files.current[blobUrl], UPLOAD_FOLDER, (p) => {
              prog[i] = p;
              report();
            });
            return [path, res.url];
          }),
        );
        for (const [path, url] of uploaded) next = setIn(next, path, url);
        // Ảnh đã lên Cloudinary → nhớ lại, lỡ bước lưu lỗi thì thử lại không tải ảnh lần nữa
        put(next);
      }

      toast.update(toastId, { progress: 0.95, message: "Đang lưu nội dung…" });
      const res = await api("/content/about", { method: "PATCH", body: next });
      await revalidateSite(ABOUT_TAG); // website cập nhật ngay, không phải chờ cache hết hạn

      const saved = withKeys(normalize(mergeAbout(aboutDefaults, res.data.data)));
      put(saved);
      setBaseline(JSON.stringify(saved));
      setHistory([]);
      files.current = {};
      setSavedAt(res.data.updatedAt);
      setHasCustom(true);
      toast.update(toastId, {
        type: "success",
        title: `Đã lưu ${changes} thay đổi lúc ${formatTime(res.data.updatedAt)}`,
        message: "Website đã cập nhật.",
        progress: undefined,
        action: { label: "Xem trang", onClick: () => window.open("/gioi-thieu", "_blank") },
      });
    } catch (err) {
      const detail = err?.code === "VALIDATION_ERROR" && err.details?.[0];
      toast.update(toastId, {
        type: "error",
        title: "Chưa lưu được nội dung",
        message: `${detail ? `${detail.message}. ` : describeError(err)} Những thay đổi của bạn vẫn còn trên màn hình.`,
        progress: undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  // Phím tắt: Ctrl/Cmd + S = Lưu · Ctrl/Cmd + Z = Hoàn tác (khi không đang gõ chữ)
  const keys = useRef({});
  useEffect(() => {
    keys.current = { save, undo };
  });
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const k = e.key.toLowerCase();
      if (k === "s") {
        e.preventDefault();
        keys.current.save();
      } else if (k === "z" && !e.target.closest?.('[contenteditable="true"], input, textarea')) {
        e.preventDefault();
        keys.current.undo();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const reset = async () => {
    setBusy(true);
    try {
      await api("/content/about", { method: "DELETE" });
      await revalidateSite(ABOUT_TAG);
      const def = withKeys(normalize(aboutDefaults));
      put(def);
      setBaseline(JSON.stringify(def));
      setHistory([]);
      files.current = {};
      setHasCustom(false);
      setSavedAt(null);
      toast.success("Trang Về chúng tôi đã quay về nội dung và hình ảnh ban đầu.", {
        title: "Đã khôi phục mặc định",
      });
    } catch (err) {
      toast.error(describeError(err), { title: "Chưa khôi phục được" });
    } finally {
      setBusy(false);
      setConfirm(null);
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
      <div className="mx-auto max-w-7xl space-y-4" aria-busy="true" aria-live="polite">
        <span className="sr-only">Đang tải nội dung…</span>
        <div className="h-16 animate-pulse rounded-2xl bg-white ring-1 ring-ink/5" />
        <div className="h-[520px] animate-pulse rounded-2xl bg-white ring-1 ring-ink/5" />
      </div>
    );

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* Thanh trên cùng — dính khi cuộn để luôn bấm Lưu được */}
      <div className="sticky top-16 z-30 flex flex-col gap-2 rounded-2xl bg-white/90 p-2.5 shadow-card ring-1 ring-ink/10 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-3 sm:pl-5 lg:top-3">
        <p
          className="flex min-w-0 flex-wrap items-center gap-x-2 text-sm text-ink-soft"
          role="status"
        >
          <span className="font-bold text-ink">Về chúng tôi</span>
          {dirty ? (
            <span className="font-semibold text-orange-600">· {changes} chỗ đã sửa</span>
          ) : (
            <span className="flex items-center gap-2">
              ·
              <span
                className={cn("size-2 rounded-full", hasCustom ? "bg-emerald-500" : "bg-ink/25")}
                aria-hidden="true"
              />
              {hasCustom
                ? `Đã lưu${savedAt ? ` lúc ${formatTime(savedAt)}` : ""}`
                : "Đang dùng nội dung mặc định"}
            </span>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {dirty ? (
            <>
              <BarButton onClick={undo} disabled={!history.length || saving}>
                <span aria-hidden="true">↶</span> Hoàn tác
              </BarButton>
              <BarButton onClick={() => setConfirm("discard")} disabled={saving}>
                Hủy
              </BarButton>
            </>
          ) : (
            <>
              <Link
                href="/gioi-thieu"
                target="_blank"
                className="inline-flex h-11 items-center gap-2 rounded-full border border-ink/15 bg-white px-4 text-sm font-semibold text-ink transition hover:bg-paper"
              >
                <Icon name="external" className="size-4" />
                Xem trang
              </Link>
              {hasCustom && (
                <BarButton onClick={() => setConfirm("reset")}>
                  <Icon name="refresh" className="size-4" />
                  Khôi phục mặc định
                </BarButton>
              )}
            </>
          )}
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-orange-500 px-6 text-sm font-semibold text-white shadow-card transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-ink/25 disabled:shadow-none"
          >
            {saving ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Đang lưu…
              </>
            ) : dirty ? (
              `Lưu (${changes})`
            ) : (
              "Lưu thay đổi"
            )}
          </button>
        </div>
      </div>

      <p className="text-left text-xs leading-relaxed text-ink-muted">
        Rê chuột vào chữ hoặc ảnh để sửa:{" "}
        <span className="font-semibold text-blue-600">viền xanh nét đứt</span> = sửa được,{" "}
        <span className="font-semibold text-orange-600">viền cam</span> = đang gõ. Chỉ đổi nội dung
        chữ và ảnh — font, cỡ chữ, màu giữ đúng thiết kế. Chưa bấm Lưu thì khách chưa thấy thay đổi.
        <span className="hidden lg:inline"> · Ctrl + S lưu · Ctrl + Z hoàn tác</span>
      </p>

      {/* Chính giao diện trang — bấm vào là sửa. Chặn các liên kết để không rời trang quản trị. */}
      <div
        className="edit-canvas isolate overflow-clip rounded-2xl bg-white shadow-card ring-1 ring-ink/15"
        onClickCapture={(e) => e.target.closest?.("a[href]") && e.preventDefault()}
      >
        <AboutHeader header={content.header} edit={edit} />
        <Profile story={content.story} edit={edit} />
        <CoreValues core={content.core} edit={edit} />
        <Standards standards={content.standards} edit={edit} />
        <Ecosystem ecosystem={content.ecosystem} edit={edit} />
        <AboutValues values={content.values} edit={edit} />
      </div>

      <p className="pb-4 text-left text-xs leading-relaxed text-ink-muted">
        Ảnh nền đầu trang, showreel và danh sách đối tác dùng chung với các trang khác nên chưa sửa
        ở đây. Trên website, 6 thẻ dịch vụ cuộn ngang; ở đây xếp thành lưới để sửa cùng lúc.
      </p>

      <input
        ref={fileInput}
        type="file"
        accept={IMAGE_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          pickImage(e.target.files?.[0]);
          e.target.value = ""; // cho phép chọn lại đúng tệp vừa chọn
        }}
      />

      <ConfirmDialog
        open={confirm === "discard"}
        tone="default"
        icon="alert"
        title={`Bỏ ${changes} chỗ đã sửa?`}
        description="Mọi thay đổi chưa lưu sẽ mất, trang trở lại như lần lưu gần nhất."
        confirmLabel="Bỏ thay đổi"
        onConfirm={discard}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "reset"}
        tone="default"
        icon="refresh"
        title="Khôi phục nội dung mặc định?"
        description="Toàn bộ chữ và ảnh bạn đã chỉnh sẽ bị bỏ, trang Về chúng tôi quay về như ban đầu. Ảnh bạn đã tải lên sẽ bị xoá."
        confirmLabel="Khôi phục"
        loading={busy}
        onConfirm={reset}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

function BarButton({ children, ...props }) {
  return (
    <button
      type="button"
      {...props}
      className="inline-flex h-11 items-center gap-2 rounded-full border border-ink/15 bg-white px-4 text-sm font-semibold text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
