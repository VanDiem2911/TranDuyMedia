"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { BOOKING_STATUSES } from "@/data/bookings";
import { api } from "@/lib/api";
import { cdn } from "@/lib/cdn";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { StatusBadge } from "../bookings/StatusControl";
import { formatPhone, serviceLabel, timeAgo } from "../bookings/format";

const PENDING = "/admin/bookings?trang-thai=pending"; // mở tab Đặt lịch, lọc sẵn "Chưa giải quyết"
const REFRESH_MS = 60_000; // tự cập nhật mỗi phút khi tab đang mở

// min-w-0: ô lưới không bị nội dung dài (tên, nhãn) kéo rộng tràn khỏi màn hình điện thoại
const card = "min-w-0 rounded-2xl bg-white ring-1 ring-ink/10";
const hhmm = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});
const dayMonth = (ymd) => `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}`;
const coverSrc = (m) => (m ? cdn(m.type === "image" ? m.url : m.poster, 128) : null); // ô 48px

/** "3 ngày" / "5 giờ" / "12 phút" — đã chờ bao lâu */
function waited(iso) {
  const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return `${m} phút`;
  if (m < 1440) return `${Math.floor(m / 60)} giờ`;
  return `${Math.floor(m / 1440)} ngày`;
}

/**
 * Trang Tổng quan của quản trị: số liệu nhanh + việc cần làm, lấy từ GET /api/v1/overview.
 * - Hàng 1: 4 ô số liệu (cần xử lý, yêu cầu 7 ngày, tỉ lệ đã giải quyết, sản phẩm hiển thị).
 * - Hàng 2: biểu đồ yêu cầu 30 ngày | phân bổ theo trạng thái & dịch vụ.
 * - Hàng 3: yêu cầu cần xử lý | sản phẩm cập nhật gần đây.
 */
