/**
 * @swagger
 * components:
 *   schemas:
 *     Admin:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The unique ID of the admin.
 *           example: 1
 *         email:
 *           type: string
 *           format: email
 *           description: The admin's email address.
 *           example: admin@example.com
 *         businessName:
 *           type: string
 *           description: The name of the admin's business.
 *           example: Fashion Hub
 *         contactPhone:
 *           type: string
 *           description: The contact phone number (optional).
 *           example: +1234567890
 *           nullable: true
 *         businessAddress:
 *           type: string
 *           description: The business address (optional).
 *           example: 123 Main St
 *           nullable: true
 *         isEmailVerified:
 *           type: boolean
 *           description: Whether the admin's email is verified.
 *           example: true
 *     RegisterAdminRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - businessName
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: The admin's email address.
 *           example: admin@example.com
 *         password:
 *           type: string
 *           description: The admin's password (min 6 characters, must include uppercase, lowercase, number, and special character).
 *           example: Password123!
 *         businessName:
 *           type: string
 *           description: The name of the admin's business.
 *           example: Fashion Hub
 *         contactPhone:
 *           type: string
 *           description: The contact phone number (optional, must match E.164 format if provided).
 *           example: +1234567890
 *         businessAddress:
 *           type: string
 *           description: The business address (optional).
 *           example: 123 Main St
 *     LoginAdminRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: The admin's email address.
 *           example: admin@example.com
 *         password:
 *           type: string
 *           description: The admin's password.
 *           example: Password123!
 *     VerifyEmailRequest:
 *       type: object
 *       required:
 *         - email
 *         - verificationCode
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: The admin's email address.
 *           example: admin@example.com
 *         verificationCode:
 *           type: string
 *           description: The 6-digit verification code sent to the admin's email.
 *           example: "123456"
 *     ResendVerificationRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: The admin's email address.
 *           example: admin@example.com
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Error message describing the issue.
 *           example: Invalid credentials (email not found)
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               msg:
 *                 type: string
 *               param:
 *                 type: string
 *               location:
 *                 type: string
 *               value:
 *                 type: string
 *           description: Validation errors (if any).
 *           example:
 *             - msg: Please enter a valid email address.
 *               param: email
 *               location: body
 *               value: invalid-email
 *         errorType:
 *           type: string
 *           description: Specific error type (if applicable).
 *           example: EMAIL_NOT_VERIFIED
 *           nullable: true
 *     TokenResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Success message.
 *           example: Login successful
 *         token:
 *           type: string
 *           description: JWT token for authenticated requests.
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         admin:
 *           $ref: '#/components/schemas/Admin'
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new admin
 *     tags: [Authentication]
 *     description: Creates a new admin account and sends a verification email with a 6-digit code. Rate-limited to 10 requests per 15 minutes per IP.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterAdminRequest'
 *     responses:
 *       201:
 *         description: Admin registered successfully, verification email sent.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Admin registered successfully. Please check your email to verify your account.
 *                 admin:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     email:
 *                       type: string
 *                       example: admin@example.com
 *                     businessName:
 *                       type: string
 *                       example: Fashion Hub
 *       400:
 *         description: Validation errors or email already exists.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many registration attempts.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Too many registration attempts from this IP, please try again after 15 minutes.
 *       500:
 *         description: Server error or failed to send verification email.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in an admin
 *     tags: [Authentication]
 *     description: Authenticates an admin and returns a JWT token if the email is verified. Rate-limited to 10 requests per 15 minutes per IP.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginAdminRequest'
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token and minimal admin details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 admin:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     email:
 *                       type: string
 *                       example: admin@example.com
 *                     businessName:
 *                       type: string
 *                       example: Fashion Hub
 *       400:
 *         description: Validation errors.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid credentials (email or password incorrect).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Email not verified.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many login attempts.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Too many login attempts from this IP, please try again after 15 minutes.
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify an admin's email
 *     tags: [Authentication]
 *     description: Verifies an admin's email using a 6-digit code sent to their email. Returns a JWT token upon successful verification.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyEmailRequest'
 *     responses:
 *       200:
 *         description: Email verified successfully, returns JWT token and admin details.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenResponse'
 *       400:
 *         description: Validation errors, invalid code, or expired token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Admin not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend email verification code
 *     tags: [Authentication]
 *     description: Resends a new 6-digit verification code to the admin's email. Rate-limited to 5 requests per 15 minutes per IP.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResendVerificationRequest'
 *     responses:
 *       200:
 *         description: Verification email resent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: A new verification email has been sent. Please check your inbox.
 *       400:
 *         description: Validation errors or email already verified.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Admin not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many resend attempts.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Too many resend attempts from this IP, please try again after 15 minutes.
 *       500:
 *         description: Server error or failed to send email.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     description: Sends a 6-digit password reset code to the admin's email. Rate-limited to 5 requests per 15 minutes per IP.
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
 *                 description: The admin's email address.
 *                 example: admin@example.com
 *     responses:
 *       200:
 *         description: Password reset code sent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset code has been sent to your email. Please check your inbox.
 *       400:
 *         description: Validation errors.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Email not verified.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email not verified. Please verify your email before resetting password.
 *       404:
 *         description: Admin not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many password reset attempts.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Too many password reset attempts from this IP, please try again after 15 minutes.
 *       500:
 *         description: Server error or failed to send email.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/auth/verify-reset-code:
 *   post:
 *     summary: Verify password reset code
 *     tags: [Authentication]
 *     description: Verifies the 6-digit password reset code before allowing password reset.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - resetCode
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The admin's email address.
 *                 example: admin@example.com
 *               resetCode:
 *                 type: string
 *                 description: The 6-digit reset code sent to the admin's email.
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Reset code verified successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reset code verified successfully. You can now reset your password.
 *                 verified:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Validation errors or invalid/expired code.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Admin not found or no active reset code.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password
 *     tags: [Authentication]
 *     description: Resets the admin's password using the verified reset code.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - resetCode
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The admin's email address.
 *                 example: admin@example.com
 *               resetCode:
 *                 type: string
 *                 description: The 6-digit reset code sent to the admin's email.
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 description: The new password (min 6 characters, must include uppercase, lowercase, number, and special character).
 *                 example: NewPassword123!
 *     responses:
 *       200:
 *         description: Password reset successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset successful. You can now log in with your new password.
 *       400:
 *         description: Validation errors, invalid/expired code, or new password same as old.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Admin not found or no active reset code.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */