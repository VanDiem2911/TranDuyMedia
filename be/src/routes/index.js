import { Router } from "express";
import { databaseState } from "#config/database.js";
import { env } from "#config/env.js";
import authRoutes from "#routes/auth.routes.js";
import bookingRoutes from "#routes/booking.routes.js";
import contentRoutes from "#routes/content.routes.js";
import mediaRoutes from "#routes/media.routes.js";
import overviewRoutes from "#routes/overview.routes.js";
import productRoutes from "#routes/product.routes.js";

/** Gom toàn bộ route của API phiên bản v1 (mount tại /api/v1 trong app.js). */
const router = Router();

router.get("/health", (_req, res) => {
  const database = databaseState();
  res.status(database === "connected" ? 200 : 503).json({
    success: database === "connected",
    data: {
      status: database === "connected" ? "ok" : "degraded",
      uptime: Math.round(process.uptime()),
      database,
      cloudinary: env.hasCloudinary ? "configured" : "not_configured",
    },
  });
});

// Phản hồi xác thực không bao giờ được cache (proxy / trình duyệt)
router.use(
  "/auth",
  (_req, res, next) => (res.set("Cache-Control", "no-store"), next()),
  authRoutes,
);
router.use("/bookings", bookingRoutes);
router.use("/content", contentRoutes);
router.use("/media", mediaRoutes);
router.use("/products", productRoutes);
router.use("/overview", overviewRoutes);

export default router;