export function OverviewDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const manual = useRef(false); // lần tải này do người dùng bấm nút làm mới

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const refresh = () => {
    if (refreshing) return;
    manual.current = true;
    setRefreshing(true);
    reload();
  };

  useEffect(() => {
    let alive = true;
    const started = Date.now();
    api("/overview")
      .then((res) => {
        if (!alive) return;
        setData(res.data);
        setError(null);
        if (manual.current) toast.success("Số liệu đã được cập nhật.", { title: "Đã làm mới" });
      })
      .catch((err) => {
        if (!alive) return;
        setError(err.message || "Không tải được số liệu.");
        if (manual.current)
          toast.error(err.message || "Không tải được số liệu.", { title: "Chưa làm mới được" });
      })
      .finally(() => {
        manual.current = false;
        // Xoay tối thiểu ~0.6s để người dùng kịp thấy nút đã nhận lệnh
        setTimeout(() => alive && setRefreshing(false), Math.max(0, 600 - (Date.now() - started)));
      });
    return () => {
      alive = false;
    };
  }, [tick]);

  // Tự làm mới định kỳ (chỉ khi tab đang hiển thị)
  useEffect(() => {
    const t = setInterval(() => document.visibilityState === "visible" && reload(), REFRESH_MS);
    return () => clearInterval(t);
  }, [reload]);

  if (error && !data) {
    return (
      <section className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl border border-dashed border-ink/15 bg-white px-6 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-paper text-navy-900">
          <Icon name="alert" className="size-6" />
        </span>
        <p className="mt-5 text-lg font-semibold text-ink">Chưa tải được số liệu</p>
        <p className="mt-1.5 max-w-sm text-center text-sm text-ink-soft">{error}</p>
        <button
          type="button"
          onClick={reload}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-navy-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-navy-800"
        >
          <Icon name="refresh" className="size-4" />
          Thử lại
        </button>
      </section>
    );
  }
  if (!data) return <Skeleton />;

  const { bookings: b, products: p } = data;
  const resolvedPct = b.counts.all ? Math.round((b.counts.resolved / b.counts.all) * 100) : 0;
  const delta = b.last7 - b.prev7;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Hàng 1 — số liệu nhanh */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi
          href={PENDING}
          icon="inbox"
          accent
          label="Cần xử lý"
          value={b.counts.pending}
          unit="yêu cầu"
          note={
            b.oldestPendingAt
              ? `Chờ lâu nhất ${waited(b.oldestPendingAt)}`
              : "Không có yêu cầu tồn đọng"
          }
        />
        <Kpi
          href="/admin/bookings"
          icon="calendar"
          label={<ShortLabel mobile="Yêu cầu 7 ngày" full="Yêu cầu mới - 7 ngày" />}
          value={b.last7}
          unit="yêu cầu"
          note={
            <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">
              <Trend delta={delta} />
              <span>
                <ShortLabel
                  mobile="so với tuần trước"
                  full={`so với 7 ngày trước - hôm nay ${b.today}`}
                />
              </span>
            </span>
          }
        />
        <Kpi
          href="/admin/bookings?trang-thai=resolved"
          icon="check"
          label="Đã giải quyết"
          value={`${resolvedPct}%`}
          note={`${b.counts.resolved} / ${b.counts.all} yêu cầu`}
          bar={resolvedPct}
        />
        <Kpi
          href="/admin/products"
          icon="film"
          label={<ShortLabel mobile="Đang hiển thị" full="Sản phẩm đang hiển thị" />}
          value={p.published}
          unit={`/ ${p.total}`}
          note={`${p.images} ảnh - ${p.videos} video${p.hidden ? ` - ${p.hidden} đang ẩn` : ""}`}
        />
      </div>

      {/* Hàng 2 — biểu đồ & phân bổ */}
      <div className="grid gap-5 sm:gap-6 lg:grid-cols-3">
        <section className={cn(card, "p-5 sm:p-6 lg:col-span-2")}>
          <CardHead
            title="Yêu cầu đặt lịch - 30 ngày qua"
            sub={`${b.series.reduce((a, d) => a + d.n, 0)} yêu cầu`}
          />
          <DailyChart series={b.series} />
        </section>

        <section className={cn(card, "flex flex-col gap-7 p-5 sm:p-6")}>
          <div>
            <CardHead title="Theo trạng thái" sub={`${b.counts.all} yêu cầu`} />
            <StatusBreakdown counts={b.counts} />
          </div>
          <div>
            <CardHead title="Theo dịch vụ" />
            <ServiceBreakdown services={b.services} total={b.counts.all} />
          </div>
        </section>
      </div>

      {/* Hàng 3 — việc cần làm */}
      <div className="grid gap-5 sm:gap-6 lg:grid-cols-3">
        <section className={cn(card, "p-5 sm:p-6 lg:col-span-2")}>
          <CardHead
            title="Yêu cầu cần xử lý"
            sub="Chưa giải quyết & đang liên hệ, mới nhất trước"
            action={{ href: PENDING, label: "Xem tất cả" }}
          />
          {b.open.length ? (
            <ul className="-mx-2 divide-y divide-ink/5">
              {b.open.map((x) => (
                <li key={x.id}>
                  <Link
                    href={`/admin/bookings?trang-thai=${x.status}`}
                    className="flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-paper/70 sm:gap-4"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-paper text-sm font-bold text-ink uppercase">
                      {x.name.trim().split(/\s+/).at(-1)?.[0] ?? "?"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {x.name}
                      </span>
                      <span className="block truncate text-left text-xs text-ink-muted">
                        {formatPhone(x.phone)} - {serviceLabel(x.service)}
                      </span>
                    </span>
                    <span className="hidden shrink-0 text-xs text-ink-muted sm:block">
                      {timeAgo(x.createdAt)}
                    </span>
                    <StatusBadge value={x.status} className="shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center py-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Icon name="check" className="size-5" strokeWidth={2.5} />
              </span>
              <p className="mt-4 font-semibold text-ink">Đã xử lý hết yêu cầu</p>
              <p className="mt-1 text-center text-sm text-ink-soft">
                Yêu cầu mới từ website sẽ hiện ở đây.
              </p>
            </div>
          )}
        </section>

        <section className={cn(card, "flex flex-col p-5 sm:p-6")}>
          <CardHead
            title="Sản phẩm gần đây"
            action={{ href: "/admin/products", label: "Quản lý" }}
          />
          {p.recent.length ? (
            <ul className="space-y-3">
              {p.recent.map((x) => (
                <li key={x.id} className="flex items-center gap-3">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-paper-200">
                    {coverSrc(x.cover) && (
                      // eslint-disable-next-line @next/next/no-img-element -- ảnh bìa từ Cloudinary / website
                      <img
                        src={coverSrc(x.cover)}
                        alt=""
                        className={cn("size-full object-cover", !x.published && "grayscale")}
                        style={{ objectPosition: x.cover.pos }}
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{x.title}</span>
                    <span className="block truncate text-left text-xs text-ink-muted">
                      {x.media} tệp - sửa {timeAgo(x.updatedAt).toLowerCase()}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      x.published ? "bg-emerald-50 text-emerald-700" : "bg-paper text-ink-muted",
                    )}
                  >
                    {x.published ? "Hiển thị" : "Đang ẩn"}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-ink-soft">Chưa có sản phẩm nào.</p>
          )}
        </section>
      </div>

      <p className="flex items-center justify-end gap-2 text-xs text-ink-muted">
        {refreshing ? "Đang cập nhật…" : `Cập nhật lúc ${hhmm.format(new Date(data.generatedAt))}`}
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          aria-label="Làm mới số liệu"
          title="Làm mới số liệu"
          className="flex size-8 items-center justify-center rounded-full bg-white text-ink-soft ring-1 ring-ink/10 transition hover:text-ink hover:ring-ink/25 disabled:cursor-wait"
        >
          <Icon name="refresh" className={cn("size-3.5", refreshing && "animate-spin")} />
        </button>
      </p>
    </div>
  );
}

/* ---------- Thành phần ---------- */

function CardHead({ title, sub, action }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-base font-bold tracking-tight text-ink">{title}</h2>
        {sub && <p className="mt-0.5 text-left text-xs text-ink-muted">{sub}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="group inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-ink-soft transition hover:text-ink"
        >
          {action.label}
          <Icon
            name="arrowRight"
            className="size-3.5 transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      )}
    </div>
  );
}

function Kpi({ href, icon, label, value, unit, note, accent, bar }) {
  return (
    <Link
      href={href}
      className={cn(
        card,
        "group flex flex-col p-4 transition hover:-translate-y-0.5 hover:shadow-card sm:p-5",
      )}
    >
      <span className="flex items-start justify-between gap-2 sm:items-center sm:gap-3">
        <span className="text-xs leading-snug font-semibold text-ink-soft sm:text-[13px]">
          {label}
        </span>
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-xl transition sm:size-9",
            accent ? "bg-orange-500 text-white" : "bg-paper text-navy-900",
          )}
        >
          <Icon name={icon} className="size-4" />
        </span>
      </span>
      <span className="mt-3 flex items-baseline gap-1.5">
        <span className="text-[1.75rem] leading-none font-bold tracking-tight text-ink tabular-nums sm:text-[2rem]">
          {value}
        </span>
        {unit && <span className="text-sm font-medium text-ink-muted">{unit}</span>}
      </span>
      {bar !== undefined && (
        <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-paper">
          <span className="block h-full rounded-full bg-emerald-500" style={{ width: `${bar}%` }} />
        </span>
      )}
      <span className="mt-auto pt-3 text-left text-[11px] leading-snug text-ink-muted sm:text-xs">
        {note}
      </span>
    </Link>
  );
}

function Trend({ delta }) {
  if (delta === 0) return <span className="font-semibold text-ink-soft">±0</span>;
  const up = delta > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[11px] font-semibold",
        up ? "bg-emerald-50 text-emerald-700" : "bg-paper text-ink-soft",
      )}
    >
      <Icon name={up ? "arrowUp" : "arrowDown"} className="size-3" strokeWidth={2.5} />
      {up ? `+${delta}` : delta}
    </span>
  );
}

