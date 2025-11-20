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
    .custom((value) => {
      if (!/(?=.*[a-z])/.test(value)) {
        throw new Error('Password must contain at least one lowercase letter');
      }
      if (!/(?=.*[A-Z])/.test(value)) {
        throw new Error('Password must contain at least one uppercase letter');
      }
      if (!/(?=.*\d)/.test(value)) {
        throw new Error('Password must contain at least one number');
      }
      if (!/(?=.*[^a-zA-Z0-9])/.test(value)) {
        throw new Error('Password must contain at least one special character');
      }
      return true;
    }),
  body("businessName")
    .trim()
    .notEmpty()
    .withMessage("Business name is required."),
  body("contactPhone")
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value) return true; // Optional field
      if (!/^\+?\d+$/.test(value)) {
        throw new Error('Phone number can only contain numbers and an optional + sign');
      }
      if (value.length > 15) {
        throw new Error('Phone number is too long. Maximum 15 digits allowed');
      }
      return true;
    }),
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
    .isLength({ min: 4, max: 4 })
    .withMessage("Verification code must be 4 characters long."),
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

const validateForgotPasswordInput = [
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email address.")
    .normalizeEmail(),
];

const validateVerifyResetCodeInput = [
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email address.")
    .normalizeEmail(),
  body("resetCode")
    .isString()
    .isLength({ min: 4, max: 4 })
    .withMessage("Reset code must be 4 characters long."),
];

const validateResetPasswordInput = [
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email address.")
    .normalizeEmail(),
  body("resetCode")
    .isString()
    .isLength({ min: 4, max: 4 })
    .withMessage("Reset code must be 4 characters long."),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long.")
    .custom((value) => {
      if (!/(?=.*[a-z])/.test(value)) {
        throw new Error('Password must contain at least one lowercase letter');
      }
      if (!/(?=.*[A-Z])/.test(value)) {
        throw new Error('Password must contain at least one uppercase letter');
      }
      if (!/(?=.*\d)/.test(value)) {
        throw new Error('Password must contain at least one number');
      }
      if (!/(?=.*[^a-zA-Z0-9])/.test(value)) {
        throw new Error('Password must contain at least one special character');
      }
      return true;
    }),
];

router.post(
  "/forgot-password",
  resendLimiter,
  validateForgotPasswordInput,
  authController.forgotPassword
);
router.post(
  "/verify-reset-code",
  validateVerifyResetCodeInput,
  authController.verifyResetCode
);
router.post(
  "/reset-password",
  validateResetPasswordInput,
  authController.resetPassword
);

router.post(
  "/refresh",
  authController.refreshToken
);

module.exports = router;
