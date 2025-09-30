/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The unique ID of the order (CUID, 25–30 characters).
 *           example: cmg5c2q7y0000tv4cpuk0wqa2
 *         orderNumber:
 *           type: string
 *           description: The unique order number (generated server-side).
 *           example: ORD-1698765432112-123
 *         details:
 *           type: object
 *           description: Additional order details. Arbitrary key-value pairs.
 *           example: { "description": "Summer collection", "color": "Blue", "customField": true }
 *         price:
 *           type: number
 *           description: The total price of the order.
 *           example: 25000.00
 *         currency:
 *           type: string
 *           description: The currency of the order (3-letter code).
 *           example: NGN
 *         dueDate:
 *           type: string
 *           format: date-time
 *           description: The due date of the order (optional).
 *           example: 2025-07-20T00:00:00Z
 *           nullable: true
 *         status:
 *           type: string
 *           description: The status of the order.
 *           example: PENDING_PAYMENT
 *           enum: [PENDING_PAYMENT, PROCESSING, COMPLETED, CANCELLED]
 *         clientId:
 *           type: string
 *           description: The ID of the client associated with the order (CUID, 25–30 characters).
 *           example: cmg5c2q7y0000tv4cpuk0wqa0
 *         adminId:
 *           type: string
 *           description: The ID of the admin who owns the order (CUID, 25–30 characters).
 *           example: cmg5c2q7y0000tv4cpuk0wqa0
 *         eventId:
 *           type: string
 *           description: The ID of the event associated with the order (optional, CUID, 25–30 characters).
 *           example: cmg5c2q7y0000tv4cpuk0wqa3
 *           nullable: true
 *         projectId:
 *           type: string
 *           description: The ID of the project associated with the order (optional, CUID, 25–30 characters).
 *           example: cmg5c2q7y0000tv4cpuk0wqa4
 *           nullable: true
 *         deposit:
 *           type: number
 *           description: The deposit amount for the order (optional).
 *           example: 5000.00
 *           nullable: true
 *         styleDescription:
 *           type: string
 *           description: Description of the style for the order (optional).
 *           example: Elegant evening gown
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the order was created.
 *           example: 2025-09-30T13:36:00Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the order was last updated.
 *           example: 2025-09-30T13:36:00Z
 *         client:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: John Doe
 *           description: The client's name.
 *         project:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: Summer Collection
 *           description: The project's name (optional).
 *           nullable: true
 *         event:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: Wedding
 *           description: The event's name (optional).
 *           nullable: true
 *         payments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               amount:
 *                 type: number
 *               notes:
 *                 type: string
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *           description: Payments associated with the order.
 *         styleImages:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               styleImage:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   imageUrl:
 *                     type: string
 *                   publicId:
 *                     type: string
 *                   category:
 *                     type: string
 *                     nullable: true
 *                   description:
 *                     type: string
 *                     nullable: true
 *           description: Style images associated with the order.
 *     CreateOrderRequest:
 *       type: object
 *       required:
 *         - price
 *       properties:
 *         details:
 *           type: object
 *           description: Additional order details. Arbitrary key-value pairs.
 *           example: { "description": "Summer collection", "color": "Blue", "customField": true }
 *         price:
 *           type: number
 *           description: The total price of the order.
 *           example: 25000.00
 *         currency:
 *           type: string
 *           description: The currency of the order (3-letter code, optional).
 *           example: NGN
 *         dueDate:
 *           type: string
 *           description: The due date of the order in YYYY-MM-DD format (optional).
 *           example: 2025-07-20
 *         status:
 *           type: string
 *           description: The status of the order (optional).
 *           example: PENDING_PAYMENT
 *           enum: [PENDING_PAYMENT, PROCESSING, COMPLETED, CANCELLED]
 *         projectId:
 *           type: string
 *           description: The ID of the project (optional, CUID, 25–30 characters).
 *           example: cmg5c2q7y0000tv4cpuk0wqa4
 *         eventId:
 *           type: string
 *           description: The ID of the event (optional, required for event-specific orders, CUID, 25–30 characters).
 *           example: cmg5c2q7y0000tv4cpuk0wqa3
 *         deposit:
 *           type: number
 *           description: The deposit amount for the order (optional).
 *           example: 5000.00
 *         styleDescription:
 *           type: string
 *           description: Description of the style for the order (optional).
 *           example: Elegant evening gown
 *         styleImageIds:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of style image IDs (optional, CUID, 25–30 characters).
 *           example: ["cmg5c2q7y0000tv4cpuk0wqa5"]
 *     OrderListResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Order'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *               example: 1
 *             pageSize:
 *               type: integer
 *               example: 10
 *             total:
 *               type: integer
 *               example: 50
 *             totalPages:
 *               type: integer
 *               example: 5
 *     UpdateOrderStatusRequest:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           description: The new status of the order.
 *           example: PROCESSING
 *           enum: [PENDING_PAYMENT, PROCESSING, COMPLETED, CANCELLED]
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Error message describing the issue.
 *           example: Order not found
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               msg:
 *                 type: string
 *               param:
 *                 type: string
 *               location:
 *                 type: string
 *               value:
 *                 type: string
 *           description: Validation errors (if any).
 *           example:
 *             - msg: Price must be a number between -9,999,999.99 and 9,999,999.99
 *               param: price
 *               location: body
 *               value: "invalid"
 */

