const express = require("express");
const helmet = require("helmet");
const compression = require("compression");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const passport = require("passport");

module.exports = (app) => {
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

  // CORS must come before Helmet
  app.use(cors(corsOptions));
  
  // Security & performance middlewares
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(compression({ level: 1 }));
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Handle invalid JSON payloads from express.json()
  // body-parser (used internally by express.json) throws a SyntaxError when JSON is malformed.
  // Catch those here and return a 400 with a helpful message instead of letting the error bubble uncontrolled.
  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
      // Bad JSON
      console.warn("Invalid JSON received:", err.message);
      return res.status(400).json({ message: "Invalid JSON payload" });
    }
    next(err);
  });
  app.use(passport.initialize());

  // Debug CORS configuration
  console.log(`[CORS] NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`[CORS] OPEN_CORS: ${process.env.OPEN_CORS}`);
  console.log(`[CORS] Allowed origins: ${allowedOrigins.join(", ")}`);
  console.log(`[CORS] Open mode: ${isDevOrTesting ? "ENABLED" : "STRICT"}`);
  console.log(`[CORS] Final corsOptions:`, JSON.stringify(corsOptions, null, 2));
  
  // Add debug endpoint
  app.get('/debug-cors', (req, res) => {
    res.json({
      NODE_ENV: process.env.NODE_ENV,
      OPEN_CORS: process.env.OPEN_CORS,
      allowedOrigins,
      isDevOrTesting,
      corsOptions: {
        ...corsOptions,
        origin: typeof corsOptions.origin === 'function' ? 'function' : corsOptions.origin
      }
    });
  });

  return app;
};
