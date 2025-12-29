/**
 * @swagger
 * components:
 *   schemas:
 *     DashboardSummary:
 *       type: object
 *       properties:
 *         totalClients:
 *           type: integer
 *         totalOrders:
 *           type: integer
 *         totalRevenue:
 *           type: number
 *     
 *     RecentClient:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         phone:
 *           type: string
 *         email:
 *           type: string
 *         gender:
 *           type: string
 *         adminId:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         measurements:
 *           type: array
 *           items:
 *             type: object
 *         styleImages:
 *           type: array
 *           items:
 *             type: object
 *         _count:
 *           type: object
 *           properties:
 *             measurements:
 *               type: integer
 *             styleImages:
 *               type: integer
 *     
 *     RecentOrder:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         orderNumber:
 *           type: string
 *         price:
 *           type: number
 *         currency:
 *           type: string
 *         status:
 *           type: string
 *         outstandingAmount:
 *           type: number
 *         client:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *         payments:
 *           type: array
 *           items:
 *             type: object
 *         styleImages:
 *           type: array
 *           items:
 *             type: object
 *         details:
 *           type: object
 *         dueDate:
 *           type: string
 *           format: date-time
 *         deposit:
 *           type: number
 *         styleDescription:
 *           type: string
 *         note:
 *           type: string
 *         totalPaid:
 *           type: number
 *         outstandingBalance:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         project:
 *           type: object
 *           nullable: true
 *         event:
 *           type: object
 *           nullable: true
 *         measurement:
 *           type: object
 *           nullable: true
 *     
 *     OrderStats:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *         _count:
 *           type: object
 *         _sum:
 *           type: object
 *     
 *     RecentUpdate:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         type:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         entityId:
 *           type: string
 *         entityType:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *     
 *     ComprehensiveDashboard:
 *       type: object
 *       properties:
 *         orders:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Order'
 *         projects:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Project'
 *         clients:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Client'
 *         gallery:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/StyleImage'
 *         events:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Event'
 *         summary:
 *           $ref: '#/components/schemas/DashboardSummary'
 *         recentClients:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RecentClient'
 *         recentOrders:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RecentOrder'
 *         orderStats:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderStats'
 *         recentUpdates:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RecentUpdate'
 */

/**
 * @swagger
 * /api/v1/dashboard:
 *   get:
 *     summary: Get comprehensive dashboard data including batch data and analytics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: entities
 *         schema:
 *           type: string
 *           default: "clients,orders,projects,events,gallery"
 *         description: Comma-separated list of entities to fetch
 *     responses:
 *       200:
 *         description: Comprehensive dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clients:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Client'
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 projects:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *                 events:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *                 gallery:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StyleImage'
 *                 summary:
 *                   $ref: '#/components/schemas/DashboardSummary'
 *                 recentClients:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RecentClient'
 *                 recentOrders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RecentOrder'
 *                 orderStats:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/OrderStats'
 *                 recentUpdates:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RecentUpdate'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */



/**
 * @swagger
 * /api/v1/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clients:
 *                   type: integer
 *                 orders:
 *                   type: integer
 *                 projects:
 *                   type: integer
 *                 events:
 *                   type: integer
 *                 gallery:
 *                   type: integer
 *                 pending:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/v1/dashboard/client/{clientId}:
 *   get:
 *     summary: Get detailed client information
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *     responses:
 *       200:
 *         description: Client details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 client:
 *                   $ref: '#/components/schemas/Client'
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 measurements:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Measurement'
 *                 styleImages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StyleImage'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Client not found
 *       500:
 *         description: Internal server error
 */