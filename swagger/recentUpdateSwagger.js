/**
 * @swagger
 * components:
 *   schemas:
 *     RecentUpdate:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the update
 *         type:
 *           type: string
 *           enum: [CLIENT_CREATED, ORDER_CREATED, ORDER_STATUS_CHANGED, PROJECT_CREATED, PROJECT_STATUS_CHANGED, PAYMENT_RECEIVED, EVENT_CREATED, MEASUREMENT_ADDED]
 *           description: Type of activity
 *         title:
 *           type: string
 *           description: Title of the update
 *         description:
 *           type: string
 *           description: Detailed description of the update
 *         entityId:
 *           type: string
 *           description: ID of the related entity
 *         entityType:
 *           type: string
 *           description: Type of the related entity
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the update was created
 */

/**
 * @swagger
 * /api/v1/recent-updates:
 *   get:
 *     summary: Get recent updates
 *     tags: [Recent Updates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of updates to retrieve
 *     responses:
 *       200:
 *         description: Recent updates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RecentUpdate'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/recent-updates/summary:
 *   get:
 *     summary: Get activity summary statistics
 *     tags: [Recent Updates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Number of days to analyze
 *     responses:
 *       200:
 *         description: Activity summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalActivities:
 *                       type: integer
 *                       description: Total number of activities
 *                     totalClients:
 *                       type: integer
 *                       description: Total number of clients
 *                     totalOrders:
 *                       type: integer
 *                       description: Total number of orders
 *                     totalGalleryStyles:
 *                       type: integer
 *                       description: Total number of gallery style images
 *                     byType:
 *                       type: object
 *                       description: Activity count by type
 *                     byDay:
 *                       type: object
 *                       description: Activity count by day
 *                     mostActiveDay:
 *                       type: object
 *                       properties:
 *                         date:
 *                           type: string
 *                         count:
 *                           type: integer
 *                     averagePerDay:
 *                       type: number
 *                       description: Average activities per day
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */