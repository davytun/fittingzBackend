const express = require('express');
const { body, param } = require('express-validator');
const measurementController = require('../controllers/measurementController');
const { authenticateJwt } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     MeasurementFields:
 *       type: object
 *       description: Dynamic fields for measurements. Keys can be any string (e.g., "bust", "waist", "hip", "sleeveLength") and values are typically numbers or strings.
 *       example:
 *         bust: 90
 *         waist: 70
 *         hip: 95
 *         sleeveLength: 58
 *         notes: "Client prefers a loose fit."
 *     Measurement:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: cuid
 *           description: Unique identifier for the measurement record.
 *         clientId:
 *           type: string
 *           format: cuid
 *           description: ID of the client these measurements belong to.
 *         fields:
 *           $ref: '#/components/schemas/MeasurementFields'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of when the measurements were created/updated.
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of when the measurements were last updated.
 *         client: # Optional, included in some responses
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: Jane Doe
 *           nullable: true
 *     MeasurementInput:
 *       type: object
 *       required:
 *         - fields
 *       properties:
 *         fields:
 *           $ref: '#/components/schemas/MeasurementFields'
 *   requestBodies:
 *     MeasurementBody:
 *       description: Measurement data for a client.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MeasurementInput'
 * tags:
 *   name: Measurements
 *   description: Client measurement management (Requires authentication)
 */

const router = express.Router();

// All measurement routes are protected
router.use(authenticateJwt);

// Validation for client ID in params
const validateClientIdInParam = [
    param('clientId').isString().notEmpty().withMessage('Client ID is required in URL path.')
];

// Validation for measurement fields
// Ensures 'fields' is an object, but doesn't validate specific keys within it,
// allowing for dynamic fields.
const validateMeasurementFields = [
    body('fields').isObject().withMessage('Measurement fields must be an object.'),
    // Example of how you might validate specific common fields if they were mandatory:
    // body('fields.bust').optional().isNumeric().withMessage('Bust measurement must be a number.'),
    // body('fields.waist').optional().isNumeric().withMessage('Waist measurement must be a number.'),
];

// @route   POST /api/measurements/client/:clientId
// @desc    Add or update measurements for a client
// @access  Private (Admin only, owner of client)
/**
 * @swagger
 * /api/measurements/client/{clientId}:
 *   post:
 *     summary: Add or update measurements for a client
 *     tags: [Measurements]
 *     security:
 *       - bearerAuth: []
 *     description: Adds new measurements or updates existing measurements for a specific client. This acts as an upsert operation based on `clientId`.
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The ID of the client for whom measurements are being added/updated.
 *     requestBody:
 *       $ref: '#/components/requestBodies/MeasurementBody'
 *     responses:
 *       '200':
 *         description: Measurements added/updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Measurement'
 *       '400':
 *         description: Bad request (e.g., validation error, invalid JSON for fields).
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
router.post(
    '/client/:clientId',
    validateClientIdInParam,
    validateMeasurementFields,
    measurementController.addOrUpdateMeasurement
);

// @route   GET /api/measurements/client/:clientId
// @desc    Get measurements for a client
// @access  Private (Admin only, owner of client)
/**
 * @swagger
 * /api/measurements/client/{clientId}:
 *   get:
 *     summary: Get measurements for a client
 *     tags: [Measurements]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieves the measurements for a specific client.
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The ID of the client whose measurements are to be retrieved.
 *     responses:
 *       '200':
 *         description: Measurement data for the client.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Measurement'
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
 *         description: Client or Measurements not found.
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
router.get(
    '/client/:clientId',
    validateClientIdInParam,
    measurementController.getMeasurementsByClientId
);

// @route   DELETE /api/measurements/client/:clientId
// @desc    Delete measurements for a client
// @access  Private (Admin only, owner of client)
/**
 * @swagger
 * /api/measurements/client/{clientId}:
 *   delete:
 *     summary: Delete measurements for a client
 *     tags: [Measurements]
 *     security:
 *       - bearerAuth: []
 *     description: Deletes the measurements associated with a specific client.
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The ID of the client whose measurements are to be deleted.
 *     responses:
 *       '200':
 *         description: Measurements deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Measurements deleted successfully for client.
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
 *         description: Client or Measurements not found.
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
router.delete(
    '/client/:clientId',
    validateClientIdInParam,
    measurementController.deleteMeasurementsByClientId
);


module.exports = router;
