/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - adminId
 *         - createdAt
 *       properties:
 *         id:
 *           type: string
 *           description: The unique identifier for the event
 *         name:
 *           type: string
 *           description: The name of the event
 *         description:
 *           type: string
 *           nullable: true
 *           description: Optional description of the event
 *         eventDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: The date of the event
 *         location:
 *           type: string
 *           nullable: true
 *           description: The location of the event
 *         adminId:
 *           type: string
 *           description: The ID of the admin who created the event
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the event was created
 *         clients:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               clientId:
 *                 type: string
 *                 description: The ID of the client
 *               client:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: The ID of the client
 *                   name:
 *                     type: string
 *                     description: The name of the client
 *         orders:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: The ID of the order
 *               client:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: The name of the client
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *                 description: The date and time when the order was created
 */

/**
 * @swagger
 * /api/v1/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - clientIds
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the event
 *               description:
 *                 type: string
 *                 description: Optional description of the event
 *               eventDate:
 *                 type: string
 *                 format: date
 *                 description: The date of the event (YYYY-MM-DD)
 *                 example: "2025-07-10"
 *               location:
 *                 type: string
 *                 description: Optional location of the event
 *               clientIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of client IDs associated with the event
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/events:
 *   get:
 *     summary: Get all events for the authenticated admin
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of events for the admin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/events/{id}:
 *   get:
 *     summary: Get an event by ID
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the event
 *     responses:
 *       200:
 *         description: Event details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       403:
 *         description: Forbidden - Event does not belong to the user
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/events/{id}/orders:
 *   get:
 *     summary: Get all orders for a specific event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the event
 *     responses:
 *       200:
 *         description: List of orders for the event
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: The ID of the order
 *                       client:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             description: The name of the client
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: The date and time when the order was created
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/events/{id}:
 *   put:
 *     summary: Update an event by ID
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the event
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - clientIds
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the event
 *               description:
 *                 type: string
 *                 description: Optional description of the event
 *               eventDate:
 *                 type: string
 *                 format: date
 *                 description: The date of the event (YYYY-MM-DD)
 *                 example: "2025-07-10"
 *               location:
 *                 type: string
 *                 description: Optional location of the event
 *               clientIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of client IDs associated with the event (minimum 2)
 *     responses:
 *       200:
 *         description: Event updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/events/{id}:
 *   delete:
 *     summary: Delete an event by ID
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the event
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error
 */
