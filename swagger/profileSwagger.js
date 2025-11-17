/**
 * @swagger
 * components:
 *   schemas:
 *     Profile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The unique ID of the admin.
 *           example: cmg5c2q7y0000tv4cpuk0wqa0
 *         email:
 *           type: string
 *           format: email
 *           description: The admin's email address.
 *           example: admin@example.com
 *         businessName:
 *           type: string
 *           description: The business name.
 *           example: Fashion House Ltd
 *         contactPhone:
 *           type: string
 *           nullable: true
 *           description: The contact phone number.
 *           example: +1234567890
 *         businessAddress:
 *           type: string
 *           nullable: true
 *           description: The business address.
 *           example: 123 Fashion Street, City
 *         profileImageUrl:
 *           type: string
 *           nullable: true
 *           description: URL of the profile image.
 *           example: https://res.cloudinary.com/example/image/upload/v1234567890/profile_images/profile_image_123.jpg
 *         isEmailVerified:
 *           type: boolean
 *           description: Whether the email is verified.
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the profile was created.
 *           example: 2025-09-30T13:36:00Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the profile was last updated.
 *           example: 2025-09-30T13:36:00Z
 *     UpdateProfileRequest:
 *       type: object
 *       properties:
 *         businessName:
 *           type: string
 *           description: The business name (optional).
 *           example: Fashion House Ltd
 *         contactPhone:
 *           type: string
 *           description: The contact phone number (optional).
 *           example: +1234567890
 *         businessAddress:
 *           type: string
 *           description: The business address (optional).
 *           example: 123 Fashion Street, City
 *         profileImage:
 *           type: string
 *           format: binary
 *           description: Profile image file (optional).
 */

/**
 * @swagger
 * /api/v1/profile:
 *   get:
 *     summary: Get admin profile
 *     tags: [Profile]
 *     description: Retrieves the authenticated admin's profile information. Rate-limited to 100 requests per 15 minutes per IP.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       401:
 *         description: Unauthorized (missing or invalid JWT).
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
 *         description: Too many requests.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Too many requests from this IP, please try again after 15 minutes.
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   put:
 *     summary: Update admin profile
 *     tags: [Profile]
 *     description: Updates the authenticated admin's profile information. Supports profile image upload. Rate-limited to 100 requests per 15 minutes per IP.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Profile'
 *       400:
 *         description: Validation errors.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized (missing or invalid JWT).
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
 *         description: Too many requests.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Too many requests from this IP, please try again after 15 minutes.
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */