const expressLoader = require("./express");
const passportLoader = require("./passport");
const routeLoader = require("./routes");
const swaggerLoader = require("./swagger");
const cronManager = require("./crons");

module.exports = (app) => {
  // Load core modules
  expressLoader(app);
  passportLoader(app);
  routeLoader(app);
  swaggerLoader(app);

  // Initialize cron jobs after core modules are loaded
  cronManager.init();

  console.log("✓ Express, Passport, Routes, Swagger, and Cron system loaded");
};
