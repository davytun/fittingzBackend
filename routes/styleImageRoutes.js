const express = require("express");
const { body, param } = require("express-validator");
const styleImageController = require("../controllers/styleImageController");
const { authenticateJwt } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/authMiddleware");
const { upload } = require("../config/cloudinary");

/**
 * @swagger
 * components:
 * schemas:
 * StyleImage:
 * type: object
 * properties:
 * id:
 * type: string
 * format: cuid
 * description: Unique identifier for the style image.
 * clientId:
 * type: string
 * format: cuid
 * description: ID of the client this style image belongs to (optional).
 * nullable: true
 * adminId:
 * type: string
 * format: cuid
 * description: ID of the admin who owns this style image.
 * imageUrl:
 * type: string
 * format: url
 * description: URL of the uploaded image on Cloudinary.
 * publicId:
 * type: string
 * description: Public ID of the image on Cloudinary (used for deletion/management).
 * category:
 * type: string
 * description: Category of the style image (e.g., Traditional, Wedding, Casual).
 * example: Wedding
 * nullable: true
 * description:
 * type: string
 * description: Optional description for the style image.
 * example: "Elegant lace wedding gown inspiration"
 * nullable: true
 * createdAt:
 * type: string
 * format: date-time
 * description: Timestamp of when the style image was created.
 * updatedAt:
 * type: string
 * format: date-time
 * description: Timestamp of when the style image was last updated.
 * requestBodies:
 * StyleImageUploadBody:
 * description: Style image file and metadata for upload.
 * required: true
 * content:
 * multipart/form-data:
 * schema:
 * type: object
 * required:
 * - styleImage
 * properties:
 * styleImage:
 * type: string
 * format: binary
 * description: The image file to upload.
 * category:
 * type: string
 * description: Category for the style image (e.g., Traditional, Wedding). Optional.
 * example: Casual
 * nullable: true
 * description:
 * type: string
 * description: Optional description for the style image.
 * example: "Summer casual wear idea"
 * nullable: true
 * tags:
 * name: StyleImages
 * description: Style image management (Requires authentication)
 */

const router = express.Router();

// All style image routes are protected by default (if authenticateJwt is the only one you need for basic protection)
router.use(authenticateJwt);

// Validation for client ID in params
const validateClientIdInParam = [
  param("clientId")
    .isString()
    .notEmpty()
    .withMessage("Client ID is required in URL path."),
];

// Validation for image ID in params
const validateImageIdInParam = [
  param("imageId")
    .isString()
    .notEmpty()
    .withMessage("Image ID is required in URL path."),
];

// Validation for style image metadata
const validateStyleImageInput = [
  body("category")
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .withMessage("Category must be a string if provided."),
  body("description")
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .withMessage("Description must be a string if provided."),
];

