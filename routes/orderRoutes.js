const express = require("express");
const { body, param } = require("express-validator");
const orderController = require("../controllers/orderController");
const { authenticateJwt } = require("../middlewares/authMiddleware");
const { OrderStatus } = require("@prisma/client");

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderStatus:
 *       type: string
 *       enum: [PENDING_PAYMENT, PROCESSING, READY_FOR_PICKUP, SHIPPED, DELIVERED, COMPLETED, CANCELLED]
 *       description: Status of the order.
 *       example: PROCESSING
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: cuid
 *           description: Unique identifier for the order.
 *         orderNumber:
 *           type: string
 *           description: Unique order number or identifier.
 *           example: "ORD-20240726-001"
 *         details:
 *           type: string
 *           description: Detailed description or items in the order.
 *           nullable: true
 *           example: "Custom tailored suit, blue silk lining."
 *         price:
 *           type: number
 *           format: float # For display, actual storage is Decimal
 *           description: Total price of the order.
 *           example: 250.75
 *         currency:
 *           type: string
 *           description: Currency code (e.g., NGN, USD).
 *           example: "NGN"
 *         dueDate:
 *           type: string
 *           format: date-time
 *           description: Due date for the order.
 *           nullable: true
 *         status:
 *           $ref: '#/components/schemas/OrderStatus'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         clientId:
 *           type: string
 *           format: cuid
 *         adminId:
 *           type: string
 *           format: cuid
 *         projectId:
 *           type: string
 *           format: cuid
 *           nullable: true
 *         client: # Included in some responses
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *         project: # Included in some responses
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *     OrderInputRequired:
 *       type: object
 *       required:
 *         - orderNumber # Making orderNumber required for creation for now
 *         - price
 *       properties:
 *         orderNumber:
 *           type: string
 *           example: "ORD-UNIQUE-123"
 *         details:
 *           type: string
 *           nullable: true
 *         price:
 *           type: number
 *           format: float
 *           example: 150.00
 *         currency:
 *           type: string
 *           example: "NGN"
 *         dueDate:
 *           type: string
 *           format: date # Or date-time
 *           nullable: true
 *         status:
 *           $ref: '#/components/schemas/OrderStatus'
 *         projectId:
 *           type: string
 *           format: cuid
 *           nullable: true
 *     OrderUpdateDetailsInput: # For PUT /details
 *       type: object
 *       properties:
 *         orderNumber:
 *           type: string
 *           example: "ORD-UNIQUE-123-MOD"
 *         details:
 *           type: string
 *           nullable: true
 *         price:
 *           type: number
 *           format: float
 *           nullable: true
 *         currency:
 *           type: string
 *           example: "USD"
 *           nullable: true
 *         dueDate:
 *           type: string
 *           format: date # Or date-time
 *           nullable: true
 *         projectId:
 *           type: string
 *           format: cuid
 *           description: "Provide an empty string or null to remove project link."
 *           nullable: true
 *     OrderStatusUpdateInput:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           $ref: '#/components/schemas/OrderStatus'
 *   requestBodies:
 *     OrderCreationBody:
 *       description: Order details for creation. `clientId` is part of the URL.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderInputRequired'
 *     OrderDetailsUpdateBody:
 *       description: Order details for update. All fields are optional.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderUpdateDetailsInput'
 *     OrderStatusUpdateBody:
 *       description: New status for the order.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderStatusUpdateInput'
 * tags:
 *   name: Orders
 *   description: Order management operations (Requires authentication)
 */

const router = express.Router();

// All order routes are protected
router.use(authenticateJwt);

// Validation for IDs in params
const validateClientIdInParam = [
  param("clientId")
    .isString()
    .notEmpty()
    .withMessage("Client ID parameter is required."),
];
const validateOrderIdInParam = [
  param("orderId")
    .isString()
    .notEmpty()
    .withMessage("Order ID parameter is required."),
];

