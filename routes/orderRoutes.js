const express = require("express");
const { body, param, query } = require("express-validator");
const OrderController = require("../controllers/orderController");
const { authenticateJwt } = require("../middlewares/authMiddleware");
const {
  generalApiLimiter,
  createOrderLimiter,
} = require("../middlewares/rateLimitMiddleware");
const { OrderStatus } = require("@prisma/client");

const router = express.Router();

// Validation for clientId and eventId
const validateIds = [
  param("clientId")
    .optional()
    .isString()
    .notEmpty()
    .isLength({ min: 25, max: 30 })
    .withMessage(
      "Invalid client ID format. Must be a valid CUID (25–30 characters)."
    ),
  param("eventId")
    .optional()
    .isString()
    .notEmpty()
    .isLength({ min: 25, max: 30 })
    .withMessage(
      "Invalid event ID format. Must be a valid CUID (25–30 characters)."
    ),
  param("orderId")
    .optional()
    .isString()
    .notEmpty()
    .isLength({ min: 25, max: 30 })
    .withMessage(
      "Invalid order ID format. Must be a valid CUID (25–30 characters)."
    ),
];

// Validation for order creation
const validateOrderFields = [
  body("details")
    .optional()
    .isObject()
    .withMessage("Details must be a JSON object.")
    .custom((value) => {
      try {
        JSON.stringify(value);
      } catch (e) {
        throw new Error("Details must be a valid JSON object.");
      }
      return true;
    }),
  body("price")
    .isFloat({ min: -9999999.99, max: 9999999.99 })
    .withMessage(
      "Price must be a number between -9,999,999.99 and 9,999,999.99."
    ),
  body("currency")
    .optional()
    .isString()
    .isIn(["NGN", "USD", "EUR"]) // Add supported currencies
    .withMessage("Invalid currency. Must be one of: NGN, USD, EUR."),
  body("dueDate")
    .optional()
    .isString()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("Due date must be in YYYY-MM-DD format."),
  body("status")
    .optional()
    .isString()
    .isIn(Object.values(OrderStatus))
    .withMessage(
      `Status must be one of: ${Object.values(OrderStatus).join(", ")}.`
    ),
  body("projectId")
    .optional()
    .isString()
    .isLength({ min: 25, max: 30 })
    .withMessage(
      "Invalid project ID format. Must be a valid CUID (25–30 characters)."
    ),
  body("eventId")
    .optional()
    .isString()
    .isLength({ min: 25, max: 30 })
    .withMessage(
      "Invalid event ID format. Must be a valid CUID (25–30 characters)."
    ),
  body("deposit")
    .optional()
    .isFloat({ min: 0, max: 9999999.99 })
    .withMessage("Deposit must be a positive number up to 9,999,999.99."),
  body("styleDescription")
    .optional()
    .isString()
    .withMessage("Style description must be a string."),
  body("styleImageIds")
    .optional()
    .isArray()
    .withMessage("Style image IDs must be an array.")
    .custom((value) => {
      if (
        !value.every(
          (id) => typeof id === "string" && id.length >= 25 && id.length <= 30
        )
      ) {
        throw new Error(
          "Each style image ID must be a valid CUID (25–30 characters)."
        );
      }
      return true;
    }),
];

// Validation for order status update
const validateOrderStatus = [
  body("status")
    .isString()
    .notEmpty()
    .isIn(Object.values(OrderStatus))
    .withMessage(
      `Status must be one of: ${Object.values(OrderStatus).join(", ")}.`
    ),
];

// Validation for pagination
const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer."),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Page size must be between 1 and 100."),
];

// All routes are protected
router.use(authenticateJwt);

// Routes
router.post(
  "/client/:clientId",
  createOrderLimiter,
  validateIds,
  validateOrderFields,
  OrderController.createOrderForClient
);

router.post(
  "/event/:eventId/client/:clientId",
  createOrderLimiter,
  validateIds,
  validateOrderFields,
  OrderController.createOrderForEvent
);

router.get(
  "/",
  generalApiLimiter,
  validatePagination,
  OrderController.getAllOrdersForAdmin
);

router.get(
  "/client/:clientId",
  generalApiLimiter,
  validateIds,
  validatePagination,
  OrderController.getOrdersByClientId
);

router.get(
  "/:orderId",
  generalApiLimiter,
  validateIds,
  OrderController.getOrderById
);

router.patch(
  "/:orderId/status",
  generalApiLimiter,
  validateIds,
  validateOrderStatus,
  OrderController.updateOrderStatus
);

router.patch(
  "/:orderId",
  generalApiLimiter,
  validateIds,
  validateOrderFields,
  OrderController.updateOrderDetails
);

router.delete(
  "/:orderId",
  generalApiLimiter,
  validateIds,
  OrderController.deleteOrder
);

module.exports = router;
