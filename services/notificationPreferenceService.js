const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class NotificationPreferenceService {
  async getPreferences(adminId) {
    if (!adminId) {
      throw new Error('Admin ID is required');
    }
    
    let preferences = await prisma.notificationPreference.findUnique({
      where: { adminId }
    });

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await this.createDefaultPreferences(adminId);
    }

    return preferences;
  }

  async createDefaultPreferences(adminId) {
    return await prisma.notificationPreference.create({
      data: {
        adminId,
        emailNotifications: true,
        pushNotifications: true,
        orderStatusUpdates: true,
        paymentAlerts: true,
        clientReminders: true,
        systemAlerts: true,
        weeklyReports: true,
        highValueOrderThreshold: 75000,
        inactiveClientDays: 30,
        overdueOrderAlerts: true
      }
    });
  }

  async updatePreferences(adminId, updates) {
    return await prisma.notificationPreference.upsert({
      where: { adminId },
      update: updates,
      create: {
        adminId,
        ...updates
      }
    });
  }

  async shouldSendNotification(adminId, notificationType) {
    const preferences = await this.getPreferences(adminId);
    
    const typeMap = {
      'ORDER_STATUS': preferences.orderStatusUpdates,
      'PAYMENT_RECEIVED': preferences.paymentAlerts,
      'CLIENT_ADDED': preferences.clientReminders,
      'REMINDER': preferences.clientReminders,
      'SYSTEM_ALERT': preferences.systemAlerts,
      'PROJECT_UPDATE': preferences.systemAlerts
    };

    return typeMap[notificationType] !== false;
  }
}

module.exports = new NotificationPreferenceService();