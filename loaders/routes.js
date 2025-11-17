const authRoutes = require("../routes/authRoutes");
const clientRoutes = require("../routes/clientRoutes");
const measurementRoutes = require("../routes/measurementRoutes");
const styleImageRoutes = require("../routes/styleImageRoutes");
const projectRoutes = require("../routes/projectRoutes");
const orderRoutes = require("../routes/orderRoutes");
const eventRoutes = require("../routes/eventRoutes");
const paymentRoutes = require("../routes/paymentRoutes");
const profileRoutes = require("../routes/profileRoutes");
const { generalApiLimiter } = require("../middlewares/rateLimitMiddleware");

module.exports = (app) => {
  app.use("/api/v1/auth", authRoutes);
  // Apply general API rate limiter to all other API routes
  app.use("/api/v1/profile", generalApiLimiter, profileRoutes);
  app.use("/api/v1/clients", generalApiLimiter, clientRoutes);
  app.use("/api/v1/clients", generalApiLimiter, measurementRoutes);
  app.use("/api/v1/styles", generalApiLimiter, styleImageRoutes);
  app.use("/api/v1/projects", generalApiLimiter, projectRoutes);
  app.use("/api/v1/orders", generalApiLimiter, orderRoutes);
  app.use("/api/v1/events", generalApiLimiter, eventRoutes);
  app.use("/api/v1/", generalApiLimiter, paymentRoutes);
  app.use("/test", require("../routes/health"));

  return app;
};
