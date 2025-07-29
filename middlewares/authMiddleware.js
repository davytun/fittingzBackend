const passport = require("passport");

// This middleware authenticates requests using the JWT strategy.
// If authentication is successful, the user (admin in this case) object is attached to req.user.
// If authentication fails, it returns a 401 Unauthorized error.
const authenticateJwt = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) {
      // Handle system error (e.g., database error during user lookup)
      console.error("Authentication error:", err);
      return next(err);
    }
    if (!user) {
      let responseJson = { message: "Authentication required. Please log in." }; // More user-friendly default
      let statusCode = 401;

      if (info) {
        // console.log('Passport auth info:', info); // For debugging what info contains
        switch (
          info.name ||
          (info.message ? info.message.split(":")[0].trim() : "") // Try to get error name
        ) {
          case "TokenExpiredError":
            responseJson.message =
              "Your session has expired. Please log in again.";
            responseJson.errorType = "TOKEN_EXPIRED";
            break;
          case "JsonWebTokenError": // Covers malformed tokens, invalid signature etc.
            responseJson.message =
              "Invalid session token. Please log in again.";
            responseJson.errorType = "INVALID_TOKEN";
            break;
          case "Error": // passport-jwt sometimes throws generic Error for 'No auth token'
            if (
              info.message &&
              info.message.toLowerCase().includes("no auth token")
            ) {
              responseJson.message =
                "No authentication token provided. Please log in.";
              responseJson.errorType = "NO_TOKEN";
            } else if (info.message) {
              responseJson.message = info.message; 
            }
            break;
          default:
            if (info.message) {
              responseJson.message = info.message;
              if (info.message.toLowerCase().includes("no auth token")) {
                responseJson.errorType = "NO_TOKEN";
              } else if (info.message.toLowerCase().includes("jwt expired")) {
                responseJson.message =
                  "Your session has expired. Please log in again.";
                responseJson.errorType = "TOKEN_EXPIRED";
              }
            } else if (typeof info === "string") {
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

// This middleware authorizes requests based on the user's role.
const authorize = (role) => {
  return (req, res, next) => {
    // req.user should be populated by authenticateJwt middleware
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Authentication required for this action." });
    }

    // Assuming user.role exists and is a string
    if (req.user.role !== role) {
      return res
        .status(403)
        .json({ message: `Access denied. Requires ${role} role.` });
    }
    next();
  };
};

module.exports = {
  authenticateJwt,
  authorize, 
};