// Validation for creating an order
const validateCreateOrderInput = [
  body("orderNumber")
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .withMessage("Order number must be a string if provided."),
  body("details").optional({ checkFalsy: true }).isString().trim(),
  body("price")
    .isDecimal()
    .withMessage("Price must be a valid decimal number.")
    .toFloat(), // Convert to float for Prisma Decimal
  body("currency")
    .optional({ checkFalsy: true })
    .isString()
    .isLength({ min: 3, max: 3 })
    .withMessage("Currency must be a 3-letter code."),
  body("dueDate")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate()
    .withMessage("Invalid due date format."),
  body("status")
    .optional()
    .isIn(Object.values(OrderStatus))
    .withMessage(
      `Invalid status. Must be one of: ${Object.values(OrderStatus).join(", ")}`
    ),
  body("projectId")
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .withMessage("Project ID must be a string if provided."),
  body("deposit")
    .optional({ checkFalsy: true })
    .isDecimal()
    .withMessage("Deposit must be a valid decimal number if provided.")
    .toFloat(),
  body("styleDescription")
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .withMessage("Style description must be a string if provided."),
  body("styleImageIds")
    .optional()
    .isArray()
    .withMessage("Style image IDs must be an array if provided."),
];

// Validation for updating order status
const validateUpdateOrderStatusInput = [
  body("status")
    .isIn(Object.values(OrderStatus))
    .withMessage(
      `Invalid status. Must be one of: ${Object.values(OrderStatus).join(", ")}`
    ),
];

// Validation for updating order details (subset of create, fields are optional)
const validateUpdateOrderDetailsInput = [
  body("orderNumber")
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .withMessage("Order number must be a string if provided."),
  body("details").optional({ checkFalsy: true }).isString().trim(),
  body("price")
    .optional({ checkFalsy: true })
    .isDecimal()
    .withMessage("Price must be a valid decimal number if provided.")
    .toFloat(),
  body("currency")
    .optional({ checkFalsy: true })
    .isString()
    .isLength({ min: 3, max: 3 })
    .withMessage("Currency must be a 3-letter code if provided."),
  body("dueDate")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate()
    .withMessage("Invalid due date format if provided."),
  // status is updated via its own endpoint
  body("projectId")
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .withMessage(
      "Project ID must be a string if provided or empty string to remove."
    ),
  body("deposit")
    .optional({ checkFalsy: true })
    .isDecimal()
    .withMessage("Deposit must be a valid decimal number if provided.")
    .toFloat(),
  body("styleDescription")
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .withMessage("Style description must be a string if provided."),
  body("styleImageIds")
    .optional()
    .isArray()
    .withMessage("Style image IDs must be an array if provided."),
];

