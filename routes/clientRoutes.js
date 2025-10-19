const express = require("express");
const { body, param, query } = require("express-validator");
const clientController = require("../controllers/clientController");
const { authenticateJwt } = require("../middlewares/authMiddleware");
const { generalApiLimiter } = require("../middlewares/rateLimitMiddleware");

const router = express.Router();

// Middleware to validate client ID in params
const validateClientId = [
  param("id")
    .isString()
    .withMessage("Client ID must be a string.")
    .isLength({ min: 1 })
    .withMessage("Client ID cannot be empty."),
];

// Middleware to validate pagination query parameters
const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .toInt()
    .withMessage("Page must be a positive integer."),
  query("pageSize")
    .optional()
    .isInt({ min: 1 })
    .toInt()
    .withMessage("Page size must be a positive integer."),
];

// Middleware for validating client creation (name required)
const validateClientCreation = [
  body("name").trim().notEmpty().withMessage("Client name is required."),
  body("email")
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage("Please provide a valid email address.")
    .normalizeEmail(),
  body("phone")
    .optional({ checkFalsy: true })
    .matches(/^[\d\s\-\+\(\)]{7,20}$/)
    .withMessage("Please provide a valid phone number."),
  body("eventType")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Event type must be a string."),
  body("favoriteColors")
    .optional()
    .isArray()
    .withMessage("Favorite colors must be an array."),
  body("dislikedColors")
    .optional()
    .isArray()
    .withMessage("Disliked colors must be an array."),
  body("preferredStyles")
    .optional()
    .isArray()
    .withMessage("Preferred styles must be an array."),
  body("bodyShape")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Body shape must be a string."),
  body("additionalDetails")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Additional details must be a string."),
];

// Middleware for validating client updates (all fields optional)
const validateClientUpdate = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Client name cannot be empty if provided."),
  body("email")
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage("Please provide a valid email address.")
    .normalizeEmail(),
  body("phone")
    .optional({ checkFalsy: true })
    .matches(/^[\d\s\-\+\(\)]{7,20}$/)
    .withMessage("Please provide a valid phone number."),
  body("eventType")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Event type must be a string."),
  body("favoriteColors")
    .optional()
    .isArray()
    .withMessage("Favorite colors must be an array."),
  body("dislikedColors")
    .optional()
    .isArray()
    .withMessage("Disliked colors must be an array."),
  body("preferredStyles")
    .optional()
    .isArray()
    .withMessage("Preferred styles must be an array."),
  body("bodyShape")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Body shape must be a string."),
  body("additionalDetails")
    .optional({ checkFalsy: true })
    .isString()
    .withMessage("Additional details must be a string."),
];

// All client routes are protected and require authentication
router.use(authenticateJwt);

// Routes
router.post(
  "/",
  generalApiLimiter,
  validateClientCreation,
  clientController.createClient
);
router.get(
  "/",
  generalApiLimiter,
  validatePagination,
  clientController.getAllClients
);
router.get(
  "/:id",
  generalApiLimiter,
  validateClientId,
  clientController.getClientById
);
router.put(
  "/:id",
  generalApiLimiter,
  validateClientId,
  validateClientUpdate,
  clientController.updateClient
);
router.delete(
  "/:id",
  generalApiLimiter,
  validateClientId,
  clientController.deleteClient
);

module.exports = router;
