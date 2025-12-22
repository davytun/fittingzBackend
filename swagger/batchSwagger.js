/**
 * @swagger
 * components:
 *   schemas:
 *     BatchClientDetails:
 *       type: object
 *       properties:
 *         client:
 *           $ref: '#/components/schemas/Client'
 *         measurements:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Measurement'
 *         orders:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Order'
 *         styleImages:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/StyleImage'
 *         summary:
 *           type: object
 *           properties:
 *             totalMeasurements:
 *               type: integer
 *             totalOrders:
 *               type: integer
 *             totalStyleImages:
 *               type: integer
 *             totalOrderValue:
 *               type: number
 *             totalPaid:
 *               type: number
 *     
 *     BatchDashboardData:
 *       type: object
 *       properties:
 *         summary:
 *           type: object
 *           properties:
 *             totalClients:
 *               type: integer
 *             totalOrders:
 *               type: integer
 *             totalRevenue:
 *               type: number
 *         recentClients:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Client'
 *         recentOrders:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Order'
 *         orderStats:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               _count:
 *                 type: object
 *               _sum:
 *                 type: object
 *         recentUpdates:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RecentUpdate'
 */

/**
 * @swagger
 * /api/v1/clients/{id}/details:
 *   get:
 *     summary: Get all client details in one request (OPTIMIZED)
 *     description: Fetches client information, measurements, orders, and style images in a single API call for better performance. Replaces 3-4 separate API calls.
 *     tags: [Batch Operations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: The client ID
 *     responses:
 *       200:
 *         description: Client details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BatchClientDetails'
 *       404:
 *         description: Client not found
 *       403:
 *         description: Forbidden - You do not have access to this client
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/v1/dashboard:
 *   get:
 *     summary: Get dashboard data in one request (OPTIMIZED)
 *     description: Fetches all dashboard statistics, recent clients, orders, and updates in a single API call for better performance.
 *     tags: [Batch Operations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BatchDashboardData'
 *       401:
 *         description: Unauthorized
 */

module.exports = {};