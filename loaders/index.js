const expressLoader = require("./express");
const passportLoader = require("./passport");
const routeLoader = require("./routes");
const swaggerLoader = require("./swagger");

module.exports = (app) => {
  // Load core modules
  expressLoader(app);
  passportLoader(app);
  routeLoader(app);
  swaggerLoader(app);

  console.log("✓ Express, Passport, Routes, Swagger, and Cron system loaded");
};
