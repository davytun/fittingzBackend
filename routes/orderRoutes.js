const express = require("express");
const { body, param, query } = require("express-validator");
const { OrderStatus } = require("@prisma/client");
const OrderController = require("../controllers/orderController");
const { authenticateJwt } = require("../middlewares/authMiddleware");
const {
  generalApiLimiter,
  createOrderLimiter,
} = require("../middlewares/rateLimitMiddleware");

const router = express.Router();

// Validation for IDs in params
const validateId = (field) =>
  param(field)
    .isString()
    .notEmpty()
    .isLength({ min: 25, max: 30 })
    .withMessage(
      `Invalid ${field} format. Must be a valid CUID (25–30 characters).`
    );

// Validation for order creation
const validateOrderCreation = [
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
      "Price must be a number between -9,999,999.99 and 9,999,999.99"
    )
    .toFloat(),
  body("currency")
    .optional()
    .isString()
    .isLength({ min: 3, max: 3 })
    .withMessage("Currency must be a 3-letter code (e.g., NGN)."),
  body("dueDate")
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("Due date must be in YYYY-MM-DD format."),
  body("status")
    .optional()
    .isIn(Object.values(OrderStatus))
    .withMessage(
      `Status must be one of: ${Object.values(OrderStatus).join(", ")}`
    ),
  body("projectId")
    .optional()
    .isString()
    .isLength({ min: 25, max: 30 })
    .withMessage("Project ID must be a valid CUID (25–30 characters)."),
  body("eventId")
    .optional()
    .isString()
    .isLength({ min: 25, max: 30 })
    .withMessage("Event ID must be a valid CUID (25–30 characters)."),
  body("deposit")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Deposit must be a non-negative number.")
    .toFloat(),
  body("styleDescription")
    .optional()
    .isString()
    .withMessage("Style description must be a string."),
  body("styleImageIds")
    .optional()
    .isArray()
    .withMessage("Style image IDs must be an array.")
    .custom((value) => {
      if (value.length > 0) {
        for (const id of value) {
          if (typeof id !== "string" || id.length < 25 || id.length > 30) {
            throw new Error(
              "Each style image ID must be a valid CUID (25–30 characters)."
            );
          }
        }
      }
      return true;
    }),
];

// Validation for order status update
const validateOrderStatus = [
  body("status")
    .isIn(Object.values(OrderStatus))
    .withMessage(
      `Status must be one of: ${Object.values(OrderStatus).join(", ")}`
    ),
];

// Validation for pagination
const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer.")
    .toInt(),
  query("pageSize")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page size must be a positive integer.")
    .toInt(),
];

// All order routes are protected
router.use(authenticateJwt);

// Create order for a client
router.post(
  "/clients/:clientId",
  createOrderLimiter,
  validateId("clientId"),
  validateOrderCreation,
  OrderController.createOrderForClient
);

// Create order for an event and client
router.post(
  "/events/:eventId/clients/:clientId",
  createOrderLimiter,
  validateId("eventId"),
  validateId("clientId"),
  validateOrderCreation,
  OrderController.createOrderForEvent
);

// Get all orders for admin
router.get(
  "/",
  generalApiLimiter,
  validatePagination,
  OrderController.getAllOrdersForAdmin
);

// Get orders by client ID
router.get(
  "/clients/:clientId",
  generalApiLimiter,
  validateId("clientId"),
  validatePagination,
  OrderController.getOrdersByClientId
);

// Get order by ID
router.get(
  "/:orderId",
  generalApiLimiter,
  validateId("orderId"),
  OrderController.getOrderById
);

// Update order status
router.patch(
  "/:orderId/status",
  generalApiLimiter,
  validateId("orderId"),
  validateOrderStatus,
  OrderController.updateOrderStatus
);

// Update order details
router.patch(
  "/:orderId",
  generalApiLimiter,
  validateId("orderId"),
  validateOrderCreation, // Reuse create validation, as all fields are optional
  OrderController.updateOrderDetails
);

// Delete order
router.delete(
  "/:orderId",
  generalApiLimiter,
  validateId("orderId"),
  OrderController.deleteOrder
);

module.exports = router;
