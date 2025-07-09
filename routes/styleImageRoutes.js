const express = require('express');
const { body, param } = require('express-validator');
const styleImageController = require('../controllers/styleImageController');
const { authenticateJwt } = require('../middlewares/authMiddleware');
const { upload } = require('../config/cloudinary'); // Multer upload instance

/**
 * @swagger
 * components:
 *   schemas:
 *     StyleImage:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: cuid
 *           description: Unique identifier for the style image.
 *         clientId:
 *           type: string
 *           format: cuid
 *           description: ID of the client this style image belongs to.
 *         imageUrl:
 *           type: string
 *           format: url
 *           description: URL of the uploaded image on Cloudinary.
 *         publicId:
 *           type: string
 *           description: Public ID of the image on Cloudinary (used for deletion/management).
 *         category:
 *           type: string
 *           description: Category of the style image (e.g., Traditional, Wedding, Casual).
 *           example: Wedding
 *         description:
 *           type: string
 *           description: Optional description for the style image.
 *           example: "Elegant lace wedding gown inspiration"
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of when the style image was created.
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of when the style image was last updated.
 *   requestBodies:
 *     StyleImageUploadBody:
 *       description: Style image file and metadata for upload.
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - styleImage
 *             properties:
 *               styleImage:
 *                 type: string
 *                 format: binary
 *                 description: The image file to upload.
 *               category:
 *                 type: string
 *                 description: Category for the style image (e.g., Traditional, Wedding). Optional.
 *                 example: Casual
 *                 nullable: true
 *               description:
 *                 type: string
 *                 description: Optional description for the style image.
 *                 example: "Summer casual wear idea"
 *                 nullable: true
 * tags:
 *   name: StyleImages
 *   description: Style image management (Requires authentication)
 */

const router = express.Router();

// All style image routes are protected
router.use(authenticateJwt);

// Validation for client ID in params
const validateClientIdInParam = [
    param('clientId').isString().notEmpty().withMessage('Client ID is required in URL path.')
];

// Validation for image ID in params
const validateImageIdInParam = [
    param('imageId').isString().notEmpty().withMessage('Image ID is required in URL path.')
];

// Validation for style image metadata
const validateStyleImageInput = [
    body('category').optional({ checkFalsy: true }).isString().trim().withMessage('Category must be a string if provided.'), // checkFalsy allows empty string to be considered as "not present" for optional
    body('description').optional({ checkFalsy: true }).isString().trim().withMessage('Description must be a string if provided.'),
];

// @route   POST /api/styles/client/:clientId/upload
// @desc    Upload a style image for a client
// @access  Private (Admin only, owner of client)
// 'styleImage' is the field name in the form-data for the file
/**
 * @swagger
 * /api/styles/client/{clientId}/upload:
 *   post:
 *     summary: Upload a style image for a client
 *     tags: [StyleImages]
 *     security:
 *       - bearerAuth: []
 *     description: Uploads a new style image for a specific client. The image is stored in Cloudinary and metadata in the database.
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The ID of the client for whom the style image is being uploaded.
 *     requestBody:
 *       $ref: '#/components/requestBodies/StyleImageUploadBody'
 *     responses:
 *       '201':
 *         description: Style image uploaded successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StyleImage'
 *       '400':
 *         description: Bad request (e.g., validation error, no file uploaded, file type error).
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
 *         description: Internal server error (e.g., Cloudinary upload issue, DB issue).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
    '/client/:clientId/upload',
    validateClientIdInParam,
    upload.single('styleImage'), // Multer middleware for single file upload
    validateStyleImageInput,     // Validation runs after upload attempt
    styleImageController.uploadStyleImage
);

// @route   GET /api/styles/client/:clientId
// @desc    Get all style images for a client
// @access  Private (Admin only, owner of client)
/**
 * @swagger
 * /api/styles/client/{clientId}:
 *   get:
 *     summary: Get all style images for a client
 *     tags: [StyleImages]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieves all style images associated with a specific client.
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The ID of the client whose style images are to be retrieved.
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
 *         description: A paginated list of style images for the client.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StyleImage'
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
router.get(
    '/client/:clientId',
    validateClientIdInParam,
    styleImageController.getStyleImagesByClientId
);

// @route   DELETE /api/styles/image/:imageId
// @desc    Delete a style image by its ID
// @access  Private (Admin only, owner of client associated with image)
/**
 * @swagger
 * /api/styles/image/{imageId}:
 *   delete:
 *     summary: Delete a style image by its ID
 *     tags: [StyleImages]
 *     security:
 *       - bearerAuth: []
 *     description: Deletes a specific style image by its ID. The image is removed from Cloudinary and the database. The authenticated admin must own the client associated with the image.
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The ID of the style image to delete.
 *     responses:
 *       '200':
 *         description: Style image deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Style image deleted successfully
 *       '401':
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Forbidden (admin does not have permission to delete this image).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Style image not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error (e.g., Cloudinary deletion issue).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
    '/image/:imageId',
    validateImageIdInParam,
    styleImageController.deleteStyleImage
);

module.exports = router;
