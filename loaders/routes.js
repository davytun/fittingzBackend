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
  const isProduction = process.env.NODE_ENV === 'production';
  
  app.use("/api/v1/auth", authRoutes);
  
  if (isProduction) {
    app.use("/api/v1/profile", generalApiLimiter, profileRoutes);
    app.use("/api/v1/clients", generalApiLimiter, clientRoutes);
    app.use("/api/v1/clients", generalApiLimiter, measurementRoutes);
    app.use("/api/v1/clients", generalApiLimiter, orderRoutes);
    app.use("/api/v1/clients", generalApiLimiter, styleImageRoutes);
    app.use("/api/v1/projects", generalApiLimiter, projectRoutes);
    app.use("/api/v1/events", generalApiLimiter, eventRoutes);
    app.use("/api/v1/clients", generalApiLimiter, paymentRoutes);
  } else {
    app.use("/api/v1/profile", profileRoutes);
    app.use("/api/v1/clients", clientRoutes);
    app.use("/api/v1/clients", measurementRoutes);
    app.use("/api/v1/clients", orderRoutes);
    app.use("/api/v1/clients", styleImageRoutes);
    app.use("/api/v1/projects", projectRoutes);
    app.use("/api/v1/events", eventRoutes);
    app.use("/api/v1/clients", paymentRoutes);
  }
  
  app.use("/test", require("../routes/health"));

  return app;
};