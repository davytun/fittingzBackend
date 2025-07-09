const expressLoader = require('./express');
const passportLoader = require('./passport');
const routeLoader = require('./routes');
const swaggerLoader = require('./swagger');

module.exports = (app) => {
    expressLoader(app);
    passportLoader(app);
    routeLoader(app);
    swaggerLoader(app);

    console.log('Express, Passport, Routes, and Swagger have been loaded.');
};