/** Cột theo ngày (một chuỗi số liệu → một màu, không cần chú thích). Rê chuột / chạm để xem số. */
function DailyChart({ series }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(...series.map((d) => d.n), 0);
  // Trục "đẹp": bước 1 / 2 / 5 / 10…, tối đa 4 khoảng, luôn ≥ 4 vạch → mọi số nguyên nằm đúng vạch
  const step = [1, 2, 5, 10, 20, 50, 100, 200, 500].find((s) => s * 4 >= max) ?? Math.ceil(max / 4);
  const top = Math.max(4, Math.ceil(max / step)) * step;
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  const last = series.length - 1;
  const total = series.reduce((a, d) => a + d.n, 0);
  // Nhãn ngày mỗi tuần, căn đúng giữa cột tương ứng (đếm lùi từ hôm nay)
  const dateTicks = [last, last - 7, last - 14, last - 21, last - 28].filter((i) => i >= 0);
  const xOf = (i) => `${((i + 0.5) / series.length) * 100}%`;

  return (
    <div>
      <div className="relative h-52 pl-7 sm:h-60 lg:h-[19rem]">
        {/* Lưới ngang mờ + nhãn trục */}
        {ticks.map((t) => (
          <div
            key={t}
            // translate-y-1/2: đường lưới nằm ĐÚNG mốc giá trị (khớp chân cột), không lệch nửa chiều cao nhãn
            className="pointer-events-none absolute inset-x-0 flex translate-y-1/2 items-center"
            style={{ bottom: `${(t / top) * 100}%` }}
          >
            <span className="w-7 -translate-y-px pr-2 text-right text-[10px] text-ink-muted tabular-nums">
              {t}
            </span>
            <span className={cn("h-px flex-1", t === 0 ? "bg-ink/20" : "bg-ink/[0.06]")} />
          </div>
        ))}

        <div
          className="absolute inset-y-0 right-0 left-7 flex items-end gap-0.5"
          onMouseLeave={() => setHover(null)}
        >
          {series.map((d, i) => (
            <button
              key={d.date}
              type="button"
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`${dayMonth(d.date)}: ${d.n} yêu cầu`}
              className="group relative flex h-full flex-1 cursor-default items-end"
            >
              {hover === i && (
                <span className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto h-full w-full max-w-[18px] rounded-t-[4px] bg-ink/[0.04]" />
              )}
              <span
                className={cn(
                  "mx-auto block w-full max-w-[18px] rounded-t-[4px] transition-colors",
                  d.n ? (hover === i ? "bg-orange-600" : "bg-orange-500") : "bg-transparent",
                  hover !== null && hover !== i && d.n && "bg-orange-500/45",
                )}
                style={{ height: d.n ? `${(d.n / top) * 100}%` : 0 }}
              />
              {hover === i && (
                <span
                  className={cn(
                    "pointer-events-none absolute z-10 rounded-lg bg-navy-950 px-2.5 py-1.5 text-left text-xs whitespace-nowrap text-white shadow-soft",
                    i < 4 ? "left-0" : i > last - 4 ? "right-0" : "left-1/2 -translate-x-1/2",
                  )}
                  style={{ bottom: `calc(${(d.n / top) * 100}% + 8px)` }}
                >
                  <span className="block text-[10px] text-white/60">
                    {i === last ? "Hôm nay" : dayMonth(d.date)}
                  </span>
                  <span className="font-semibold tabular-nums">{d.n} yêu cầu</span>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
      {/* Nhãn ngày mỗi tuần — căn đúng giữa cột */}
      <div className="relative mt-2 ml-7 h-4 text-[10px] text-ink-muted tabular-nums">
        {dateTicks.map((i) => (
          <span
            key={i}
            className={cn(
              "absolute top-0 whitespace-nowrap",
              i === last ? "right-0 font-semibold text-ink-soft" : "-translate-x-1/2",
            )}
            style={i === last ? undefined : { left: xOf(i) }}
          >
            {i === last ? "Hôm nay" : dayMonth(series[i].date)}
          </span>
        ))}
      </div>
      {total === 0 && (
        <p className="mt-3 text-center text-xs text-ink-muted">
          Chưa có yêu cầu nào trong 30 ngày qua.
        </p>
      )}
      {/* Bảng số liệu cho trình đọc màn hình */}
      <div className="sr-only">
        <table>
          <caption>Số yêu cầu đặt lịch theo ngày, 30 ngày qua</caption>
          <tbody>
            {series.map((d) => (
              <tr key={d.date}>
                <th>{dayMonth(d.date)}</th>
                <td>{d.n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBreakdown({ counts }) {
  const total = counts.all || 1;
  return (
    <>
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-paper">
        {counts.all > 0 &&
          BOOKING_STATUSES.map(
            (s) =>
              counts[s.value] > 0 && (
                <span
                  key={s.value}
                  className={cn("h-full first:rounded-l-full last:rounded-r-full", s.dot)}
                  style={{ width: `${(counts[s.value] / total) * 100}%` }}
                />
              ),
          )}
      </div>
      <ul className="mt-4 space-y-2.5">
        {BOOKING_STATUSES.map((s) => (
          <li key={s.value} className="flex items-center gap-2.5 text-sm">
            <span className={cn("size-2 rounded-full", s.dot)} />
            <span className="flex-1 text-ink-soft">{s.label}</span>
            <span className="font-semibold text-ink tabular-nums">{counts[s.value]}</span>
            <span className="w-10 text-right text-xs text-ink-muted tabular-nums">
              {counts.all ? Math.round((counts[s.value] / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

function ServiceBreakdown({ services, total }) {
  if (!services.length)
    return <p className="text-left text-sm text-ink-muted">Chưa có yêu cầu nào.</p>;
  const max = services[0].n;
  return (
    <ul className="space-y-3">
      {services.slice(0, 5).map((s) => (
        <li key={s.service ?? "none"}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-ink-soft">{serviceLabel(s.service)}</span>
            <span className="shrink-0 font-semibold text-ink tabular-nums">
              {s.n}
              <span className="ml-1.5 text-xs font-normal text-ink-muted">
                {Math.round((s.n / (total || 1)) * 100)}%
              </span>
            </span>
          </div>
          <span className="block h-1.5 rounded-full bg-paper">
            <span
              className="block h-full rounded-full bg-navy-800"
              style={{ width: `${(s.n / max) * 100}%` }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}

function Skeleton() {
  const block = "animate-pulse rounded-2xl bg-white ring-1 ring-ink/5";
  return (
    <div className="space-y-5 sm:space-y-6" aria-busy="true" aria-label="Đang tải số liệu">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn(block, "h-[148px]")} />
        ))}
      </div>
      <div className="grid gap-5 sm:gap-6 lg:grid-cols-3">
        <div className={cn(block, "h-80 lg:col-span-2")} />
        <div className={cn(block, "h-80")} />
      </div>
      <div className="grid gap-5 sm:gap-6 lg:grid-cols-3">
        <div className={cn(block, "h-72 lg:col-span-2")} />
        <div className={cn(block, "h-72")} />
      </div>
    </div>
  );
}

/** Chữ ngắn trên điện thoại, chữ đầy đủ từ tablet trở lên (desktop giữ nguyên). */
function ShortLabel({ mobile, full }) {
  return (
    <>
      <span className="sm:hidden">{mobile}</span>
      <span className="max-sm:hidden">{full}</span>
    </>
  );
}
