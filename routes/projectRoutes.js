const express = require('express');
const { body, param } = require('express-validator');
const projectController = require('../controllers/projectController');
const { authenticateJwt } = require('../middlewares/authMiddleware');
const { ProjectStatus } = require('@prisma/client');

/**
 * @swagger
 * components:
 *   schemas:
 *     ProjectStatus:
 *       type: string
 *       enum: [PENDING, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED]
 *       description: Status of the project.
 *       example: IN_PROGRESS
 *     Project:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: cuid
 *           description: Unique identifier for the project.
 *         name:
 *           type: string
 *           description: Name of the project.
 *           example: "Spring Collection Photoshoot"
 *         description:
 *           type: string
 *           description: Detailed description of the project.
 *           nullable: true
 *           example: "Photoshoot for the new spring collection items."
 *         status:
 *           $ref: '#/components/schemas/ProjectStatus'
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Start date of the project.
 *           nullable: true
 *         dueDate:
 *           type: string
 *           format: date-time
 *           description: Due date for the project.
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of when the project was created.
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of when the project was last updated.
 *         clientId:
 *           type: string
 *           format: cuid
 *           description: ID of the client this project belongs to.
 *         adminId:
 *           type: string
 *           format: cuid
 *           description: ID of the admin user who owns this project.
 *         client: # Included in some responses
 *           type: object
 *           nullable: true
 *           properties:
 *             id:
 *               type: string
 *               format: cuid
 *             name:
 *               type: string
 *               example: Jane Doe
 *     ProjectInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the project.
 *           example: "Summer Campaign Design"
 *         description:
 *           type: string
 *           nullable: true
 *         status:
 *           $ref: '#/components/schemas/ProjectStatus'
 *         startDate:
 *           type: string
 *           format: date # Or date-time, depending on desired input precision
 *           description: "YYYY-MM-DD"
 *           nullable: true
 *         dueDate:
 *           type: string
 *           format: date # Or date-time
 *           description: "YYYY-MM-DD"
 *           nullable: true
 *   requestBodies:
 *     ProjectCreationBody:
 *       description: Project details for creation. `clientId` is part of the URL.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProjectInput'
 *     ProjectUpdateBody:
 *       description: Project details for update. Fields are optional.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProjectInput' # Can reuse, or make a partial version
 * tags:
 *   name: Projects
 *   description: Project management operations (Requires authentication)
 */

const router = express.Router();

// All project routes are protected
router.use(authenticateJwt);

// Validation for client ID in params (used when creating/listing projects for a client)
const validateClientIdInParam = [
    param('clientId').isString().notEmpty().withMessage('Client ID parameter is required.')
];

// Validation for project ID in params
const validateProjectIdInParam = [
    param('projectId').isString().notEmpty().withMessage('Project ID parameter is required.')
];

// Validation for project input data (for create and update)
const validateProjectInput = [
    body('name').trim().notEmpty().withMessage('Project name is required.'),
    body('description').optional({ checkFalsy: true }).isString().trim(),
    body('status').optional().isIn(Object.values(ProjectStatus))
        .withMessage(`Invalid status. Must be one of: ${Object.values(ProjectStatus).join(', ')}`),
    body('startDate').optional({ checkFalsy: true }).isISO8601().toDate().withMessage('Invalid start date format.'),
    body('dueDate').optional({ checkFalsy: true }).isISO8601().toDate().withMessage('Invalid due date format.')
        .custom((value, { req }) => {
            if (req.body.startDate && value && new Date(value) < new Date(req.body.startDate)) {
                throw new Error('Due date cannot be before start date.');
            }
            return true;
        }),
];


