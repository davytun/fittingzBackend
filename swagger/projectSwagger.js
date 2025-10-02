/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - clientId
 *         - adminId
 *         - status
 *         - createdAt
 *       properties:
 *         id:
 *           type: string
 *           description: The unique identifier for the project
 *         name:
 *           type: string
 *           description: The name of the project
 *         description:
 *           type: string
 *           nullable: true
 *           description: Optional description of the project
 *         status:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, COMPLETED, CANCELLED]
 *           description: The status of the project
 *         startDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: The start date of the project
 *         dueDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: The due date of the project
 *         clientId:
 *           type: string
 *           description: The ID of the client associated with the project
 *         adminId:
 *           type: string
 *           description: The ID of the admin who owns the project
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time when the project was created
 *         client:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: The ID of the client
 *             name:
 *               type: string
 *               description: The name of the client
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           description: Current page number
 *         pageSize:
 *           type: integer
 *           description: Number of items per page
 *         total:
 *           type: integer
 *           description: Total number of items
 *         totalPages:
 *           type: integer
 *           description: Total number of pages
 */

/**
 * @swagger
 * /api/projects/client/{clientId}:
 *   post:
 *     summary: Create a new project for a specific client
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the client (25-30 characters)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the project
 *               description:
 *                 type: string
 *                 description: Optional description of the project
 *               status:
 *                 type: string
 *                 enum: [PENDING, IN_PROGRESS, COMPLETED, CANCELLED]
 *                 description: The status of the project
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: The start date of the project (YYYY-MM-DD)
 *                 example: "2025-07-10"
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 description: The due date of the project (YYYY-MM-DD)
 *                 example: "2025-07-15"
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         description: Validation errors or invalid date format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                 details:
 *                   type: string
 *                 solution:
 *                   type: string
 *                 example:
 *                   type: object
 *                   properties:
 *                     startDate:
 *                       type: string
 *                     dueDate:
 *                       type: string
 *       403:
 *         description: Forbidden - Client does not belong to the user
 *       404:
 *         description: Client not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects for the authenticated admin
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of projects per page
 *     responses:
 *       200:
 *         description: List of projects for the admin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/projects/client/{clientId}:
 *   get:
 *     summary: Get all projects for a specific client
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the client (25-30 characters)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of projects per page
 *     responses:
 *       200:
 *         description: List of projects for the client
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       403:
 *         description: Forbidden - Client does not belong to the user
 *       404:
 *         description: Client not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/projects/{projectId}:
 *   get:
 *     summary: Get a project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the project
 *     responses:
 *       200:
 *         description: Project details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       403:
 *         description: Forbidden - Project does not belong to the user
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/projects/{projectId}:
 *   put:
 *     summary: Update a project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the project
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the project
 *               description:
 *                 type: string
 *                 description: Optional description of the project
 *               status:
 *                 type: string
 *                 enum: [PENDING, IN_PROGRESS, COMPLETED, CANCELLED]
 *                 description: The status of the project
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: The start date of the project (YYYY-MM-DD)
 *                 example: "2025-07-10"
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 description: The due date of the project (YYYY-MM-DD)
 *                 example: "2025-07-15"
 *     responses:
 *       200:
 *         description: Project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         description: Validation errors or invalid date format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *       403:
 *         description: Forbidden - Project does not belong to the user
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/projects/{projectId}:
 *   delete:
 *     summary: Delete a project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the project
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Forbidden - Project does not belong to the user
 *       404:
 *         description: Project not found or already deleted
 *       500:
 *         description: Server error
 */