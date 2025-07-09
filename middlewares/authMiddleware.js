const passport = require('passport');

// This middleware authenticates requests using the JWT strategy.
// If authentication is successful, the user (admin in this case) object is attached to req.user.
// If authentication fails, it returns a 401 Unauthorized error.
const authenticateJwt = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
        if (err) {
            // Handle system error (e.g., database error during user lookup)
            console.error("Authentication error:", err);
            return next(err);
        }
        if (!user) {
            let responseJson = { message: 'Authentication required. Please log in.' }; // More user-friendly default
            let statusCode = 401;

            if (info) {
                // console.log('Passport auth info:', info); // For debugging what info contains
                switch (info.name || (info.message ? info.message.split(':')[0].trim() : '')) { // Try to get error name
                    case 'TokenExpiredError':
                        responseJson.message = 'Your session has expired. Please log in again.';
                        responseJson.errorType = 'TOKEN_EXPIRED';
                        break;
                    case 'JsonWebTokenError': // Covers malformed tokens, invalid signature etc.
                        responseJson.message = 'Invalid session token. Please log in again.';
                        responseJson.errorType = 'INVALID_TOKEN';
                        break;
                    case 'Error': // passport-jwt sometimes throws generic Error for 'No auth token'
                        if (info.message && info.message.toLowerCase().includes('no auth token')) {
                            responseJson.message = 'No authentication token provided. Please log in.';
                            responseJson.errorType = 'NO_TOKEN';
                        } else if (info.message) {
                             responseJson.message = info.message; // Use specific message if available
                        }
                        break;
                    default: // For other generic info messages or if info.name is not set
                        if (info.message) {
                             responseJson.message = info.message;
                             if (info.message.toLowerCase().includes('no auth token')) {
                                 responseJson.errorType = 'NO_TOKEN';
                             } else if (info.message.toLowerCase().includes('jwt expired')) {
                                 responseJson.message = 'Your session has expired. Please log in again.';
                                 responseJson.errorType = 'TOKEN_EXPIRED';
                             }
                        } else if (typeof info === 'string') {
                            responseJson.message = info;
                        }
                        break;
                }
            }
            return res.status(statusCode).json(responseJson);
        }
        // Authentication successful, attach user to request object
        req.user = user;
        next();
    })(req, res, next);
};

module.exports = {
    authenticateJwt,
    // Add other role-based middlewares if needed in the future
    // e.g., isAdmin, isClient, etc.
};
