require("dotenv").config({ path: "./.env" });
const express = require("express");
const loaders = require("./loaders");
const errorHandler = require("./middlewares/errorHandler");

const app = express();
app.set("trust proxy", 1);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Load everything
loaders(app);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Welcome to the Backend API!");
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

  if (process.env.NODE_ENV === "production") {
    const cronManager = require("./loaders/crons");
    cronManager.init();
  }
});

// Log upgrade attempts to help debug WebSocket (wss) handshake failures
try {
  server.on &&
    server.on("upgrade", (req, socket, head) => {
      try {
        console.log("HTTP upgrade request received:", {
          url: req.url,
          headers: req.headers,
          remoteAddress: req.socket && req.socket.remoteAddress,
        });
      } catch (e) {
        console.warn("Failed to log upgrade request", e);
      }
    });
  server.on &&
    server.on("clientError", (err, socket) => {
      console.error("HTTP clientError:", err && err.message);
    });
  server.on &&
    server.on("error", (err) => {
      console.error("HTTP server error:", err && err.message);
    });
} catch (err) {
  console.warn("Unable to attach upgrade/error listeners on server:", err);
}

// --- SOCKET.IO INTEGRATION START ---
const { Server } = require("socket.io");
const { setIO } = require("./socket");
const allowedOrigin =
  process.env.CORS_ALLOWED_ORIGIN || "http://localhost:8080";
const allowedOrigins = allowedOrigin.split(",").map((origin) => origin.trim());
const isDevOrTesting =
  process.env.NODE_ENV !== "production" || process.env.OPEN_CORS === "true";

const io = new Server(server, {
  // Make CORS permissive in dev or accept configured origins in prod
  cors: isDevOrTesting
    ? {
        origin: true,
        methods: ["GET", "POST"],
        credentials: true,
      }
    : {
        origin: allowedOrigins, // allow the full list instead of only the first
        methods: ["GET", "POST"],
        credentials: true,
      },
  // Prefer websocket transport but keep polling as a fallback for proxies that block WS
  transports: ["websocket", "polling"],
});

// Helpful engine-level error logging to debug WebSocket/upgrade failures
try {
  if (io && io.engine) {
    io.engine.on &&
      io.engine.on("connection_error", (err) => {
        console.error("Engine.IO connection error:", err);
      });
  }
} catch (err) {
  console.warn("Unable to attach engine error listener:", err);
}
setIO(io);

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

module.exports.io = io;
// --- SOCKET.IO INTEGRATION END ---

// Graceful shutdown
process.on("SIGTERM", () => {
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
