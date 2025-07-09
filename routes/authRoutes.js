const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const { loginLimiter } = require("../middlewares/rateLimitMiddleware");

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     AdminCredentials:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: Admin's email address.
 *           example: admin@example.com
 *         password:
 *           type: string
 *           format: password
 *           description: Admin's password (min 6 characters).
 *           example: password123
 *         businessName:
 *           type: string
 *           description: Name of the admin's business.
 *           example: My Fashion House
 *         contactPhone:
 *           type: string
 *           description: Contact phone number for the business.
 *           example: "+1234567890"
 *           nullable: true
 *         businessAddress:
 *           type: string
 *           description: Physical address of the business.
 *           example: "123 Fashion Ave, Lagos, Nigeria"
 *           nullable: true
 *     AdminRegistrationSuccessResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Admin registered successfully
 *         admin:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: cuid
 *               example: clxko2x6y0000ab123cde45fg
 *             email:
 *               type: string
 *               format: email
 *               example: admin@example.com
 *             businessName:
 *               type: string
 *               example: My Fashion House
 *             contactPhone:
 *               type: string
 *               nullable: true
 *               example: "+1234567890"
 *             businessAddress:
 *               type: string
 *               nullable: true
 *               example: "123 Fashion Ave, Lagos, Nigeria"
 *         token:
 *           type: string
 *           format: jwt
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     AdminLoginSuccessResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Login successful
 *         token:
 *           type: string
 *           format: jwt
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         admin:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: cuid
 *               example: clxko2x6y0000ab123cde45fg
 *             email:
 *               type: string
 *               format: email
 *               example: admin@example.com
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: Error message detailing what went wrong.
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 example: field
 *               value:
 *                 type: string
 *                 example: "somevalue"
 *               msg:
 *                 type: string
 *                 example: "Error description"
 *               path:
 *                 type: string
 *                 example: "fieldName"
 *               location:
 *                 type: string
 *                 example: "body"
 *         errorType:
 *           type: string
 *           example: IP_VERIFICATION_REQUIRED
 *     VerifyLoginIpRequest:
 *       type: object
 *       required:
 *         - email
 *         - loginVerificationCode
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: admin@example.com
 *         loginVerificationCode:
 *           type: string
 *           example: "654321"
 *           description: The 6-digit code sent to the admin's email.
 *     ResendLoginIpVerificationRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: admin@example.com
 *   requestBodies:
 *     AdminRegistrationBody:
 *       description: Admin credentials for registration.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminCredentials'
 *     AdminLoginBody:
 *       description: Admin credentials for login.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminCredentials'
 *     VerifyLoginIpBody:
 *       description: Credentials for verifying a login from a new IP.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyLoginIpRequest'
 *     ResendLoginIpVerificationBody:
 *       description: Email for resending login IP verification code.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResendLoginIpVerificationRequest'
 * tags:
 *   name: Authentication
 *   description: Admin authentication and authorization
 */

// Validation middleware for registration and login
const validateRegisterInput = [
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email address.")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long."),
  body("businessName")
    .trim()
    .notEmpty()
    .withMessage("Business name is required."),
  body("contactPhone")
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .withMessage("Contact phone must be a string if provided."),
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
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long."),
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

const validateVerifyLoginIpInput = [
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email address.")
    .normalizeEmail(),
  body("loginVerificationCode")
    .isString()
    .isLength({ min: 6, max: 6 })
    .withMessage("Login verification code must be 6 characters long."),
];

const validateResendLoginIpVerificationInput = [
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email address.")
    .normalizeEmail(),
];

// @route   POST /api/auth/register
// @desc    Register a new admin
// @access  Public
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new admin user
 *     tags: [Authentication]
 *     description: Creates a new admin account.
 *     requestBody:
 *       $ref: '#/components/requestBodies/AdminRegistrationBody'
 *     responses:
 *       '201':
 *         description: Admin registered successfully. Verification email sent.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminRegistrationSuccessResponse'
 *       '400':
 *         description: Bad request (e.g., validation error, admin already exists).
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
router.post("/register", validateRegisterInput, authController.registerAdmin);

