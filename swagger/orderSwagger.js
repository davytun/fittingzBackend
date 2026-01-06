/**
 * @swagger
 * components:
 *   schemas:
 *     CreateOrderRequest:
 *       type: object
 *       required:
 *         - price
 *       properties:
 *         details:
 *           type: object
 *           description: Optional custom details about the order (e.g., fabric, color).
 *           example: { fabric: "cotton", color: "blue", notes: "urgent" }
 *         price:
 *           type: number
 *           description: The total price of the order.
 *           example: 25000
 *         currency:
 *           type: string
 *           description: The currency of the order (e.g., NGN, USD, EUR, GBP, CAD, etc.).
 *           example: NGN
 *         dueDate:
 *           type: string
 *           format: date
 *           description: The due date for the order (YYYY-MM-DD).
 *           example: 2025-07-20
 *         status:
 *           type: string
 *           enum: [PENDING_PAYMENT, PROCESSING, READY_FOR_PICKUP, SHIPPED, DELIVERED, COMPLETED, CANCELLED]
 *           description: The status of the order.
 *           example: PENDING_PAYMENT
 *         projectId:
 *           type: string
 *           description: Optional ID of the associated project.
 *           example: cmg5c2q7y0000tv4cpuk0wqa2
 *         eventId:
 *           type: string
 *           description: Optional ID of the associated event.
 *           example: cmg5c2q7y0000tv4cpuk0wqa3
 *         deposit:
 *           type: number
 *           description: Optional initial deposit for the order.
 *           example: 5000
 *         styleDescription:
 *           type: string
 *           description: Optional description of the style.
 *           example: Elegant evening gown
 *         styleImageIds:
 *           type: array
 *           items:
 *             type: string
 *           description: Optional array of style image IDs.
 *           example: ["cmg5c2q7y0000tv4cpuk0wqa4"]
 *         note:
 *           type: string
 *           description: Optional note for the order.
 *           example: "Rush order for wedding"
 *         measurementId:
 *           type: string
 *           description: Optional measurement ID to link to the order.
 *           example: "cmg5c2q7y0000tv4cpuk0wqa5"
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: cmg5c2q7y0000tv4cpuk0wqa1
 *         orderNumber:
 *           type: string
 *           example: ORD-1730317200000-123
 *         details:
 *           type: object
 *           description: Custom details about the order.
 *           example: { fabric: "cotton", color: "blue", notes: "urgent" }
 *         price:
 *           type: number
 *           example: 25000
 *         currency:
 *           type: string
 *           example: NGN
 *         dueDate:
 *           type: string
 *           format: date-time
 *           example: 2025-07-20T00:00:00Z
 *         status:
 *           type: string
 *           example: PENDING_PAYMENT
 *         deposit:
 *           type: number
 *           example: 5000
 *         styleDescription:
 *           type: string
 *           example: Elegant evening gown
 *         note:
 *           type: string
 *           example: Rush order for wedding
 *         totalPaid:
 *           type: number
 *           example: 5000
 *         outstandingBalance:
 *           type: number
 *           example: 20000
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2025-09-30T16:20:00Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2025-09-30T16:20:00Z
 *         client:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: John Doe
 *         project:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: Summer Collection
 *         event:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: Wedding Event
 *         payments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: cmg5c2q7y0000tv4cpuk0wqa5
 *               amount:
 *                 type: number
 *                 example: 5000
 *               notes:
 *                 type: string
 *                 example: Initial deposit
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
 *                     example: cmg5c2q7y0000tv4cpuk0wqa4
 *                   imageUrl:
 *                     type: string
 *                     example: https://example.com/image.jpg
 *                   description:
 *                     type: string
 *                     example: Blue cotton dress
 *         measurementId:
 *           type: string
 *           nullable: true
 *           description: ID of the linked measurement
 *           example: cmg5c2q7y0000tv4cpuk0wqa6
 *         measurement:
 *           type: object
 *           nullable: true
 *           description: Full measurement object (only when ?include=measurement is used)
 *           properties:
 *             id:
 *               type: string
 *               example: cmg5c2q7y0000tv4cpuk0wqa6
 *             name:
 *               type: string
 *               example: John's Measurements
 *             fields:
 *               type: object
 *               example: { chest: "40", waist: "32" }
 */

