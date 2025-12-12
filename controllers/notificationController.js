const notificationService = require('../services/notificationService');
const ApiResponse = require('../utils/response');

const getNotifications = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { page, limit, unreadOnly, type } = req.query;
    
    const result = await notificationService.getNotifications(adminId, {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true',
      type
    });
    
    return ApiResponse.success(res, result, 'Notifications retrieved successfully');
  } catch (error) {
    return ApiResponse.error(res, 'Failed to retrieve notifications', 500);
  }
};

const markAsRead = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    
    const notification = await notificationService.markAsRead(adminId, id);
    
    return ApiResponse.success(res, notification, 'Notification marked as read');
  } catch (error) {
    if (error.message === 'Notification not found') {
      return ApiResponse.error(res, 'Notification not found', 404);
    }
    return ApiResponse.error(res, 'Failed to mark notification as read', 500);
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    const result = await notificationService.markAllAsRead(adminId);
    
    return ApiResponse.success(res, result, 'All notifications marked as read');
  } catch (error) {
    return ApiResponse.error(res, 'Failed to mark all notifications as read', 500);
  }
};

const deleteNotification = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    
    await notificationService.deleteNotification(adminId, id);
    
    return ApiResponse.success(res, null, 'Notification deleted successfully');
  } catch (error) {
    if (error.message === 'Notification not found') {
      return ApiResponse.error(res, 'Notification not found', 404);
    }
    return ApiResponse.error(res, 'Failed to delete notification', 500);
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    const count = await notificationService.getUnreadCount(adminId);
    
    return ApiResponse.success(res, { count }, 'Unread count retrieved successfully');
  } catch (error) {
    return ApiResponse.error(res, 'Failed to get unread count', 500);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
};