// @route   GET /api/styles/admin
// @desc    Get all style images uploaded by the admin (across all their clients or admin-owned)
// @access  Private (Admin only)
/**
 * @swagger
 * /api/styles/admin:
 * get:
 * summary: Get all style images uploaded by the admin
 * tags: [StyleImages]
 * security:
 * - bearerAuth: []
 * description: Retrieves all style images owned by the authenticated admin (clientId is null or associated with admin's clients).
 * parameters:
 * - in: query
 * name: page
 * schema:
 * type: integer
 * default: 1
 * description: The page number for pagination.
 * - in: query
 * name: pageSize
 * schema:
 * type: integer
 * default: 10
 * description: The number of items per page.
 * responses:
 * '200':
 * description: A paginated list of style images uploaded by the admin.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * data:
 * type: array
 * items:
 * $ref: '#/components/schemas/StyleImage'
 * pagination:
 * type: object
 * properties:
 * page:
 * type: integer
 * example: 1
 * pageSize:
 * type: integer
 * example: 10
 * total:
 * type: integer
 * example: 100
 * totalPages:
 * type: integer
 * example: 10
 * '401':
 * description: Unauthorized.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 * '500':
 * description: Internal server error.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/admin", styleImageController.getStyleImagesByAdmin);

// @route   POST /api/styles/admin/upload
// @desc    Upload a style image for the admin (business-wide)
// @access  Private (Admin only)
/**
 * @swagger
 * /api/styles/admin/upload:
 * post:
 * summary: Upload a style image for the admin
 * tags: [StyleImages]
 * security:
 * - bearerAuth: []
 * description: Uploads a new style image for the admin's business, not tied to a specific client. The image is stored in Cloudinary and metadata in the database.
 * requestBody:
 * $ref: '#/components/requestBodies/StyleImageUploadBody'
 * responses:
 * '201':
 * description: Style image uploaded successfully.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/StyleImage'
 * '400':
 * description: Bad request (e.g., validation error, no file uploaded, file type error).
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 * '401':
 * description: Unauthorized.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 * '500':
 * description: Internal server error (e.g., Cloudinary upload issue, DB issue).
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/admin/upload",
  upload.array("images"), // Changed from upload.single to upload.array for multiple files
  validateStyleImageInput,
  styleImageController.uploadStyleImageForAdmin
);

// @route   POST /api/styles/client/:clientId/upload
// @desc    Upload a style image for a client
// @access  Private (Admin only, owner of client)
/**
 * @swagger
 * /api/styles/client/{clientId}/upload:
 * post:
 * summary: Upload a style image for a client
 * tags: [StyleImages]
 * security:
 * - bearerAuth: []
 * description: Uploads a new style image for a specific client. The image is stored in Cloudinary and metadata in the database.
 * parameters:
 * - in: path
 * name: clientId
 * required: true
 * schema:
 * type: string
 * format: cuid
 * description: The ID of the client for whom the style image is being uploaded.
 * requestBody:
 * $ref: '#/components/requestBodies/StyleImageUploadBody'
 * responses:
 * '201':
 * description: Style image uploaded successfully.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/StyleImage'
 * '400':
 * description: Bad request (e.g., validation error, no file uploaded, file type error).
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 * '401':
 * description: Unauthorized.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 * '403':
 * description: Forbidden (client does not belong to the admin).
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 * '404':
 * description: Client not found.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 * '500':
 * description: Internal server error (e.g., Cloudinary upload issue, DB issue).
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/client/:clientId/upload",
  validateClientIdInParam,
  upload.array("images"), // Changed from upload.single to upload.array for multiple files
  validateStyleImageInput,
  styleImageController.uploadStyleImage
);

// @route   GET /api/styles/client/:clientId
// @desc    Get all style images for a client
// @access  Private (Admin only, owner of client)
/**
 * @swagger
 * /api/styles/client/{clientId}:
 * get:
 * summary: Get all style images for a client
 * tags: [StyleImages]
 * security:
 * - bearerAuth: []
 * description: Retrieves all style images associated with a specific client.
 * parameters:
 * - in: path
 * name: clientId
 * required: true
 * schema:
 * type: string
 * format: cuid
 * description: The ID of the client whose style images are to be retrieved.
 * - in: query
 * name: page
 * schema:
 * type: integer
 * default: 1
 * description: The page number for pagination.
 * - in: query
 * name: pageSize
 * schema:
 * type: integer
 * default: 10
 * description: The number of items per page.
 * responses:
 * '200':
 * description: A paginated list of style images for the client.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * data:
 * type: array
 * items:
 * $ref: '#/components/schemas/StyleImage'
 * pagination:
 * type: object
 * properties:
 * page:
 * type: integer
 * example: 1
 * pageSize:
 * type: integer
 * example: 10
 * total:
 * type: integer
 * example: 100
 * totalPages:
 * type: integer
 * example: 10
 * '401':
 * description: Unauthorized.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 * '403':
 * description: Forbidden (client does not belong to the admin).
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 * '404':
 * description: Client not found.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 * '500':
 * description: Internal server error.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/client/:clientId",
  validateClientIdInParam,
  styleImageController.getStyleImagesByClientId
);

router.get("/count", styleImageController.getStyleImagesCount);

// @route   PATCH /api/styles/:imageId
// @desc    Update a style image by its ID
// @access  Private (Admin only, owner of image)
/**
 * @swagger
 * /api/styles/{imageId}:
 * patch:
 * summary: Update details of a style image
 * tags: [StyleImages]
 * security:
 * - bearerAuth: []
 * description: Updates the category and/or description of a specific style image. The authenticated admin must own the image.
 * parameters:
 * - in: path
 * name: imageId
 * required: true
 * schema:
 * type: string
 * format: cuid
 * description: The ID of the style image to update.
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * category:
 * type: string
 * description: New category for the style image. Optional.
 * example: Evening Wear
 * nullable: true
 * description:
 * type: string
 * description: New description for the style image. Optional.
 * example: "A stunning gown for gala events"
 * nullable: true
 * responses:
 * '200':
 * description: Style image updated successfully.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/StyleImage'
 * '400':
 * description: Bad request (e.g., validation error).
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 * '401':
 * description: Unauthorized.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 * '403':
 * description: Forbidden (admin does not have permission to update this image).
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 * '404':
 * description: Style image not found.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 * '500':
 * description: Internal server error.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/:imageId",
  validateImageIdInParam,
  validateStyleImageInput,
  styleImageController.updateStyleImage
);

// @route   DELETE /api/styles/:imageId
// @desc    Delete a style image by its ID
// @access  Private (Admin only, owner of image)
/**
 * @swagger
 * /api/styles/{imageId}:
 * delete:
 * summary: Delete a style image
 * tags: [StyleImages]
 * security:
 * - bearerAuth: []
 * description: Deletes a specific style image. The image is removed from Cloudinary and the database.
 * parameters:
 * - in: path
 * name: imageId
 * required: true
 * schema:
 * type: string
 * format: cuid
 * description: The ID of the style image to delete.
 * responses:
 * '200':
 * description: Style image deleted successfully.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message:
 * type: string
 * example: "Style image deleted successfully"
 * '401':
 * description: Unauthorized.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 * '403':
 * description: Forbidden (admin does not have permission to delete this image).
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 * '404':
 * description: Style image not found.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 * '500':
 * description: Internal server error.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 */
