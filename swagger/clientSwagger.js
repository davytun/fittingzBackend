/**
 * @swagger
 * components:
 *   schemas:
 *     Client:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The unique ID of the client.
 *           example: cmg5c2q7y0000tv4cpuk0wqa0
 *         name:
 *           type: string
 *           description: The client's name.
 *           example: John Doe
 *         phone:
 *           type: string
 *           description: The client's phone number (optional, E.164 format).
 *           example: +1234567890
 *           nullable: true
 *         email:
 *           type: string
 *           format: email
 *           description: The client's email address (optional).
 *           example: john.doe@example.com
 *           nullable: true
 *         gender:
 *           type: string
 *           description: The client's gender (optional).
 *           example: Male
 *           nullable: true
 *         favoriteColors:
 *           type: array
 *           items:
 *             type: string
 *           description: The client's favorite colors (optional).
 *           example: ["Blue", "Red"]
 *         dislikedColors:
 *           type: array
 *           items:
 *             type: string
 *           description: The client's disliked colors (optional).
 *           example: ["Green"]
 *         preferredStyles:
 *           type: array
 *           items:
 *             type: string
 *           description: The client's preferred styles (optional).
 *           example: ["Casual", "Formal"]
 *         bodyShape:
 *           type: string
 *           description: The client's body shape (optional).
 *           example: Pear
 *           nullable: true
 *         additionalDetails:
 *           type: string
 *           description: Additional details about the client (optional).
 *           example: Prefers lightweight fabrics
 *           nullable: true
 *         adminId:
 *           type: string
 *           description: The ID of the admin who owns this client.
 *           example: cmg5c2q7y0000tv4cpuk0wqa0
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the client was created.
 *           example: 2025-09-30T13:36:00Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the client was last updated.
 *           example: 2025-09-30T13:36:00Z
 *         measurements:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               fields:
 *                 type: object
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *               updatedAt:
 *                 type: string
 *                 format: date-time
 *           description: The client's measurements (for GET /clients/:id).
 *           nullable: true
 *         styleImages:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *               publicId:
 *                 type: string
 *               category:
 *                 type: string
 *                 nullable: true
 *               description:
 *                 type: string
 *                 nullable: true
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *               updatedAt:
 *                 type: string
 *                 format: date-time
 *           description: The client's style images (for GET /clients/:id).
 *           nullable: true
 *         _count:
 *           type: object
 *           description: Count of related measurements and style images (for GET /clients).
 *           properties:
 *             measurements:
 *               type: integer
 *               example: 1
 *             styleImages:
 *               type: integer
 *               example: 2
 *           nullable: true
 *     Measurement:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The unique ID of the measurement.
 *           example: cmg5c2q7y0000tv4cpuk0wqa1
 *         clientId:
 *           type: string
 *           description: The ID of the client associated with the measurement.
 *           example: cmg5c2q7y0000tv4cpuk0wqa0
 *         fields:
 *           type: object
 *           description: The measurement fields (e.g., bust, waist). Arbitrary key-value pairs.
 *           example: { "bust": 90, "waist": "70cm", "isCustom": true }
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the measurement was created.
 *           example: 2025-09-30T13:36:00Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the measurement was last updated.
 *           example: 2025-09-30T13:36:00Z
 *         client:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: John Doe
 *           description: The client's name.
 *     CreateClientRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: The client's name.
 *           example: John Doe
 *         phone:
 *           type: string
 *           description: The client's phone number (optional, E.164 format).
 *           example: +1234567890
 *         email:
 *           type: string
 *           format: email
 *           description: The client's email address (optional).
 *           example: john.doe@example.com
 *         gender:
 *           type: string
 *           description: The client's gender (optional).
 *           example: Male
 *         favoriteColors:
 *           type: array
 *           items:
 *             type: string
 *           description: The client's favorite colors (optional).
 *           example: ["Blue", "Red"]
 *         dislikedColors:
 *           type: array
 *           items:
 *             type: string
 *           description: The client's disliked colors (optional).
 *           example: ["Green"]
 *         preferredStyles:
 *           type: array
 *           items:
 *             type: string
 *           description: The client's preferred styles (optional).
 *           example: ["Casual", "Formal"]
 *         bodyShape:
 *           type: string
 *           description: The client's body shape (optional).
 *           example: Pear
 *         additionalDetails:
 *           type: string
 *           description: Additional details about the client (optional).
 *           example: Prefers lightweight fabrics
 *     CreateMeasurementRequest:
 *       type: object
 *       required:
 *         - fields
 *       properties:
 *         fields:
 *           type: object
 *           description: The measurement fields (e.g., bust, waist). Must be a non-empty JSON object with arbitrary key-value pairs.
 *           example: { "bust": 90, "waist": "70cm", "isCustom": true, "details": { "note": "tight fit" } }
 *     ClientListResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Client'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *               example: 1
 *             pageSize:
 *               type: integer
 *               example: 10
 *             total:
 *               type: integer
 *               example: 50
 *             totalPages:
 *               type: integer
 *               example: 5
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Error message describing the issue.
 *           example: Client not found
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
 *             - msg: Name is required
 *               param: name
 *               location: body
 *               value: ""
 */

