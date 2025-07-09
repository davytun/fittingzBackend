const express = require("express");
const dotenv = require("dotenv");
const loaders = require("./loaders");
const errorHandler = require("./middlewares/errorHandler");

dotenv.config();

const app = express();

app.set("trust proxy", 1);

// Load everything
loaders(app);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
