/**
 * @swagger
 * components:
 *   schemas:
 *     StyleImage:
 *       type: object
 *       required:
 *         - id
 *         - imageUrl
 *         - publicId
 *         - adminId
 *         - createdAt
 *       properties:
 *         id:
 *           type: string
 *           description: The unique identifier for the style image
 *         imageUrl:
 *           type: string
 *           description: The URL of the style image
 *         publicId:
 *           type: string
 *           description: The Cloudinary public ID of the image
 *         category:
 *           type: string
 *           nullable: true
 *           description: Optional category of the style image
 *         description:
 *           type: string
 *           nullable: true
 *           description: Optional description of the style image
 *         clientId:
 *           type: string
 *           nullable: true
 *           description: The ID of the client associated with the image, if any
 *         adminId:
 *           type: string
 *           description: The ID of the admin who uploaded the image
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the image was uploaded
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           description: Current page number
 *         pageSize:
 *           type: integer
 *           description: Number of items per page
 *         total:
 *           type: integer
 *           description: Total number of items
 *         totalPages:
 *           type: integer
 *           description: Total number of pages
 */

/**
 * @swagger
 * /api/styles/client/{clientId}/upload:
 *   post:
 *     summary: Upload style images for a client
 *     tags: [StyleImages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the client (25-30 characters)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: The image files to upload
 *               category:
 *                 type: string
 *                 description: Optional category for the images
 *               description:
 *                 type: string
 *                 description: Optional description for the images
 *     responses:
 *       201:
 *         description: Style images uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/StyleImage'
 *       400:
 *         description: Validation errors or no images uploaded
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
 *       403:
 *         description: Forbidden - Client does not belong to the user
 *       404:
 *         description: Client not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/styles/admin/upload:
 *   post:
 *     summary: Upload style images for the admin
 *     tags: [StyleImages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: The image files to upload
 *               category:
 *                 type: string
 *                 description: Optional category for the images
 *               description:
 *                 type: string
 *                 description: Optional description for the images
 *     responses:
 *       201:
 *         description: Style images uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/StyleImage'
 *       400:
 *         description: Validation errors or no images uploaded
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
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/styles/client/{clientId}:
 *   get:
 *     summary: Get style images for a specific client
 *     tags: [StyleImages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the client (25-30 characters)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of images per page
 *     responses:
 *       200:
 *         description: List of style images for the client
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
 *                   $ref: '#/components/schemas/Pagination'
 *       403:
 *         description: Forbidden - Client does not belong to the user
 *       404:
 *         description: Client not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/styles/admin:
 *   get:
 *     summary: Get all style images for the authenticated admin
 *     tags: [StyleImages]
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
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of images per page
 *     responses:
 *       200:
 *         description: List of style images for the admin
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
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/styles/{imageId}:
 *   delete:
 *     summary: Delete a style image by ID
 *     tags: [StyleImages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the style image
 *     responses:
 *       200:
 *         description: Style image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Forbidden - Image does not belong to the user
 *       404:
 *         description: Style image not found or already deleted
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/styles/count:
 *   get:
 *     summary: Get total count of style images
 *     tags: [StyleImages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total count of style images
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/styles/{imageId}:
 *   patch:
 *     summary: Update a style image
 *     tags: [StyleImages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the style image
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *                 description: Optional category for the image
 *               description:
 *                 type: string
 *                 description: Optional description for the image
 *     responses:
 *       200:
 *         description: Style image updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StyleImage'
 *       403:
 *         description: Forbidden - Image does not belong to the user
 *       404:
 *         description: Style image not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/styles/delete-multiple:
 *   post:
 *     summary: Delete multiple style images
 *     tags: [StyleImages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageIds
 *             properties:
 *               imageIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of style image IDs to delete
 *     responses:
 *       200:
 *         description: Images deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 deletedCount:
 *                   type: integer
 *                 failedCount:
 *                   type: integer
 *                 failedImages:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       reason:
 *                         type: string
 *       400:
 *         description: No image IDs provided or invalid request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 */