// @route   POST /api/projects/client/:clientId
// @desc    Create a new project for a specific client
// @access  Private (Admin only, owner of client)
/**
 * @swagger
 * /api/projects/client/{clientId}:
 *   post:
 *     summary: Create a new project for a client
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     description: Creates a new project linked to a specific client. The client must belong to the authenticated admin.
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The ID of the client for whom the project is being created.
 *     requestBody:
 *       $ref: '#/components/requestBodies/ProjectCreationBody'
 *     responses:
 *       '201':
 *         description: Project created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       '400':
 *         description: Bad request (e.g., validation error, invalid client ID).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Forbidden (client does not belong to the admin).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Client not found.
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
    '/client/:clientId',
    validateClientIdInParam,
    validateProjectInput,
    projectController.createProjectForClient
);

// @route   GET /api/projects
// @desc    Get all projects for the authenticated admin
// @access  Private (Admin only)
/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects for the authenticated admin
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieves a list of all projects associated with the currently authenticated admin.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination.
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of items per page.
 *     responses:
 *       '200':
 *         description: A paginated list of projects.
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
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     pageSize:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 100
 *                     totalPages:
 *                       type: integer
 *                       example: 10
 *       '401':
 *         description: Unauthorized.
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
router.get('/', projectController.getAllProjectsForAdmin);

// @route   GET /api/projects/client/:clientId
// @desc    Get all projects for a specific client
// @access  Private (Admin only, owner of client)
/**
 * @swagger
 * /api/projects/client/{clientId}:
 *   get:
 *     summary: Get all projects for a specific client
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieves all projects associated with a specific client. The client must belong to the authenticated admin.
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The ID of the client whose projects are to be retrieved.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination.
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of items per page.
 *     responses:
 *       '200':
 *         description: A paginated list of projects for the specified client.
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
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     pageSize:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 100
 *                     totalPages:
 *                       type: integer
 *                       example: 10
 *       '401':
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Forbidden (client does not belong to the admin).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Client not found.
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
router.get(
    '/client/:clientId',
    validateClientIdInParam,
    projectController.getProjectsByClientId
);

// @route   GET /api/projects/:projectId
// @desc    Get a single project by its ID
// @access  Private (Admin only, owner of project)
/**
 * @swagger
 * /api/projects/{projectId}:
 *   get:
 *     summary: Get a single project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     description: Retrieves a specific project by its ID. The project must belong to the authenticated admin.
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The ID of the project to retrieve.
 *     responses:
 *       '200':
 *         description: Detailed information about the project.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       '401':
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Forbidden (project does not belong to the admin).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Project not found.
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
router.get(
    '/:projectId',
    validateProjectIdInParam,
    projectController.getProjectById
);

// @route   PUT /api/projects/:projectId
// @desc    Update a project by its ID
// @access  Private (Admin only, owner of project)
/**
 * @swagger
 * /api/projects/{projectId}:
 *   put:
 *     summary: Update a project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     description: Updates an existing project's details. The project must belong to the authenticated admin.
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The ID of the project to update.
 *     requestBody:
 *       $ref: '#/components/requestBodies/ProjectUpdateBody'
 *     responses:
 *       '200':
 *         description: Project updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       '400':
 *         description: Bad request (e.g., validation error).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '401':
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Forbidden (project does not belong to the admin).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Project not found.
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
router.put(
    '/:projectId',
    validateProjectIdInParam,
    validateProjectInput,
    projectController.updateProject
);

// @route   DELETE /api/projects/:projectId
// @desc    Delete a project by its ID
// @access  Private (Admin only, owner of project)
/**
 * @swagger
 * /api/projects/{projectId}:
 *   delete:
 *     summary: Delete a project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     description: Deletes a specific project by its ID. The project must belong to the authenticated admin.
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: cuid
 *         description: The ID of the project to delete.
 *     responses:
 *       '200':
 *         description: Project deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Project deleted successfully
 *       '401':
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '403':
 *         description: Forbidden (project does not belong to the admin).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '404':
 *         description: Project not found.
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
router.delete(
    '/:projectId',
    validateProjectIdInParam,
    projectController.deleteProject
);

module.exports = router;