/**
 * @swagger
 * /api/v1/clients/{clientId}/orders:
 *   post:
 *     summary: Create a new order for a client
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: The client ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *           example:
 *             price: 25000
 *             currency: "NGN"
 *             dueDate: "2025-07-20"
 *             status: "PENDING_PAYMENT"
 *             details: { "fabric": "cotton", "color": "blue" }
 *             deposit: 5000
 *             styleDescription: "Elegant evening gown"
 *             note: "Rush order for wedding"
 *     responses:
 *       201:
 *         description: Order created successfully
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
 *         description: Validation errors
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Client not found
 *   get:
 *     summary: Get all orders for a specific client
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: The client ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of orders per page
 *       - in: query
 *         name: include
 *         schema:
 *           type: string
 *           enum: [measurement]
 *         description: Include related data (measurement)
 *     responses:
 *       200:
 *         description: List of orders
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
 *                     pageSize:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Client not found
 */

/**
 * @swagger
 * /api/v1/clients/{clientId}/orders/event/{eventId}:
 *   post:
 *     summary: Create a new order for an event and client
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: The client ID
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: The event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       201:
 *         description: Order created successfully
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
 *         description: Validation errors
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Event or client not found
 */

/**
 * @swagger
 * /api/v1/clients/admin/orders:
 *   get:
 *     summary: Get all orders for the authenticated admin
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of orders per page
 *       - in: query
 *         name: include
 *         schema:
 *           type: string
 *           enum: [measurement]
 *         description: Include related data (measurement)
 *     responses:
 *       200:
 *         description: List of all orders for admin
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
 *                     pageSize:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/clients/{clientId}/orders/{orderId}:
 *   get:
 *     summary: Get a single order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: The client ID
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The order ID
 *       - in: query
 *         name: include
 *         schema:
 *           type: string
 *           enum: [measurement]
 *         description: Include related data (measurement)
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Order retrieved successfully
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 *   patch:
 *     summary: Update order details
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: The client ID
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               details:
 *                 type: object
 *                 description: Custom details about the order
 *               price:
 *                 type: number
 *                 description: The total price of the order
 *               currency:
 *                 type: string
 *                 description: The currency of the order
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 description: The due date for the order
 *               status:
 *                 type: string
 *                 enum: [PENDING_PAYMENT, PROCESSING, READY_FOR_PICKUP, SHIPPED, DELIVERED, COMPLETED, CANCELLED]
 *                 description: The status of the order
 *               deposit:
 *                 type: number
 *                 description: Initial deposit for the order
 *               styleDescription:
 *                 type: string
 *                 description: Description of the style
 *               note:
 *                 type: string
 *                 description: Note for the order
 *               measurementId:
 *                 type: string
 *                 description: Measurement ID to link to the order
 *           example:
 *             price: 30000
 *             status: "PROCESSING"
 *             note: "Updated requirements"
 *     responses:
 *       200:
 *         description: Order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Order updated successfully
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Validation errors
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 *   delete:
 *     summary: Delete an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: The client ID
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The order ID
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Order deleted successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */

/**
 * @swagger
 * /api/v1/clients/{clientId}/orders/{orderId}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: The client ID
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING_PAYMENT, PROCESSING, READY_FOR_PICKUP, SHIPPED, DELIVERED, COMPLETED, CANCELLED]
 *                 example: PROCESSING
 *                 description: New status for the order
 *           example:
 *             status: "PROCESSING"
 *     responses:
 *       200:
 *         description: Order status updated successfully
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
 *         description: Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */

/**
 * @swagger
 * /api/v1/clients/{clientId}/orders/{orderId}/link-measurement:
 *   patch:
 *     summary: Link measurement to order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: The client ID
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - measurementId
 *             properties:
 *               measurementId:
 *                 type: string
 *                 description: ID of the measurement to link
 *                 example: cmg5c2q7y0000tv4cpuk0wqa6
 *           example:
 *             measurementId: "cmg5c2q7y0000tv4cpuk0wqa6"
 *     responses:
 *       200:
 *         description: Measurement linked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Measurement linked to order successfully
 *                 order:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Validation errors
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order or measurement not found
 */

/**
 * @swagger
 * /api/v1/clients/{clientId}/orders/{orderId}/images/{imageId}:
 *   patch:
 *     summary: Update order image details
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Image ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *                 description: Image category
 *                 example: "formal"
 *               description:
 *                 type: string
 *                 description: Image description
 *                 example: "Blue evening gown inspiration"
 *           example:
 *             category: "formal"
 *             description: "Updated style reference"
 *     responses:
 *       200:
 *         description: Order image updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Order image updated successfully
 *                 image:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     category:
 *                       type: string
 *                     description:
 *                       type: string
 *                     imageUrl:
 *                       type: string
 *       404:
 *         description: Order or image not found
 *       403:
 *         description: Access denied
 *   delete:
 *     summary: Remove image from order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Image ID
 *     responses:
 *       200:
 *         description: Image removed from order successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Image removed from order successfully
 *       404:
 *         description: Order or image not found
 *       403:
 *         description: Access denied
 */