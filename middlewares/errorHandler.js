const ApiResponse = require('../utils/response');

// Basic error handling middleware
// This middleware will catch errors passed by next(error)
const errorHandler = (err, req, res, next) => {
    console.error("An error occurred:", err.stack || err);

    // If headers have already been sent, delegate to the default Express error handler
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.statusCode || 500;
    let message = err.message || 'Something went wrong. Please try again.';
    let errorType = 'SERVER_ERROR';

    // Handle specific error types with user-friendly messages
    if (err.name === 'ValidationError') {
        message = 'Please check your input and try again';
        errorType = 'VALIDATION_ERROR';
    } else if (err.name === 'CastError') {
        message = 'Invalid data provided';
        errorType = 'INVALID_DATA';
    } else if (err.code === 11000) {
        message = 'This information already exists';
        errorType = 'DUPLICATE_ERROR';
    } else if (statusCode === 404) {
        message = 'The requested resource was not found';
        errorType = 'NOT_FOUND';
    } else if (statusCode >= 500) {
        message = 'Something went wrong on our end. Please try again.';
        errorType = 'SERVER_ERROR';
    }

    return ApiResponse.error(res, message, statusCode, errorType);
};

module.exports = errorHandler;
