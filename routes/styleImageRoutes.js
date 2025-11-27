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

// Admin routes
router.get("/admin/styles", styleImageController.getStyleImagesByAdmin);
router.post(
  "/admin/styles/upload",
  upload.any(),
  validateStyleImageInput,
  styleImageController.uploadStyleImageForAdmin
);
router.get("/admin/styles/count", styleImageController.getStyleImagesCount);
router.post("/admin/styles/delete-multiple", styleImageController.deleteMultipleStyleImages);

// Client nested routes
router.post(
  "/:clientId/styles/upload",
  validateClientIdInParam,
  upload.any(),
  validateStyleImageInput,
  styleImageController.uploadStyleImage
);

router.get(
  "/:clientId/styles",
  validateClientIdInParam,
  styleImageController.getStyleImagesByClientId
);

router.get(
  "/:clientId/styles/:imageId",
  validateClientIdInParam,
  validateImageIdInParam,
  styleImageController.getStyleImageById
);

router.patch(
  "/:clientId/styles/:imageId",
  validateClientIdInParam,
  validateImageIdInParam,
  validateStyleImageInput,
  styleImageController.updateStyleImage
);

router.delete(
  "/:clientId/styles/:imageId",
  validateClientIdInParam,
  validateImageIdInParam,
  styleImageController.deleteStyleImage
);

module.exports = router;