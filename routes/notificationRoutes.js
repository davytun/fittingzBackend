const express = require('express');
const { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification, 
  getUnreadCount,
  generateSmartNotifications
} = require('../controllers/notificationController');
const { authenticateJwt } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', authenticateJwt, getNotifications);
router.get('/unread-count', authenticateJwt, getUnreadCount);
router.post('/generate-business', authenticateJwt, generateSmartNotifications);
router.patch('/:id/read', authenticateJwt, markAsRead);
router.patch('/mark-all-read', authenticateJwt, markAllAsRead);
router.delete('/:id', authenticateJwt, deleteNotification);

module.exports = router;