// @route   POST /api/auth/login
// @desc    Login admin and get token
// @access  Public
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login an existing admin user
 *     tags: [Authentication]
 *     description: Authenticates an admin and returns a JWT token upon successful login.
 *     requestBody:
 *       $ref: '#/components/requestBodies/AdminLoginBody'
 *     responses:
 *       '200':
 *         description: Login successful.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminLoginSuccessResponse'
 *       '400':
 *         description: Bad request (e.g., validation error).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized (e.g., invalid credentials).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Forbidden (e.g., email not verified).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '429':
 *         description: Too many login attempts (Rate limited).
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
  "/login",
  loginLimiter,
  validateLoginInput,
  authController.loginAdmin
);

// @route   POST /api/auth/verify-email
// @desc    Verify admin's email address
// @access  Public
/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify admin's email address
 *     tags: [Authentication]
 *     description: Verifies an admin's email address using a code sent during registration.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - verificationCode
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newadmin@example.com
 *               verificationCode:
 *                 type: string
 *                 example: "123456"
 *                 description: The 6-digit code sent to the admin's email.
 *     responses:
 *       '200':
 *         description: Email verified successfully. JWT token issued.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminLoginSuccessResponse'
 *       '400':
 *         description: Bad request (e.g., validation error, invalid code, expired token, email already verified).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Admin not found with this email.
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
  "/verify-email",
  validateVerifyEmailInput,
  authController.verifyEmail
);

// @route   POST /api/auth/resend-verification-email
// @desc    Resend the email verification code
// @access  Public
/**
 * @swagger
 * /api/auth/resend-verification-email:
 *   post:
 *     summary: Resend email verification code
 *     tags: [Authentication]
 *     description: Resends a new verification code to an admin's email if their account is not yet verified.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newadmin@example.com
 *     responses:
 *       '200':
 *         description: Verification email sent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: A new verification email has been sent. Please check your inbox.
 *       '400':
 *         description: Bad request (e.g., validation error, email already verified).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Admin not found with this email.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error (e.g., failed to send email).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/resend-verification-email",
  validateResendVerificationEmailInput,
  authController.resendVerificationEmail
);

// @route   POST /api/auth/verify-login-ip
// @desc    Verify a login attempt from a new IP address
// @access  Public
/**
 * @swagger
 * /api/auth/verify-login-ip:
 *   post:
 *     summary: Verify a login attempt from a new IP address
 *     tags: [Authentication]
 *     description: Verifies a login attempt using a code sent to the admin's email due to a new IP address detection.
 *     requestBody:
 *       $ref: '#/components/requestBodies/VerifyLoginIpBody'
 *     responses:
 *       '200':
 *         description: Login IP verified successfully. JWT token issued.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminLoginSuccessResponse'
 *       '400':
 *         description: Bad request (e.g., validation error, invalid code, expired code).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Admin not found with this email.
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
  "/verify-login-ip",
  validateVerifyLoginIpInput,
  authController.verifyLoginIp
);

// @route   POST /api/auth/resend-login-ip-verification
// @desc    Resend the login IP verification code
// @access  Public
/**
 * @swagger
 * /api/auth/resend-login-ip-verification:
 *   post:
 *     summary: Resend login IP verification code
 *     tags: [Authentication]
 *     description: Resends a new verification code to an admin's email if their login attempt from a new IP was challenged.
 *     requestBody:
 *       $ref: '#/components/requestBodies/ResendLoginIpVerificationBody'
 *     responses:
 *       '200':
 *         description: Login IP verification email sent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: A new login verification code has been sent to your email.
 *       '400':
 *         description: Bad request (e.g., validation error, no active login verification pending).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Admin not found with this email.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '500':
 *         description: Internal server error (e.g., failed to send email).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/resend-login-ip-verification",
  validateResendLoginIpVerificationInput,
  authController.resendLoginIpVerificationCode
);

module.exports = router;
