const express = require("express");
const { body, param } = require("express-validator");
const styleImageController = require("../controllers/styleImageController");
const { authenticateJwt } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/authMiddleware");
const { upload } = require("../config/cloudinary");

const router = express.Router();

// All style image routes are protected by default
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

// Get all style images uploaded by the admin
router.get("/admin", styleImageController.getStyleImagesByAdmin);

// Upload a style image for the admin
router.post(
  "/admin/upload",
  upload.array("images"),
  validateStyleImageInput,
  styleImageController.uploadStyleImageForAdmin
);

// Upload a style image for a client
router.post(
  "/client/:clientId/upload",
  validateClientIdInParam,
  upload.array("images"),
  validateStyleImageInput,
  styleImageController.uploadStyleImage
);

// Get all style images for a client
router.get(
  "/client/:clientId",
  validateClientIdInParam,
  styleImageController.getStyleImagesByClientId
);

router.get("/count", styleImageController.getStyleImagesCount);

// Update a style image by its ID
router.patch(
  "/:imageId",
  validateImageIdInParam,
  validateStyleImageInput,
  styleImageController.updateStyleImage
);

// Delete a style image by its ID
router.delete(
  "/:imageId",
  validateImageIdInParam,
  styleImageController.deleteStyleImage
);

// Delete multiple style images by their IDs
router.post("/delete-multiple", styleImageController.deleteMultipleStyleImages);

module.exports = router;