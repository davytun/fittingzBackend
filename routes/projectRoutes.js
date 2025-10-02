const express = require('express');
const { body, param } = require('express-validator');
const projectController = require('../controllers/projectController');
const { authenticateJwt } = require('../middlewares/authMiddleware');
const { ProjectStatus } = require('@prisma/client');

const router = express.Router();

// All project routes are protected
router.use(authenticateJwt);

// Validation for client ID in params (used when creating/listing projects for a client)
const validateClientIdInParam = [
    param('clientId')
        .isString()
        .notEmpty()
        .isLength({ min: 25, max: 30 })
        .withMessage('Invalid client ID format. Must be 25-30 characters.')
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


router.post(
    '/client/:clientId',
    validateClientIdInParam,
    validateProjectInput,
    projectController.createProjectForClient
);

router.get('/', projectController.getAllProjectsForAdmin);

router.get(
    '/client/:clientId',
    validateClientIdInParam,
    projectController.getProjectsByClientId
);

router.get(
    '/:projectId',
    validateProjectIdInParam,
    projectController.getProjectById
);

router.put(
    '/:projectId',
    validateProjectIdInParam,
    validateProjectInput,
    projectController.updateProject
);

router.delete(
    '/:projectId',
    validateProjectIdInParam,
    projectController.deleteProject
);

module.exports = router;
