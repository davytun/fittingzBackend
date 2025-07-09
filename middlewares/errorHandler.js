// Basic error handling middleware
// This middleware will catch errors passed by next(error)
const errorHandler = (err, req, res, next) => {
    console.error("An error occurred:", err.stack || err);

    const statusCode = err.statusCode || res.statusCode || 500; // Use error's status code, or response's, or default to 500
    const message = err.message || 'Internal Server Error';

    // Avoid sending stack trace in production for security reasons
    const errorResponse = {
        message: message,
    };
    if (process.env.NODE_ENV !== 'production') {
        errorResponse.stack = err.stack;
    }

    // If headers have already been sent, delegate to the default Express error handler
    if (res.headersSent) {
        return next(err);
    }

    res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;
