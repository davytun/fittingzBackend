const JWTUtils = require("../utils/jwt");
const ApiResponse = require("../utils/response");

const authenticateJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return ApiResponse.error(res, "No authentication token provided. Please log in.", 401, "NO_TOKEN");
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const decoded = JWTUtils.verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.error(res, "Your session has expired. Please log in again.", 401, "TOKEN_EXPIRED");
    } else if (error.name === 'JsonWebTokenError') {
      return ApiResponse.error(res, "Invalid session token. Please log in again.", 401, "INVALID_TOKEN");
    } else {
      return ApiResponse.error(res, "Authentication failed.", 401, "AUTH_FAILED");
    }
  }
};

const authorize = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(res, "Authentication required for this action.", 401, "NO_USER");
    }

    if (req.user.role !== role) {
      return ApiResponse.error(res, `Access denied. Requires ${role} role.`, 403, "INSUFFICIENT_PERMISSIONS");
    }
    next();
  };
};

module.exports = {
  authenticateJwt,
  authorize,
};