// @route   POST /api/orders/client/:clientId
// @desc    Create a new order for a specific client
// @access  Private (Admin only)
/**
 * @swagger
 * /api/orders/client/{clientId}:
 *   post:
 *     summary: Create a new order for a client
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     description: Creates a new order linked to a specific client. The client must belong to the authenticated admin.
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The ID of the client for whom the order is being created.
 *     requestBody:
 *       $ref: '#/components/requestBodies/OrderCreationBody'
 *     responses:
 *       '201':
 *         description: Order created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       '400':
 *         description: Bad request (e.g., validation error, invalid client/project ID, duplicate orderNumber).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Forbidden (client or project does not belong to the admin).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Client or Project not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/client/:clientId",
  validateClientIdInParam,
  validateCreateOrderInput,
  orderController.createOrderForClient
);

// @route   POST /api/orders/event/:eventId/client/:clientId
// @desc    Create a new order for a specific event and client
// @access  Private (Admin only)
router.post(
  "/event/:eventId/client/:clientId",
  [
    param("eventId").isString().notEmpty().withMessage("Event ID parameter is required."),
    param("clientId").isString().notEmpty().withMessage("Client ID parameter is required."),
  ],
  validateCreateOrderInput,
  orderController.createOrderForEvent
);

// @route   GET /api/orders
// @desc    Get all orders for the authenticated admin
// @access  Private (Admin only)
/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders for the authenticated admin
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieves a list of all orders associated with the currently authenticated admin.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination.
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of items per page.
 *     responses:
 *       '200':
 *         description: A paginated list of orders.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     pageSize:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 100
 *                     totalPages:
 *                       type: integer
 *                       example: 10
 *       '401':
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", orderController.getAllOrdersForAdmin);

// @route   GET /api/orders/client/:clientId
// @desc    Get all orders for a specific client
// @access  Private (Admin only)
/**
 * @swagger
 * /api/orders/client/{clientId}:
 *   get:
 *     summary: Get all orders for a specific client
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieves all orders for a specific client. The client must belong to the authenticated admin.
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The ID of the client whose orders are to be retrieved.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination.
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of items per page.
 *     responses:
 *       '200':
 *         description: A paginated list of orders for the client.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     pageSize:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 100
 *                     totalPages:
 *                       type: integer
 *                       example: 10
 *       '401':
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Forbidden (client does not belong to the admin).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Client not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/client/:clientId",
  validateClientIdInParam,
  orderController.getOrdersByClientId
);

// @route   GET /api/orders/:orderId
// @desc    Get a single order by its ID
// @access  Private (Admin only)
/**
 * @swagger
 * /api/orders/{orderId}:
 *   get:
 *     summary: Get a single order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieves a specific order by its ID. The order must belong to the authenticated admin.
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The ID of the order to retrieve.
 *     responses:
 *       '200':
 *         description: Detailed information about the order.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       '401':
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Forbidden (order does not belong to the admin).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Order not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:orderId", validateOrderIdInParam, orderController.getOrderById);

// @route   PATCH /api/orders/:orderId/status
// @desc    Update the status of an order
// @access  Private (Admin only)
/**
 * @swagger
 * /api/orders/{orderId}/status:
 *   patch:
 *     summary: Update the status of an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     description: Partially updates the status of a specific order. The order must belong to the authenticated admin.
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The ID of the order whose status is to be updated.
 *     requestBody:
 *       $ref: '#/components/requestBodies/OrderStatusUpdateBody'
 *     responses:
 *       '200':
 *         description: Order status updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       '400':
 *         description: Bad request (e.g., invalid status value).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Forbidden (order does not belong to the admin).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Order not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/:orderId/status",
  validateOrderIdInParam,
  validateUpdateOrderStatusInput,
  orderController.updateOrderStatus
);

// @route   PUT /api/orders/:orderId/details
// @desc    Update the details of an order
// @access  Private (Admin only)
/**
 * @swagger
 * /api/orders/{orderId}/details:
 *   put:
 *     summary: Update the details of an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     description: Updates various details of an order (e.g., orderNumber, details, price, dueDate, projectId). The order must belong to the authenticated admin.
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The ID of the order to update.
 *     requestBody:
 *       $ref: '#/components/requestBodies/OrderDetailsUpdateBody'
 *     responses:
 *       '200':
 *         description: Order details updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       '400':
 *         description: Bad request (e.g., validation error, duplicate orderNumber).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Forbidden (order or associated project does not belong to the admin).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Order or Project not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put(
  "/:orderId/details",
  validateOrderIdInParam,
  validateUpdateOrderDetailsInput,
  orderController.updateOrderDetails
);

// @route   DELETE /api/orders/:orderId
// @desc    Delete an order by its ID
// @access  Private (Admin only)
/**
 * @swagger
 * /api/orders/{orderId}:
 *   delete:
 *     summary: Delete an order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     description: Deletes a specific order by its ID. The order must belong to the authenticated admin.
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The ID of the order to delete.
 *     responses:
 *       '200':
 *         description: Order deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Order deleted successfully
 *       '401':
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Forbidden (order does not belong to the admin).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Order not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:orderId", validateOrderIdInParam, orderController.deleteOrder);

module.exports = router;