router.delete(
  "/:imageId",
  validateImageIdInParam,
  styleImageController.deleteStyleImage
);

// @route   POST /api/styles/delete-multiple
// @desc    Delete multiple style images by their IDs
// @access  Private (Admin only, owner of images)
/**
 * @swagger
 * /api/styles/delete-multiple:
 * post:
 * summary: Delete multiple style images
 * tags: [StyleImages]
 * security:
 * - bearerAuth: []
 * description: Deletes multiple style images based on an array of IDs. Each image is removed from Cloudinary and the database. The authenticated admin must own all images being deleted.
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - imageIds
 * properties:
 * imageIds:
 * type: array
 * items:
 * type: string
 * format: cuid
 * description: An array of style image IDs to be deleted.
 * example: ["clxdr7c8o0000abcde12345fg", "clxdr7c8o0001abcde12345gh"]
 * responses:
 * '200':
 * description: Successful deletion, potentially with some failures.
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * message:
 * type: string
 * example: "2 image(s) deleted successfully. 0 failed."
 * deletedCount:
 * type: integer
 * example: 2
 * failedCount:
 * type: integer
 * example: 0
 * failedImages:
 * type: array
 * items:
 * type: object
 * properties:
 * id:
 * type: string
 * reason:
 * type: string
 * example: []
 * '400':
 * description: Bad request (e.g., no image IDs provided, invalid IDs).
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 * '401':
 * description: Unauthorized.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 * '500':
 * description: Internal server error.
 * content:
 * application/json:
 * schema:
 * $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/delete-multiple", styleImageController.deleteMultipleStyleImages); // authenticateJwt is already applied by router.use()

module.exports = router;
