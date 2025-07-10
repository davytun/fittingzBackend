const express = require("express");
const dotenv = require("dotenv");
const loaders = require("./loaders");
const errorHandler = require("./middlewares/errorHandler");

dotenv.config();

const app = express();
app.set("trust proxy", 1);

// Health check endpoint (register early)
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

  // Start cron jobs AFTER server is ready
  if (process.env.NODE_ENV === "production") {
    const cronManager = require("./loaders/crons");
    cronManager.init();
  }
});

// Graceful shutdown
process.on("SIGTERM", () => {
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
