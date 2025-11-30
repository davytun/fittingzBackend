const expressLoader = require("./express");
const passportLoader = require("./passport");
const routeLoader = require("./routes");
const swaggerLoader = require("./swagger");

module.exports = (app) => {
  // Load core modules
  expressLoader(app);
  passportLoader(app);
  swaggerLoader(app); // Load Swagger before routes
  routeLoader(app);

  console.log("✓ Express, Passport, Swagger, Routes, and Cron system loaded");
};
