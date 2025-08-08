const express = require('express');
const { body, param } = require('express-validator');
const clientController = require('../controllers/clientController');
const { authenticateJwt } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Client:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: cuid
 *           description: Unique identifier for the client.
 *           example: clxkp4q9v0001abgh6789ijkl
 *         name:
 *           type: string
 *           description: Name of the client.
 *           example: Jane Doe
 *         phone:
 *           type: string
 *           description: Client's phone number.
 *           example: "123-456-7890"
 *           nullable: true
 *         email:
 *           type: string
 *           format: email
 *           description: Client's email address.
 *           example: jane.doe@example.com
 *           nullable: true
 *         eventType:
 *           type: string
 *           description: Type of event the client is preparing for (optional).
 *           example: Wedding
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of when the client was created.
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of when the client was last updated.
 *         adminId:
 *           type: string
 *           format: cuid
 *           description: ID of the admin user who owns this client.
 *     ClientInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the client.
 *           example: Jane Doe
 *         phone:
 *           type: string
 *           description: Client's phone number.
 *           example: "123-456-7890"
 *         email:
 *           type: string
 *           format: email
 *           description: Client's email address.
 *           example: jane.doe@example.com
 *         eventType:
 *           type: string
 *           description: Type of event the client is preparing for (optional).
 *           example: Wedding
 *   requestBodies:
 *     ClientCreationBody:
 *       description: Client details for creation.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClientInput'
 *     ClientUpdateBody:
 *       description: Client details for update. Fields are optional.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClientInput' # Can reuse ClientInput, or make a partial version
 * tags:
 *   name: Clients
 *   description: Client management operations (Requires authentication)
 */

const router = express.Router();

// Middleware to validate client ID in params
const validateClientId = [
    param('id').isString().withMessage('Client ID must be a string.').isLength({ min: 1 }).withMessage('Client ID cannot be empty.')
];

// Middleware for validating client creation (name required)
const validateClientCreation = [
    body('name').trim().notEmpty().withMessage('Client name is required.'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Please provide a valid email address.').normalizeEmail(),
    body('phone').optional({ checkFalsy: true }).isString().withMessage('Phone number must be a string.'),
    body('eventType').optional({ checkFalsy: true }).isString().withMessage('Event type must be a string.'),
    body('favoriteColors').optional().isArray().withMessage('Favorite colors must be an array.'),
    body('dislikedColors').optional().isArray().withMessage('Disliked colors must be an array.'),
    body('preferredStyles').optional().isArray().withMessage('Preferred styles must be an array.'),
    body('bodyShape').optional({ checkFalsy: true }).isString().withMessage('Body shape must be a string.'),
    body('additionalDetails').optional({ checkFalsy: true }).isString().withMessage('Additional details must be a string.'),
];

// Middleware for validating client updates (all fields optional)
const validateClientUpdate = [
    body('name').optional().trim().notEmpty().withMessage('Client name cannot be empty.'),
    body('email').optional({ checkFalsy: true }).isEmail().withMessage('Please provide a valid email address.').normalizeEmail(),
    body('phone').optional({ checkFalsy: true }).isString().withMessage('Phone number must be a string.'),
    body('eventType').optional({ checkFalsy: true }).isString().withMessage('Event type must be a string.'),
    body('favoriteColors').optional().isArray().withMessage('Favorite colors must be an array.'),
    body('dislikedColors').optional().isArray().withMessage('Disliked colors must be an array.'),
    body('preferredStyles').optional().isArray().withMessage('Preferred styles must be an array.'),
    body('bodyShape').optional({ checkFalsy: true }).isString().withMessage('Body shape must be a string.'),
    body('additionalDetails').optional({ checkFalsy: true }).isString().withMessage('Additional details must be a string.'),
];


// All client routes are protected and require authentication
router.use(authenticateJwt);

// @route   POST /api/clients
// @desc    Create a new client
// @access  Private (Admin only)
/**
 * @swagger
 * /api/clients:
 *   post:
 *     summary: Create a new client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     description: Creates a new client record for the authenticated admin.
 *     requestBody:
 *       $ref: '#/components/requestBodies/ClientCreationBody'
 *     responses:
 *       '201':
 *         description: Client created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 *       '400':
 *         description: Bad request (e.g., validation error).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized (e.g., no token or invalid token).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', validateClientCreation, clientController.createClient);

// @route   GET /api/clients
// @desc    Get all clients for the authenticated admin
// @access  Private (Admin only)
/**
 * @swagger
 * /api/clients:
 *   get:
 *     summary: Get all clients for the authenticated admin
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieves a list of all clients associated with the currently authenticated admin.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination.
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of items per page.
 *     responses:
 *       '200':
 *         description: A paginated list of clients.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Client'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     pageSize:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 100
 *                     totalPages:
 *                       type: integer
 *                       example: 10
 *       '401':
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', clientController.getAllClients);

// @route   GET /api/clients/:id
// @desc    Get a single client by ID
// @access  Private (Admin only, owner)
/**
 * @swagger
 * /api/clients/{id}:
 *   get:
 *     summary: Get a single client by ID
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieves a specific client by their ID. The client must belong to the authenticated admin.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The ID of the client to retrieve.
 *     responses:
 *       '200':
 *         description: Detailed information about the client.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 *       '401':
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Forbidden (client does not belong to the admin).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Client not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', validateClientId, clientController.getClientById);

// @route   PUT /api/clients/:id
// @desc    Update a client by ID
// @access  Private (Admin only, owner)
/**
 * @swagger
 * /api/clients/{id}:
 *   put:
 *     summary: Update a client by ID
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     description: Updates an existing client's details. The client must belong to the authenticated admin.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The ID of the client to update.
 *     requestBody:
 *       $ref: '#/components/requestBodies/ClientUpdateBody'
 *     responses:
 *       '200':
 *         description: Client updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 *       '400':
 *         description: Bad request (e.g., validation error).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Forbidden (client does not belong to the admin).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Client not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id', validateClientId, validateClientUpdate, clientController.updateClient);

// @route   DELETE /api/clients/:id
// @desc    Delete a client by ID
// @access  Private (Admin only, owner)
/**
 * @swagger
 * /api/clients/{id}:
 *   delete:
 *     summary: Delete a client by ID
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     description: Deletes a specific client by their ID. The client must belong to the authenticated admin.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The ID of the client to delete.
 *     responses:
 *       '200':
 *         description: Client deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Client deleted successfully
 *       '401':
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Forbidden (client does not belong to the admin).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Client not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', validateClientId, clientController.deleteClient);

module.exports = router;
