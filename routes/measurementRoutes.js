const express = require("express");
const { body, param } = require("express-validator");
const MeasurementController = require("../controllers/measurementController");
const { authenticateJwt } = require("../middlewares/authMiddleware");
const {
  generalApiLimiter,
  measurementLimiter,
} = require("../middlewares/rateLimitMiddleware");

const router = express.Router();

// Validation for client ID in params
const validateClientIdInParam = [
  param("clientId")
    .isString()
    .notEmpty()
    .isLength({ min: 25, max: 30 })
    .withMessage(
      "Invalid client ID format. Must be a valid CUID (25–30 characters)."
    ),
];

// Validation for measurement fields
const validateMeasurementFields = [
  body("fields")
    .isObject()
    .withMessage("Measurement fields must be a JSON object.")
    .custom((value) => {
      if (Object.keys(value).length === 0) {
        throw new Error("Fields object cannot be empty.");
      }
      // Ensure fields is valid JSON
      try {
        JSON.stringify(value);
      } catch (e) {
        throw new Error("Fields must be a valid JSON object.");
      }
      return true;
    }),
  body("orderId")
    .optional()
    .isString()
    .isLength({ min: 25, max: 30 })
    .withMessage("Order ID must be a valid CUID (25–30 characters)."),
  body("isDefault")
    .optional()
    .isBoolean()
    .withMessage("isDefault must be a boolean value."),
];

// All measurement routes are protected
router.use(authenticateJwt);

// Routes
router.post(
  "/:clientId/measurements",
  measurementLimiter,
  validateClientIdInParam,
  validateMeasurementFields,
  MeasurementController.addMeasurement
);

router.get(
  "/:clientId/measurements",
  generalApiLimiter,
  validateClientIdInParam,
  MeasurementController.getMeasurementsByClientId
);

router.put(
  "/measurements/:id",
  generalApiLimiter,
  param("id").isString().notEmpty().isLength({ min: 25, max: 30 }),
  validateMeasurementFields,
  MeasurementController.updateMeasurement
);

router.delete(
  "/measurements/:id",
  generalApiLimiter,
  param("id").isString().notEmpty().isLength({ min: 25, max: 30 }),
  MeasurementController.deleteMeasurement
);



module.exports = router;
