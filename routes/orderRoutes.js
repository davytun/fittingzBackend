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
    .withMessage("Details must be a JSON object."),
  body("price")
    .isFloat({ min: -9999999.99, max: 9999999.99 })
    .withMessage(
      "Price must be a number between -9,999,999.99 and 9,999,999.99."
    ),
  body("currency")
    .optional()
    .isString()
    .isLength({ min: 1, max: 10 })
    .withMessage("Currency must be a string between 1-10 characters."),
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
  body("note").optional().isString().withMessage("Note must be a string."),
  body("measurementId")
    .optional()
    .isString()
    .isLength({ min: 25, max: 30 })
    .withMessage(
      "Invalid measurement ID format. Must be a valid CUID (25–30 characters)."
    ),
];

// Validation for order updates - more lenient
const validateOrderUpdateFields = [
  body("status")
    .optional()
    .isString()
    .isIn(Object.values(OrderStatus))
    .withMessage(`Status must be one of: ${Object.values(OrderStatus).join(", ")}.`),
  body("note")
    .optional()
    .isString()
    .withMessage("Note must be a string.")
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

// Admin route to get all orders - must be before other routes
router.get(
  "/admin/orders",
  generalApiLimiter,
  validatePagination,
  OrderController.getAllOrdersForAdmin
);

// Routes - nested under /client/:clientId/orders
router.post(
  "/:clientId/orders",
  createOrderLimiter,
  validateIds,
  validateOrderFields,
  OrderController.createOrderForClient
);

router.post(
  "/:clientId/orders/event/:eventId",
  createOrderLimiter,
  validateIds,
  validateOrderFields,
  OrderController.createOrderForEvent
);

router.get(
  "/:clientId/orders",
  generalApiLimiter,
  validateIds,
  validatePagination,
  OrderController.getOrdersByClientId
);

router.get(
  "/:clientId/orders/:orderId",
  generalApiLimiter,
  validateIds,
  OrderController.getOrderById
);

router.patch(
  "/:clientId/orders/:orderId/status",
  generalApiLimiter,
  validateIds,
  validateOrderStatus,
  OrderController.updateOrderStatus
);

router.patch(
  "/:clientId/orders/:orderId",
  generalApiLimiter,
  validateIds,
  validateOrderUpdateFields,
  OrderController.updateOrderDetails
);

router.patch(
  "/:clientId/orders/:orderId/link-measurement",
  generalApiLimiter,
  validateIds,
  [
    body("measurementId")
      .isString()
      .notEmpty()
      .isLength({ min: 25, max: 30 })
      .withMessage(
        "Invalid measurement ID format. Must be a valid CUID (25–30 characters)."
      ),
  ],
  OrderController.linkMeasurementToOrder
);

router.delete(
  "/:clientId/orders/:orderId",
  generalApiLimiter,
  validateIds,
  OrderController.deleteOrder
);

module.exports = router;
