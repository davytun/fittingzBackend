const express = require("express");
const helmet = require("helmet");
const compression = require("compression");
const cors = require("cors");
const passport = require("passport");
const swaggerUi = require("swagger-ui-express");

module.exports = (app) => {
    // Middlewares
    app.use(helmet());
    app.use(
        compression({
            level: 1,
        })
    );

    // Set allowed origins
    const allowedOrigin =
        process.env.CORS_ALLOWED_ORIGIN || "http://localhost:8080";
    const allowedOrigins = allowedOrigin
        .split(",")
        .map((origin) => origin.trim());

    // Check if we should open CORS for testing
    const isTesting =
        process.env.NODE_ENV === "test" || process.env.OPEN_CORS === "true";

    // CORS options
    const corsOptions = isTesting
        ? {
              origin: true, // Allow all origins during test
              methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
              allowedHeaders: [
                  "Content-Type",
                  "Authorization",
                  "X-Requested-With",
              ],
              credentials: true,
          }
        : {
              origin: function (origin, callback) {
                  if (!origin) return callback(null, true);
                  if (allowedOrigins.includes(origin)) {
                      return callback(null, true);
                  } else {
                      return callback(new Error("Not allowed by CORS"));
                  }
              },
              methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
              allowedHeaders: [
                  "Content-Type",
                  "Authorization",
                  "X-Requested-With",
              ],
              credentials: true,
          };

    app.use(cors(corsOptions));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(passport.initialize());

    return app;
};
