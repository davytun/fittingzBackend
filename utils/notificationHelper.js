const notificationService = require('../services/notificationService');

const NotificationTypes = {
  ORDER_STATUS: 'ORDER_STATUS',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  CLIENT_ADDED: 'CLIENT_ADDED',
  PROJECT_UPDATE: 'PROJECT_UPDATE',
  SYSTEM_ALERT: 'SYSTEM_ALERT',
  REMINDER: 'REMINDER'
};

const NotificationPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

const createNotification = async (adminId, type, title, message, options = {}) => {
  try {
    return await notificationService.createNotification(adminId, type, title, message, options);
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

// Helper functions for common notifications
const notifyOrderStatusChange = async (adminId, orderNumber, newStatus, orderId) => {
  return await createNotification(
    adminId,
    NotificationTypes.ORDER_STATUS,
    `Order Status Updated`,
    `Order ${orderNumber} status changed to ${newStatus}`,
    {
      priority: NotificationPriority.MEDIUM,
      entityId: orderId,
      entityType: 'Order',
      actionUrl: `/orders/${orderId}`
    }
  );
};

const notifyPaymentReceived = async (adminId, orderNumber, amount, paymentId) => {
  return await createNotification(
    adminId,
    NotificationTypes.PAYMENT_RECEIVED,
    `Payment Received`,
    `Payment of ${amount} received for order ${orderNumber}`,
    {
      priority: NotificationPriority.HIGH,
      entityId: paymentId,
      entityType: 'Payment',
      actionUrl: `/payments/${paymentId}`
    }
  );
};

const notifyClientAdded = async (adminId, clientName, clientId) => {
  return await createNotification(
    adminId,
    NotificationTypes.CLIENT_ADDED,
    `New Client Added`,
    `${clientName} has been added to your client list`,
    {
      priority: NotificationPriority.LOW,
      entityId: clientId,
      entityType: 'Client',
      actionUrl: `/clients/${clientId}`
    }
  );
};

const notifyProjectUpdate = async (adminId, projectName, status, projectId) => {
  return await createNotification(
    adminId,
    NotificationTypes.PROJECT_UPDATE,
    `Project Updated`,
    `Project "${projectName}" status changed to ${status}`,
    {
      priority: NotificationPriority.MEDIUM,
      entityId: projectId,
      entityType: 'Project',
      actionUrl: `/projects/${projectId}`
    }
  );
};

module.exports = {
  NotificationTypes,
  NotificationPriority,
  createNotification,
  notifyOrderStatusChange,
  notifyPaymentReceived,
  notifyClientAdded,
  notifyProjectUpdate
};