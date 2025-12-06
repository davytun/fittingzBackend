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
 *     ClientWithPreferences:
 *       allOf:
 *         - $ref: '#/components/schemas/Client'
 *         - type: object
 *           properties:
 *             favoriteColors:
 *               type: array
 *               items:
 *                 type: string
 *               description: The client's favorite colors (optional).
 *               example: ["Blue", "Red"]
 *             dislikedColors:
 *               type: array
 *               items:
 *                 type: string
 *               description: The client's disliked colors (optional).
 *               example: ["Green"]
 *             preferredStyles:
 *               type: array
 *               items:
 *                 type: string
 *               description: The client's preferred styles (optional).
 *               example: ["Casual", "Formal"]
 *             bodyShape:
 *               type: string
 *               description: The client's body shape (optional).
 *               example: Pear
 *               nullable: true
 *             additionalDetails:
 *               type: string
 *               description: Additional details about the client (optional).
 *               example: Prefers lightweight fabrics
 *               nullable: true
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
 *         orderId:
 *           type: string
 *           nullable: true
 *           description: The ID of the order associated with the measurement (optional).
 *           example: cmg5c2q7y0000tv4cpuk0wqa2
 *         fields:
 *           type: object
 *           description: The measurement fields (e.g., bust, waist). Arbitrary key-value pairs.
 *           example: { "bust": 90, "waist": "70cm", "isCustom": true }
 *         isDefault:
 *           type: boolean
 *           description: Whether this is the default measurement for the client.
 *           example: true
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
 *         order:
 *           type: object
 *           nullable: true
 *           properties:
 *             orderNumber:
 *               type: string
 *               example: ORD-001
 *           description: The order details (if measurement is tied to an order).
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
 *     CreateMeasurementRequest:
 *       type: object
 *       required:
 *         - fields
 *       properties:
 *         fields:
 *           type: object
 *           description: The measurement fields (e.g., bust, waist). Must be a non-empty JSON object with arbitrary key-value pairs.
 *           example: { "bust": 90, "waist": "70cm", "isCustom": true, "details": { "note": "tight fit" } }
 *         orderId:
 *           type: string
 *           description: The ID of the order to associate with this measurement (optional).
 *           example: cmg5c2q7y0000tv4cpuk0wqa2
 *         isDefault:
 *           type: boolean
 *           description: Whether this should be the default measurement for the client (optional). First measurement is automatically default.
 *           example: false
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
 * /api/v1/clients:
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
 * /api/v1/clients/{id}:
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
 *   patch:
 *     summary: Update a client by ID
 *     tags: [Clients]
 *     description: Partially updates a client by ID, ensuring it belongs to the authenticated admin. Only provided fields will be updated. Rate-limited to 100 requests per 15 minutes per IP.
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
 * /api/v1/clients/{clientId}/measurements:
 *   post:
 *     summary: Add measurements for a client
 *     tags: [Measurements]
 *     description: Adds measurements for a specific client, identified by clientId. Can be tied to a specific order or set as default. First measurement is automatically default. Requires JWT authentication. Rate-limited to 20 requests per 15 minutes per IP.
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
 *       201:
 *         description: Measurement added successfully.
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
 *     description: Retrieves all measurements for a specific client, identified by clientId. Returns array of measurements ordered by default first, then by creation date. Rate-limited to 100 requests per 15 minutes per IP.
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
 *         description: Array of measurements for the client.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Measurement'
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
 *
 * /api/v1/clients/measurements/{id}:
 *   put:
 *     summary: Update a measurement by ID
 *     tags: [Measurements]
 *     description: Updates a specific measurement by ID. Can update fields and default status. Rate-limited to 100 requests per 15 minutes per IP.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The measurement ID (CUID, 25–30 characters).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMeasurementRequest'
 *     responses:
 *       200:
 *         description: Measurement updated successfully.
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
 *         description: Forbidden (measurement belongs to another admin).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Measurement not found.
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
 *
 *   delete:
 *     summary: Delete a measurement by ID
 *     tags: [Measurements]
 *     description: Deletes a specific measurement by ID. Rate-limited to 100 requests per 15 minutes per IP.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The measurement ID (CUID, 25–30 characters).
 *     responses:
 *       200:
 *         description: Measurement deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Measurement deleted successfully.
 *       401:
 *         description: Unauthorized (missing or invalid JWT).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden (measurement belongs to another admin).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Measurement not found.
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
