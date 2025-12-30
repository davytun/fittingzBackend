const { PrismaClient } = require("@prisma/client");
const { getIO } = require("../socket");
const prisma = new PrismaClient();

class NotificationService {
  async createNotification(adminId, type, title, message, options = {}) {
    const notification = await prisma.notification.create({
      data: {
        adminId,
        type,
        title,
        message,
        priority: options.priority || "MEDIUM",
        entityId: options.entityId,
        entityType: options.entityType,
        actionUrl: options.actionUrl,
      },
    });

    // Emit real-time notification
    getIO().to(`admin_${adminId}`).emit("new_notification", notification);

    return notification;
  }

  async getNotifications(adminId, options = {}) {
    const { page = 1, limit = 20, unreadOnly = false, type } = options;
    const validPage = isNaN(page) ? 1 : Math.max(1, page);
    const validLimit = isNaN(limit) ? 20 : Math.max(1, Math.min(100, limit));
    const skip = (validPage - 1) * validLimit;

    const where = {
      adminId,
      ...(unreadOnly && { isRead: false }),
      ...(type && { type }),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          type: true,
          priority: true,
          title: true,
          message: true,
          isRead: true,
          entityId: true,
          entityType: true,
          actionUrl: true,
          createdAt: true,
          readAt: true,
        },
        skip,
        take: validLimit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { adminId, isRead: false },
      }),
    ]);

    return {
      notifications,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit),
      },
      unreadCount,
    };
  }

  async markAsRead(adminId, notificationId) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, adminId },
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    return await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(adminId) {
    return await prisma.notification.updateMany({
      where: { adminId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async deleteNotification(adminId, notificationId) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, adminId },
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    return await prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  async getUnreadCount(adminId) {
    return await prisma.notification.count({
      where: { adminId, isRead: false },
    });
  }

  async cleanupOldNotifications(adminId, daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    return await prisma.notification.deleteMany({
      where: {
        adminId,
        isRead: true,
        createdAt: { lt: cutoffDate },
      },
    });
  }
}

module.exports = new NotificationService();
