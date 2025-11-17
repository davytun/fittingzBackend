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
 *           description: The currency of the order (e.g., NGN, USD, EUR).
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
 */

/**
 * @swagger
 * /api/v1/orders/client/{clientId}:
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
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
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
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Number of orders per page
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
 * /api/v1/orders/event/{eventId}/client/{clientId}:
 *   post:
 *     summary: Create a new order for an event and client
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: The event ID
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
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Validation errors
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Event or client not found
 * /api/v1/orders:
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
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Number of orders per page
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
 
 * /api/v1/orders/{orderId}:
 *   get:
 *     summary: Get a single order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The order ID
 *     responses:
 *       200:
 *         description: Order details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
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
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       200:
 *         description: Order updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
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
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The order ID
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 * /api/v1/orders/{orderId}/status:
 *   patch:
 *     summary: Update order status
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       400:
 *         description: Validation errors
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 
 */
