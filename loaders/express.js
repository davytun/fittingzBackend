const express = require("express");
const helmet = require("helmet");
const compression = require("compression");
const cors = require("cors");
const passport = require("passport");

module.exports = (app) => {
  // Security & performance middlewares
  app.use(helmet());
  app.use(compression({ level: 1 }));

  // Load allowed origins from env
  const allowedOrigin =
    process.env.CORS_ALLOWED_ORIGIN || "http://localhost:8080";
  const allowedOrigins = allowedOrigin
    .split(",")
    .map((origin) => origin.trim());

  // Toggle full access in dev/test
  const isDevOrTesting =
    process.env.NODE_ENV !== "production" || process.env.OPEN_CORS === "true";

  // Shared CORS config
  const commonCorsConfig = {
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
  };

  // Final CORS options
  const corsOptions = isDevOrTesting
    ? {
        ...commonCorsConfig,
        origin: true, // Allow all
      }
    : {
        ...commonCorsConfig,
        origin: function (origin, callback) {
          if (!origin) return callback(null, true);
          if (allowedOrigins.includes(origin)) {
            return callback(null, true);
          } else {
            return callback(new Error("Not allowed by CORS"));
          }
        },
      };

  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(passport.initialize());

  // Optional: log active CORS mode
  console.log(`[CORS] Allowed origins: ${allowedOrigins.join(", ")}`);
  console.log(`[CORS] Open mode: ${isDevOrTesting ? "ENABLED" : "STRICT"}`);

  return app;
};