/**
 * @swagger
 * /api/clients:
 *   post:
 *     summary: Create a new client
 *     tags: [Clients]
 *     description: Creates a new client for the authenticated admin. Requires JWT authentication. Rate-limited to 20 requests per 15 minutes per IP.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateClientRequest'
 *     responses:
 *       201:
 *         description: Client created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 *       400:
 *         description: Validation errors or admin not found.
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
 *       429:
 *         description: Too many client creation attempts.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Too many client creation attempts from this IP, please try again after 15 minutes.
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   get:
 *     summary: Get all clients for the authenticated admin
 *     tags: [Clients]
 *     description: Retrieves a paginated list of clients for the authenticated admin. Supports pagination via query parameters (page, pageSize). Includes count of measurements and style images. Rate-limited to 100 requests per 15 minutes per IP.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination.
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *         description: Number of clients per page.
 *     responses:
 *       200:
 *         description: List of clients with pagination metadata.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClientListResponse'
 *       401:
 *         description: Unauthorized (missing or invalid JWT).
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
 * /api/clients/{id}:
 *   get:
 *     summary: Get a client by ID
 *     tags: [Clients]
 *     description: Retrieves a client by ID, ensuring it belongs to the authenticated admin. Includes related measurements and style images. Rate-limited to 100 requests per 15 minutes per IP.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The client ID (CUID, 25–30 characters).
 *     responses:
 *       200:
 *         description: Client details, including measurements and style images.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 *       401:
 *         description: Unauthorized (missing or invalid JWT).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden (client belongs to another admin).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Client not found.
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
 *     summary: Update a client by ID
 *     tags: [Clients]
 *     description: Updates a client by ID, ensuring it belongs to the authenticated admin. Rate-limited to 100 requests per 15 minutes per IP.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The client ID (CUID, 25–30 characters).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateClientRequest'
 *     responses:
 *       200:
 *         description: Client updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
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
 *       403:
 *         description: Forbidden (client belongs to another admin).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Client not found.
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
 *   delete:
 *     summary: Delete a client by ID
 *     tags: [Clients]
 *     description: Deletes a client by ID, ensuring it belongs to the authenticated admin. Related measurements and style images are deleted automatically (cascade). Rate-limited to 100 requests per 15 minutes per IP.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The client ID (CUID, 25–30 characters).
 *     responses:
 *       200:
 *         description: Client deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Client deleted successfully
 *       401:
 *         description: Unauthorized (missing or invalid JWT).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden (client belongs to another admin).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Client not found.
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
 * /api/clients/{clientId}/measurements:
 *   post:
 *     summary: Add or update measurements for a client
 *     tags: [Measurements]
 *     description: Adds or updates measurements for a specific client, identified by clientId. Requires JWT authentication. Rate-limited to 20 requests per 15 minutes per IP.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: The client ID (CUID, 25–30 characters).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMeasurementRequest'
 *     responses:
 *       200:
 *         description: Measurement added or updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Measurement'
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
 *       403:
 *         description: Forbidden (client belongs to another admin).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Client not found.
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
 *                   example: Too many measurement creation attempts from this IP, please try again after 15 minutes.
 *       500:
 *         description: Server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   get:
 *     summary: Get measurements for a client
 *     tags: [Measurements]
 *     description: Retrieves measurements for a specific client, identified by clientId. Returns an empty measurement object if none exists. Rate-limited to 100 requests per 15 minutes per IP.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: The client ID (CUID, 25–30 characters).
 *     responses:
 *       200:
 *         description: Measurement details or empty measurement object.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Measurement'
 *       401:
 *         description: Unauthorized (missing or invalid JWT).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden (client belongs to another admin).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Client not found.
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
 *   delete:
 *     summary: Delete measurements for a client
 *     tags: [Measurements]
 *     description: Deletes measurements for a specific client, identified by clientId. Rate-limited to 100 requests per 15 minutes per IP.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: The client ID (CUID, 25–30 characters).
 *     responses:
 *       200:
 *         description: Measurements deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Measurements deleted successfully for client.
 *       401:
 *         description: Unauthorized (missing or invalid JWT).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden (client belongs to another admin).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Client or measurements not found.
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
