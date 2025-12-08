const recentUpdateService = require('../services/recentUpdateService');

const trackActivity = async (adminId, type, title, description, entityId, entityType) => {
  try {
    await recentUpdateService.createUpdate(adminId, type, title, description, entityId, entityType);
  } catch (error) {
    console.error('Failed to track activity:', error);
  }
};

const ActivityTypes = {
  CLIENT_CREATED: 'CLIENT_CREATED',
  ORDER_CREATED: 'ORDER_CREATED',
  ORDER_STATUS_CHANGED: 'ORDER_STATUS_CHANGED',
  PROJECT_CREATED: 'PROJECT_CREATED',
  PROJECT_STATUS_CHANGED: 'PROJECT_STATUS_CHANGED',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  EVENT_CREATED: 'EVENT_CREATED',
  MEASUREMENT_ADDED: 'MEASUREMENT_ADDED'
};

module.exports = {
  trackActivity,
  ActivityTypes
};