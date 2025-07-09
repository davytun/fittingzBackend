const rateLimit = require('express-rate-limit');

// Rate limiter for login attempts
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { message: 'Too many login attempts from this IP, please try again after 15 minutes.' },
    // keyGenerator: (req) => req.ip, // Default, but can be customized
    // handler: (req, res, next, options) => res.status(options.statusCode).json(options.message), // Default handler
});

// Example of a more general API limiter (can be applied to all /api routes if needed)
const generalApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs for other API routes
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests from this IP, please try again after 15 minutes.' },
});


module.exports = {
    loginLimiter,
    generalApiLimiter, // Exporting this in case we want to use it later
};
