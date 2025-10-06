const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const {
  loginLimiter,
  registerLimiter,
  resendLimiter,
} = require("../middlewares/rateLimitMiddleware");

const router = express.Router();

const validateRegisterInput = [
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email address.")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long.")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/
    )
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."
    ),
  body("businessName")
    .trim()
    .notEmpty()
    .withMessage("Business name is required."),
  body("contactPhone")
    .optional({ checkFalsy: true })
    .matches(/^(\+?\d{1,15}|0\d{10,14})$/)
    .withMessage("Invalid phone number format."),
  body("businessAddress")
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .withMessage("Business address must be a string if provided."),
];

const validateLoginInput = [
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email address.")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required."),
];

const validateVerifyEmailInput = [
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email address.")
    .normalizeEmail(),
  body("verificationCode")
    .isString()
    .isLength({ min: 6, max: 6 })
    .withMessage("Verification code must be 6 characters long."),
];

const validateResendVerificationEmailInput = [
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email address.")
    .normalizeEmail(),
];

router.post(
  "/register",
  registerLimiter,
  validateRegisterInput,
  authController.registerAdmin
);
router.post(
  "/login",
  loginLimiter,
  validateLoginInput,
  authController.loginAdmin
);
router.post(
  "/verify-email",
  validateVerifyEmailInput,
  authController.verifyEmail
);
router.post(
  "/resend-verification",
  resendLimiter,
  validateResendVerificationEmailInput,
  authController.resendVerificationEmail
);

module.exports = router;
