const authRoutes = require("../routes/authRoutes");
const clientRoutes = require("../routes/clientRoutes");
const measurementRoutes = require("../routes/measurementRoutes");
const styleImageRoutes = require("../routes/styleImageRoutes");
const projectRoutes = require("../routes/projectRoutes");
const orderRoutes = require("../routes/orderRoutes");
const eventRoutes = require("../routes/eventRoutes");
const paymentRoutes = require("../routes/paymentRoutes");
const { generalApiLimiter } = require("../middlewares/rateLimitMiddleware");

module.exports = (app) => {
  app.use("/api/auth", authRoutes);
  // Apply general API rate limiter to all other API routes
  app.use("/api/clients", generalApiLimiter, clientRoutes);
  app.use("/api/measurements", generalApiLimiter, measurementRoutes);
  app.use("/api/styles", generalApiLimiter, styleImageRoutes);
  app.use("/api/projects", generalApiLimiter, projectRoutes);
  app.use("/api/orders", generalApiLimiter, orderRoutes);
  app.use("/api/events", generalApiLimiter, eventRoutes);
  app.use("/api", generalApiLimiter, paymentRoutes);
  app.use("/test", require("../routes/health"));

  return app;
};
