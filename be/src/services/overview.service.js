import { databaseState } from "#config/database.js";
import { env } from "#config/env.js";
import { bookingRepository } from "#repositories/booking.repository.js";
import { productRepository } from "#repositories/product.repository.js";

const TIMEZONE = "Asia/Ho_Chi_Minh";
const TZ_OFFSET = 7 * 60 * 60 * 1000; // UTC+7, Việt Nam không đổi giờ theo mùa
const DAY = 24 * 60 * 60 * 1000;
const SERIES_DAYS = 30;

/** Nửa đêm (giờ Việt Nam) của ngày chứa `t`, cộng thêm `days` ngày. */
const vnMidnight = (t, days = 0) =>
  new Date(Math.floor((t + TZ_OFFSET) / DAY) * DAY - TZ_OFFSET + days * DAY);
const vnDate = (d) => new Date(d.getTime() + TZ_OFFSET).toISOString().slice(0, 10);

/**
 * TẦNG SERVICE — số liệu cho trang Tổng quan của quản trị.
 * Gom nhiều truy vấn nhỏ chạy song song; mọi mốc ngày tính theo giờ Việt Nam.
 */
export class OverviewService {
  constructor(bookings = bookingRepository, products = productRepository) {
    this.bookings = bookings;
    this.products = products;
  }

  async get(now = Date.now()) {
    const today = vnMidnight(now);
    const seriesStart = vnMidnight(now, -(SERIES_DAYS - 1));
    const weekStart = vnMidnight(now, -6);
    const prevWeekStart = vnMidnight(now, -13);

    const [
      counts,
      daily,
      services,
      todayCount,
      last7,
      prev7,
      open,
      oldest,
      productStats,
      recentProducts,
    ] = await Promise.all([
      this.bookings.countByStatus({ deletedAt: null }),
      this.bookings.dailyCounts(seriesStart, TIMEZONE),
      this.bookings.countByService(),
      this.bookings.countSince(today),
      this.bookings.countSince(weekStart),
      this.bookings.countBetween(prevWeekStart, weekStart),
      this.bookings.recentOpen(5),
      this.bookings.oldestPending(),
      this.products.stats(),
      this.products.recentlyUpdated(4),
    ]);

    // Đủ 30 ngày liên tục (ngày không có yêu cầu = 0) để biểu đồ không bị "nhảy" ngày
    const byDate = new Map(daily.map((d) => [d.date, d.n]));
    const series = Array.from({ length: SERIES_DAYS }, (_, i) => {
      const date = vnDate(new Date(seriesStart.getTime() + i * DAY));
      return { date, n: byDate.get(date) ?? 0 };
    });

    return {
      generatedAt: new Date(now).toISOString(),
      bookings: {
        counts,
        today: todayCount,
        last7,
        prev7,
        series,
        services,
        open: open.map(({ id, name, phone, service, status, createdAt }) => ({
          id,
          name,
          phone,
          service,
          status,
          createdAt,
        })),
        oldestPendingAt: oldest?.createdAt ?? null,
      },
      products: {
        ...productStats,
        recent: recentProducts.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          category: p.category,
          published: p.published,
          updatedAt: p.updatedAt,
          media: (p.media ?? []).length,
          cover:
            p.cover ??
            (p.media ?? []).find((m) => m.type === "image") ??
            (p.media ?? []).find((m) => m.poster) ??
            null,
        })),
      },
      system: {
        database: databaseState(),
        storage: env.hasCloudinary ? "configured" : "not_configured",
      },
    };
  }
}

export const overviewService = new OverviewService();
