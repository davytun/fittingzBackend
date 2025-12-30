const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("../config/swaggerConfig");
const { authenticateJwt } = require("../middlewares/authMiddleware");

module.exports = (app) => {
  // Protect Swagger docs with JWT authentication in production
  const isProduction = process.env.NODE_ENV === "production";
  const swaggerMiddleware = isProduction ? [authenticateJwt] : [];

  app.use(
    "/api/v1/docs",
    ...swaggerMiddleware,
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
  );

  return app;
};
