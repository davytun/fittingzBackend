const rateLimit = require("express-rate-limit");

// Disable rate limiting in development
const isDevelopment = process.env.NODE_ENV === 'development';

const loginLimiter = isDevelopment ? (req, res, next) => next() : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Too many login attempts from this IP, please try again after 15 minutes.",
  },
});

const registerLimiter = isDevelopment ? (req, res, next) => next() : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Too many registration attempts from this IP, please try again after 15 minutes.",
  },
});

const resendLimiter = isDevelopment ? (req, res, next) => next() : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Too many resend attempts from this IP, please try again after 15 minutes.",
  },
});

const createClientLimiter = isDevelopment ? (req, res, next) => next() : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Too many client creation attempts from this IP, please try again after 15 minutes.",
  },
});

const measurementLimiter = isDevelopment ? (req, res, next) => next() : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Too many measurement creation attempts from this IP, please try again after 15 minutes.",
  },
});

const createOrderLimiter = isDevelopment ? (req, res, next) => next() : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Too many order creation attempts from this IP, please try again after 15 minutes.",
  },
});

const generalApiLimiter = isDevelopment ? (req, res, next) => next() : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message:
      "Too many requests from this IP, please try again after 15 minutes.",
  },
});

module.exports = {
  loginLimiter,
  registerLimiter,
  resendLimiter,
  createClientLimiter,
  measurementLimiter,
  createOrderLimiter,
  generalApiLimiter,
};
