/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       required:
 *         - id
 *         - orderId
 *         - amount
 *         - createdAt
 *       properties:
 *         id:
 *           type: string
 *           description: The unique identifier for the payment
 *         orderId:
 *           type: string
 *           description: The ID of the order associated with the payment
 *         amount:
 *           type: number
 *           format: float
 *           description: The payment amount
 *         notes:
 *           type: string
 *           nullable: true
 *           description: Optional notes for the payment
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the payment was created
 *     PaymentSummary:
 *       type: object
 *       properties:
 *         totalPaid:
 *           type: number
 *           format: float
 *           description: Total amount paid for the order
 *         remainingBalance:
 *           type: number
 *           format: float
 *           description: Remaining balance for the order
 *         isFullyPaid:
 *           type: boolean
 *           description: Indicates if the order is fully paid
 */

/**
 * @swagger
 * /api/v1/clients/{clientId}/orders/{orderId}/payments:
 *   post:
 *     summary: Add a payment to an order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the client
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order to add the payment to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 format: float
 *                 description: The payment amount
 *                 minimum: 0.01
 *               notes:
 *                 type: string
 *                 description: Optional notes for the payment
 *     responses:
 *       201:
 *         description: Payment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 payment:
 *                   $ref: '#/components/schemas/Payment'
 *                 order:
 *                   type: object
 *                   description: The updated order details
 *                 paymentSummary:
 *                   $ref: '#/components/schemas/PaymentSummary'
 *       400:
 *         description: Validation errors or payment exceeds remaining balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                 details:
 *                   type: object
 *                   properties:
 *                     orderTotal:
 *                       type: number
 *                     totalPaid:
 *                       type: number
 *                     remainingBalance:
 *                       type: number
 *                     attemptedPayment:
 *                       type: number
 *       403:
 *         description: Forbidden - Order does not belong to the user
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/clients/{clientId}/orders/{orderId}/payments:
 *   get:
 *     summary: Get all payments for an order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the client
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order
 *     responses:
 *       200:
 *         description: List of payments for the order
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payment'
 *                 summary:
 *                   $ref: '#/components/schemas/PaymentSummary'
 *       403:
 *         description: Forbidden - Order does not belong to the user
 *       404:
 *         description: Order not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/clients/{clientId}/orders/{orderId}/payments/{paymentId}:
 *   delete:
 *     summary: Delete a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the client
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the payment to delete
 *     responses:
 *       200:
 *         description: Payment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Forbidden - Payment does not belong to the user
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/v1/clients/payments/history:
 *   get:
 *     summary: Get payments history for admin
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of payments per page
 *     responses:
 *       200:
 *         description: Payments history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 payments:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Payment'
 *                       - type: object
 *                         properties:
 *                           order:
 *                             type: object
 *                             properties:
 *                               orderNumber:
 *                                 type: string
 *                               price:
 *                                 type: number
 *                               currency:
 *                                 type: string
 *                               client:
 *                                 type: object
 *                                 properties:
 *                                   name:
 *                                     type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                 summary:
 *                   type: object
 *                   properties:
 *                     totalAmount:
 *                       type: number
 *                     totalPayments:
 *                       type: integer
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/v1/clients/payments/new:
 *   post:
 *     summary: Create a new payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - amount
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: The ID of the order
 *               amount:
 *                 type: number
 *                 format: float
 *                 minimum: 0.01
 *                 description: Payment amount
 *               notes:
 *                 type: string
 *                 description: Optional payment notes
 *     responses:
 *       201:
 *         description: Payment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 payment:
 *                   $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Validation error or payment exceeds balance
 *       404:
 *         description: Order not found
 */