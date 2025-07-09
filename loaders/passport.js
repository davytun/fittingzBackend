const passport = require("passport");
const initializePassport = require("../config/passport");

module.exports = (app) => {
    initializePassport(passport);
    app.use(passport.initialize());

    return app;
};