/**
 * @swagger
 * /api/orders/events/{eventId}/clients/{clientId}:
 *   post:
 *     summary: Create an order for a specific event and client
 *     tags: [Orders]
 *     description: Creates a new order for a specific event and client, ensuring the client is part of the event. Requires JWT authentication. Rate-limited to 20 requests per 15 minutes per IP.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: The event ID (CUID, 25–30 characters).
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: The client ID (CUID, 25–30 characters).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       201:
 *         description: Order created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Order created successfully for event
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Validation errors or invalid price/due date.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized (missing or invalid JWT).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden (event or client does not belong to admin, or client not in event).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Event or client not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many requests.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Too many order creation attempts from this IP, please try again after 15 minutes.
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/orders/clients/{clientId}:
 *   post:
 *     summary: Create an order for a specific client
 *     tags: [Orders]
 *     description: Creates a new order for a specific client. Requires JWT authentication. Rate-limited to 20 requests per 15 minutes per IP.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: The client ID (CUID, 25–30 characters).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       201:
 *         description: Order created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Order created successfully
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Validation errors or invalid price/due date.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized (missing or invalid JWT).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden (client or project/event does not belong to admin).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Client, project, or event not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many requests.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Too many order creation attempts from this IP, please try again after 15 minutes.
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   get:
 *     summary: Get all orders for a specific client
 *     tags: [Orders]
 *     description: Retrieves a paginated list of orders for a specific client, ensuring the client belongs to the authenticated admin. Supports pagination via query parameters (page, pageSize). Rate-limited to 100 requests per 15 minutes per IP.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: The client ID (CUID, 25–30 characters).
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination.
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *         description: Number of orders per page.
 *     responses:
 *       200:
 *         description: List of orders with pagination metadata.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderListResponse'
 *       401:
 *         description: Unauthorized (missing or invalid JWT).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden (client does not belong to admin).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Client not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many requests.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Too many requests from this IP, please try again after 15 minutes.
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/orders:
 *   get:
 *     summary: Get all orders for the authenticated admin
 *     tags: [Orders]
 *     description: Retrieves a paginated list of orders for the authenticated admin. Supports pagination via query parameters (page, pageSize). Rate-limited to 100 requests per 15 minutes per IP.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination.
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *         description: Number of orders per page.
 *     responses:
 *       200:
 *         description: List of orders with pagination metadata.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderListResponse'
 *       401:
 *         description: Unauthorized (missing or invalid JWT).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many requests.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Too many requests from this IP, please try again after 15 minutes.
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 
 *
 * /api/orders/{orderId}:
 *   get:
 *     summary: Get an order by ID
 *     tags: [Orders]
 *     description: Retrieves a specific order by ID, ensuring it belongs to the authenticated admin. Rate-limited to 100 requests per 15 minutes per IP.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The order ID (CUID, 25–30 characters).
 *     responses:
 *       200:
 *         description: Order details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       401:
 *         description: Unauthorized (missing or invalid JWT).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden (order does not belong to admin).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Order not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many requests.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Too many requests from this IP, please try again after 15 minutes.
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   patch:
 *     summary: Update an order's details
 *     tags: [Orders]
 *     description: Updates a specific order's details by ID, ensuring it belongs to the authenticated admin. Rate-limited to 100 requests per 15 minutes per IP.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The order ID (CUID, 25–30 characters).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       200:
 *         description: Order updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Validation errors or invalid price/due date.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized (missing or invalid JWT).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden (order does not belong to admin or price/deposit locked).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Order or project not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many requests.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Too many requests from this IP, please try again after 15 minutes.
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   delete:
 *     summary: Delete an order by ID
 *     tags: [Orders]
 *     description: Deletes a specific order by ID, ensuring it belongs to the authenticated admin. Rate-limited to 100 requests per 15 minutes per IP.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The order ID (CUID, 25–30 characters).
 *     responses:
 *       200:
 *         description: Order deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Order deleted successfully
 *       401:
 *         description: Unauthorized (missing or invalid JWT).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden (order does not belong to admin).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Order not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many requests.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Too many requests from this IP, please try again after 15 minutes.
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/orders/{orderId}/status:
 *   patch:
 *     summary: Update an order's status
 *     tags: [Orders]
 *     description: Updates a specific order's status by ID, ensuring it belongs to the authenticated admin. Rate-limited to 100 requests per 15 minutes per IP.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The order ID (CUID, 25–30 characters).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateOrderStatusRequest'
 *     responses:
 *       200:
 *         description: Order status updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Order status updated successfully
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Validation errors or invalid status.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized (missing or invalid JWT).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden (order does not belong to admin).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Order not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many requests.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Too many requests from this IP, please try again after 15 minutes.
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
