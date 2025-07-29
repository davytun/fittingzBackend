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

// --- SOCKET.IO INTEGRATION START ---
const { Server } = require("socket.io");
const { setIO } = require("./socket");
const allowedOrigin = process.env.CORS_ALLOWED_ORIGIN || "http://localhost:8080";
const allowedOrigins = allowedOrigin.split(",").map((origin) => origin.trim());
const isDevOrTesting = process.env.NODE_ENV !== "production" || process.env.OPEN_CORS === "true";

const io = new Server(server, isDevOrTesting
  ? {
      cors: {
        origin: true,
        methods: ["GET", "POST"],
        credentials: true,
      },
    }
  : {
      cors: {
        origin: allowedOrigins[0],
        methods: ["GET", "POST"],
        credentials: true,
      },
    }
);
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
