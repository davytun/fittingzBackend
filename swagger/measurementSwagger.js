/**
 * @swagger
 * components:
 *   schemas:
 *     Measurement:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: cmg5c2q7y0000tv4cpuk0wqa0
 *         name:
 *           type: string
 *           example: Pants Measurement
 *         clientId:
 *           type: string
 *           example: cmg5c2q7y0000tv4cpuk0wqa0
 *         orderId:
 *           type: string
 *           nullable: true
 *           example: null
 *         fields:
 *           type: object
 *           example:
 *             waist: "32"
 *             inseam: "30"
 *             thigh: "22"
 *         isDefault:
 *           type: boolean
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         client:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *         order:
 *           type: object
 *           nullable: true
 *           properties:
 *             orderNumber:
 *               type: string
 *     MeasurementInput:
 *       type: object
 *       required:
 *         - name
 *         - fields
 *       properties:
 *         name:
 *           type: string
 *           example: Pants Measurement
 *         fields:
 *           type: object
 *           example:
 *             waist: "32"
 *             inseam: "30"
 *             thigh: "22"
 *         orderId:
 *           type: string
 *           nullable: true
 *           example: null
 *         isDefault:
 *           type: boolean
 *           example: false
 */

/**
 * @swagger
 * /api/v1/clients/{clientId}/measurements:
 *   post:
 *     summary: Add measurement for client
 *     tags: [Measurements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Client ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MeasurementInput'
 *     responses:
 *       201:
 *         description: Measurement created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Measurement'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Client or order not found
 *       403:
 *         description: Forbidden
 *   get:
 *     summary: Get measurements for client
 *     tags: [Measurements]
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
 *         description: List of measurements
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Measurement'
 *       404:
 *         description: Client not found
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /api/v1/clients/measurements/{id}:
 *   put:
 *     summary: Update measurement
 *     tags: [Measurements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Measurement ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MeasurementInput'
 *     responses:
 *       200:
 *         description: Measurement updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Measurement'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Measurement not found
 *       403:
 *         description: Forbidden
 *   get:
 *     summary: Get single measurement
 *     tags: [Measurements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Measurement ID
 *     responses:
 *       200:
 *         description: Measurement retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Measurement'
 *       404:
 *         description: Measurement not found
 *       403:
 *         description: Forbidden
 *   delete:
 *     summary: Delete measurement
 *     tags: [Measurements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Measurement ID
 *     responses:
 *       200:
 *         description: Measurement deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Measurement deleted successfully.
 *       404:
 *         description: Measurement not found
 *       403:
 *         description: Forbidden
 */