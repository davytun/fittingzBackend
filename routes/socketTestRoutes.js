const express = require('express');
const { getIO } = require('../socket');
const { authenticateJwt } = require('../middlewares/authMiddleware');

const router = express.Router();

// Test real-time notification
router.post('/test-notification', authenticateJwt, (req, res) => {
  const { adminId } = req.user;
  
  getIO().to(`admin_${adminId}`).emit('test_notification', {
    message: 'Real-time Socket.IO is working!',
    timestamp: new Date()
  });
  
  res.json({
    success: true,
    message: 'Test notification sent via Socket.IO'
  });
});

module.exports = router;