const express = require("express");
const { body } = require("express-validator");
const ProfileController = require("../controllers/profileController");
const { authenticateJwt } = require("../middlewares/authMiddleware");
const { generalApiLimiter } = require("../middlewares/rateLimitMiddleware");
const { upload } = require("../config/cloudinary");

const router = express.Router();

// Validation for profile update
const validateProfileUpdate = [
  body("businessName")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Business name must be between 1 and 100 characters."),
  body("contactPhone")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 10, max: 20 })
    .withMessage("Contact phone must be between 10 and 20 characters."),
  body("businessAddress")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Business address must be between 1 and 500 characters."),
];

// All profile routes are protected
router.use(authenticateJwt);

// Routes
router.get(
  "/",
  generalApiLimiter,
  ProfileController.getProfile
);

router.put(
  "/",
  generalApiLimiter,
  upload.single('profileImage'),
  validateProfileUpdate,
  ProfileController.updateProfile
);

module.exports = router;