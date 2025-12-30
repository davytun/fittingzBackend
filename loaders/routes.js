const authRoutes = require("../routes/authRoutes");
const clientRoutes = require("../routes/clientRoutes");
const measurementRoutes = require("../routes/measurementRoutes");
const styleImageRoutes = require("../routes/styleImageRoutes");
const projectRoutes = require("../routes/projectRoutes");
const orderRoutes = require("../routes/orderRoutes");
const eventRoutes = require("../routes/eventRoutes");
const paymentRoutes = require("../routes/paymentRoutes");
const profileRoutes = require("../routes/profileRoutes");
const recentUpdateRoutes = require("../routes/recentUpdateRoutes");
const notificationRoutes = require("../routes/notificationRoutes");
const dashboardRoutes = require("../routes/dashboardRoutes");
const {
  generalApiLimiter,
  loginLimiter,
  registerLimiter,
  resendLimiter,
} = require("../middlewares/rateLimitMiddleware");

module.exports = (app) => {
  const isProduction = process.env.NODE_ENV === "production";

  // Apply rate limiting to all auth routes for security
  app.use(
    "/api/v1/auth",
    loginLimiter,
    registerLimiter,
    resendLimiter,
    authRoutes
  );

  if (isProduction) {
    app.use("/api/v1/dashboard", generalApiLimiter, dashboardRoutes);
    app.use("/api/v1/profile", generalApiLimiter, profileRoutes);
    app.use("/api/v1/clients", generalApiLimiter, clientRoutes);
    app.use("/api/v1/clients", generalApiLimiter, measurementRoutes);
    app.use("/api/v1/clients", generalApiLimiter, orderRoutes);
    app.use("/api/v1/clients", generalApiLimiter, styleImageRoutes);
    app.use("/api/v1", generalApiLimiter, styleImageRoutes);
    app.use("/api/v1/projects", generalApiLimiter, projectRoutes);
    app.use("/api/v1/events", generalApiLimiter, eventRoutes);
    app.use("/api/v1/clients", generalApiLimiter, paymentRoutes);
    app.use("/api/v1/recent-updates", generalApiLimiter, recentUpdateRoutes);
    app.use("/api/v1/notifications", generalApiLimiter, notificationRoutes);
  } else {
    app.use("/api/v1/dashboard", dashboardRoutes);
    app.use("/api/v1/profile", profileRoutes);
    app.use("/api/v1/clients", clientRoutes);
    app.use("/api/v1/clients", measurementRoutes);
    app.use("/api/v1/clients", orderRoutes);
    app.use("/api/v1/clients", styleImageRoutes);
    app.use("/api/v1", styleImageRoutes);
    app.use("/api/v1/projects", projectRoutes);
    app.use("/api/v1/events", eventRoutes);
    app.use("/api/v1/clients", paymentRoutes);
    app.use("/api/v1/recent-updates", recentUpdateRoutes);
    app.use("/api/v1/notifications", notificationRoutes);
  }

  app.use("/test", require("../routes/health"));

  return app;
};
