const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../config/swaggerConfig');

module.exports = (app) => {
    app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

    return app;
};