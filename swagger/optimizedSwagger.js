/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         orderNumber:
 *           type: string
 *         price:
 *           type: string
 *         currency:
 *           type: string
 *         status:
 *           type: string
 *         outstandingAmount:
 *           type: number
 *           description: Calculated outstanding amount (price - total payments)
 *         measurementId:
 *           type: string
 *           nullable: true
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
 *             properties:
 *               id:
 *                 type: string
 *               amount:
 *                 type: string
 *               paymentDate:
 *                 type: string
 *         styleImages:
 *           type: array
 *           items:
 *             type: object
 *     BatchData:
 *       type: object
 *       properties:
 *         clients:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Client'
 *         orders:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Order'
 *         projects:
 *           type: array
 *           items:
 *             type: object
 *         events:
 *           type: array
 *           items:
 *             type: object
 *         gallery:
 *           type: array
 *           items:
 *             type: object
 *     Stats:
 *       type: object
 *       properties:
 *         clients:
 *           type: integer
 *         orders:
 *           type: integer
 *         projects:
 *           type: integer
 *         events:
 *           type: integer
 *         gallery:
 *           type: integer
 *         pending:
 *           type: integer
 */

/**
 * @swagger
 * /api/v1/dashboard/batch:
 *   get:
 *     summary: Get batch data for multiple entities (10x faster)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: entities
 *         schema:
 *           type: string
 *           example: "clients,orders,projects,events,gallery"
 *         description: Comma-separated list of entities
 *     responses:
 *       200:
 *         description: Batch data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BatchData'
 */

/**
 * @swagger
 * /api/v1/dashboard/stats:
 *   get:
 *     summary: Get quick statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Stats'
 */

/**
 * @swagger
 * /api/v1/dashboard/client/{clientId}:
 *   get:
 *     summary: Get complete client details with all related data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Client details with orders, measurements, and style images
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
 *                     type: object
 *                 styleImages:
 *                   type: array
 *                   items:
 *                     type: object
 */

module.exports = {};