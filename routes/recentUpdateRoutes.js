const express = require('express');
const { getRecentUpdates } = require('../controllers/recentUpdateController');
const { authenticateJwt } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', authenticateJwt, getRecentUpdates);

module.exports = router;