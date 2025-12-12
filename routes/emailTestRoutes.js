const express = require('express');
const emailNotificationService = require('../services/emailNotificationService');
const emailCronService = require('../services/emailCronService');
const { authenticateJwt } = require('../middlewares/authMiddleware');

const router = express.Router();

// Test critical notification email
router.post('/test-alert', authenticateJwt, async (req, res) => {
  try {
    const { id: adminId, email } = req.user;
    
    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: 'Admin ID not found in request'
      });
    }
    
    const mockNotification = {
      id: 'test-123',
      type: 'SYSTEM_ALERT',
      priority: 'HIGH',
      title: 'Test Critical Alert',
      message: 'This is a test notification to verify email delivery is working correctly.',
      adminId,
      createdAt: new Date(),
      actionUrl: '/dashboard'
    };

    await emailNotificationService.sendNotificationEmail(email, mockNotification);
    
    res.json({
      success: true,
      message: 'Test alert email sent successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

// Test daily digest
router.post('/test-daily-digest', authenticateJwt, async (req, res) => {
  try {
    const { id: adminId } = req.user;
    
    const success = await emailCronService.triggerDailyDigest(adminId);
    
    res.json({
      success,
      message: success ? 'Daily digest sent successfully' : 'Failed to send daily digest'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send daily digest',
      error: error.message
    });
  }
});

// Test weekly report
router.post('/test-weekly-report', authenticateJwt, async (req, res) => {
  try {
    const { id: adminId } = req.user;
    
    const success = await emailCronService.triggerWeeklyReport(adminId);
    
    res.json({
      success,
      message: success ? 'Weekly report sent successfully' : 'Failed to send weekly report'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send weekly report',
      error: error.message
    });
  }
});

module.exports = router;