const express = require('express');
const { getRecentUpdates, getActivitySummary } = require('../controllers/recentUpdateController');
const { authenticateJwt } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', authenticateJwt, getRecentUpdates);
router.get('/summary', authenticateJwt, getActivitySummary);

module.exports = router;