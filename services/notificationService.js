const { PrismaClient } = require('@prisma/client');
const { getIO } = require('../socket');
const notificationPreferenceService = require('./notificationPreferenceService');
const emailNotificationService = require('./emailNotificationService');
const prisma = new PrismaClient();

class NotificationService {
  async createNotification(adminId, type, title, message, options = {}) {
    // Check if admin wants this type of notification
    const shouldSend = await notificationPreferenceService.shouldSendNotification(adminId, type);
    if (!shouldSend) {
      return null;
    }

    const notification = await prisma.notification.create({
      data: {
        adminId,
        type,
        title,
        message,
        priority: options.priority || 'MEDIUM',
        entityId: options.entityId,
        entityType: options.entityType,
        actionUrl: options.actionUrl
      }
    });

    // Get updated unread count
    const unreadCount = await this.getUnreadCount(adminId);

    // Emit real-time notification with count
    getIO().to(`admin_${adminId}`).emit('new_notification', {
      notification,
      unreadCount
    });

    // Send email for critical notifications
    if (['HIGH', 'URGENT'].includes(notification.priority)) {
      const admin = await prisma.admin.findUnique({
        where: { id: adminId },
        select: { email: true }
      });
      
      if (admin) {
        await emailNotificationService.sendNotificationEmail(admin.email, notification);
      }
    }

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
      ...(type && { type })
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: validLimit
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { adminId, isRead: false }
      })
    ]);

    return {
      notifications,
      pagination: {
        page: validPage,
        limit: validLimit,
        total,
        totalPages: Math.ceil(total / validLimit)
      },
      unreadCount
    };
  }

  async markAsRead(adminId, notificationId) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, adminId }
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
  }

  async markAllAsRead(adminId) {
    return await prisma.notification.updateMany({
      where: { adminId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });
  }

  async deleteNotification(adminId, notificationId) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, adminId }
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return await prisma.notification.delete({
      where: { id: notificationId }
    });
  }

  async getUnreadCount(adminId) {
    return await prisma.notification.count({
      where: { adminId, isRead: false }
    });
  }

  async cleanupOldNotifications(adminId, daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    return await prisma.notification.deleteMany({
      where: {
        adminId,
        isRead: true,
        createdAt: { lt: cutoffDate }
      }
    });
  }

  // Business Intelligence Methods
  async generateBusinessNotifications(adminId, type = 'all') {
    if (type === 'weekly-summary') {
      return await this.generateWeeklySummary(adminId);
    }
    
    // Run all business checks
    await Promise.all([
      this.checkOverdueOrders(adminId),
      this.checkUpcomingDeadlines(adminId),
      this.checkOutstandingPayments(adminId),
      this.checkClientsWithoutMeasurements(adminId),
      this.checkOrdersWithoutMeasurements(adminId),
      this.checkInactiveClients(adminId),
      this.checkHighValueOrders(adminId),
      this.checkLongRunningProjects(adminId),
      this.checkRecentOrderTrends(adminId)
    ]);
  }

  async checkOverdueOrders(adminId) {
    const today = new Date();
    const overdueOrders = await prisma.order.count({
      where: {
        adminId,
        dueDate: { lt: today },
        status: { notIn: ['COMPLETED', 'CANCELLED', 'DELIVERED'] }
      }
    });

    if (overdueOrders > 0) {
      await this.createNotification(
        adminId,
        'REMINDER',
        `${overdueOrders} orders overdue`,
        `You have ${overdueOrders} orders past their due date`,
        { priority: 'HIGH', actionUrl: '/orders?filter=overdue' }
      );
    }
  }

  async checkUpcomingDeadlines(adminId) {
    const today = new Date();
    const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));
    
    const upcomingOrders = await prisma.order.count({
      where: {
        adminId,
        dueDate: { gte: today, lte: threeDaysFromNow },
        status: { notIn: ['COMPLETED', 'CANCELLED', 'DELIVERED'] }
      }
    });

    if (upcomingOrders > 0) {
      await this.createNotification(
        adminId,
        'REMINDER',
        `${upcomingOrders} orders due this week`,
        `You have ${upcomingOrders} orders due in the next 3 days`,
        { priority: 'MEDIUM', actionUrl: '/orders?filter=upcoming' }
      );
    }
  }

  async checkOutstandingPayments(adminId) {
    const ordersWithPayments = await prisma.order.findMany({
      where: { adminId },
      include: { payments: true }
    });

    let totalOutstanding = 0;
    let ordersWithBalance = 0;

    ordersWithPayments.forEach(order => {
      const totalPaid = order.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const balance = Number(order.price) - totalPaid;
      if (balance > 0) {
        totalOutstanding += balance;
        ordersWithBalance++;
      }
    });

    if (ordersWithBalance > 0) {
      await this.createNotification(
        adminId,
        'PAYMENT_RECEIVED',
        `₦${totalOutstanding.toLocaleString()} outstanding`,
        `${ordersWithBalance} orders have pending payments`,
        { priority: 'HIGH', actionUrl: '/orders?filter=pending-payment' }
      );
    }
  }

  async checkClientsWithoutMeasurements(adminId) {
    const count = await prisma.client.count({
      where: {
        adminId,
        measurements: { none: {} }
      }
    });

    if (count > 0) {
      await this.createNotification(
        adminId,
        'REMINDER',
        `${count} clients need measurements`,
        `${count} clients don't have any measurements recorded`,
        { priority: 'MEDIUM', actionUrl: '/clients?filter=no-measurements' }
      );
    }
  }

  async checkOrdersWithoutMeasurements(adminId) {
    const count = await prisma.order.count({
      where: {
        adminId,
        measurements: { none: {} },
        status: { notIn: ['COMPLETED', 'CANCELLED', 'DELIVERED'] }
      }
    });

    if (count > 0) {
      await this.createNotification(
        adminId,
        'REMINDER',
        `${count} orders missing measurements`,
        `${count} active orders don't have linked measurements`,
        { priority: 'MEDIUM', actionUrl: '/orders?filter=no-measurements' }
      );
    }
  }

  async checkInactiveClients(adminId) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const inactiveClients = await prisma.client.count({
      where: {
        adminId,
        orders: {
          none: {
            createdAt: { gte: thirtyDaysAgo }
          }
        },
        createdAt: { lt: thirtyDaysAgo }
      }
    });

    if (inactiveClients > 0) {
      await this.createNotification(
        adminId,
        'REMINDER',
        `${inactiveClients} inactive clients`,
        `${inactiveClients} clients haven't placed orders in 30+ days`,
        { priority: 'LOW', actionUrl: '/clients?filter=inactive' }
      );
    }
  }

  async checkHighValueOrders(adminId) {
    const highValueOrders = await prisma.order.count({
      where: {
        adminId,
        price: { gte: 100000 },
        status: { notIn: ['COMPLETED', 'CANCELLED', 'DELIVERED'] }
      }
    });

    if (highValueOrders > 0) {
      await this.createNotification(
        adminId,
        'ORDER_STATUS',
        `${highValueOrders} high-value orders active`,
        `You have ${highValueOrders} orders worth ₦100,000+ in progress`,
        { priority: 'HIGH', actionUrl: '/orders?filter=high-value' }
      );
    }
  }

  async checkLongRunningProjects(adminId) {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    
    const longProjects = await prisma.project.count({
      where: {
        adminId,
        createdAt: { lt: sixtyDaysAgo },
        status: { notIn: ['COMPLETED', 'CANCELLED'] }
      }
    });

    if (longProjects > 0) {
      await this.createNotification(
        adminId,
        'PROJECT_UPDATE',
        `${longProjects} long-running projects`,
        `${longProjects} projects have been active for 60+ days`,
        { priority: 'MEDIUM', actionUrl: '/projects?filter=long-running' }
      );
    }
  }

  async checkRecentOrderTrends(adminId) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    
    const [thisWeek, lastWeek] = await Promise.all([
      prisma.order.count({
        where: { adminId, createdAt: { gte: weekAgo } }
      }),
      prisma.order.count({
        where: { 
          adminId, 
          createdAt: { gte: twoWeeksAgo, lt: weekAgo }
        }
      })
    ]);

    if (lastWeek > 0) {
      const changePercent = ((thisWeek - lastWeek) / lastWeek * 100).toFixed(1);
      
      if (changePercent >= 50) {
        await this.createNotification(
          adminId,
          'SYSTEM_ALERT',
          'Order volume surge',
          `Orders increased by ${changePercent}% this week (${thisWeek} vs ${lastWeek})`,
          { priority: 'MEDIUM', actionUrl: '/dashboard' }
        );
      } else if (changePercent <= -30) {
        await this.createNotification(
          adminId,
          'SYSTEM_ALERT',
          'Order volume decline',
          `Orders decreased by ${Math.abs(changePercent)}% this week (${thisWeek} vs ${lastWeek})`,
          { priority: 'MEDIUM', actionUrl: '/dashboard' }
        );
      }
    }
  }

  async generateWeeklySummary(adminId) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const [weeklyOrders, weeklyRevenue, completedOrders] = await Promise.all([
      prisma.order.count({
        where: { adminId, createdAt: { gte: weekAgo } }
      }),
      prisma.payment.aggregate({
        where: { 
          order: { adminId },
          createdAt: { gte: weekAgo }
        },
        _sum: { amount: true }
      }),
      prisma.order.count({
        where: { 
          adminId, 
          status: 'COMPLETED',
          updatedAt: { gte: weekAgo }
        }
      })
    ]);

    const revenue = weeklyRevenue._sum.amount || 0;

    await this.createNotification(
      adminId,
      'SYSTEM_ALERT',
      'Weekly business summary',
      `This week: ${weeklyOrders} new orders, ${completedOrders} completed, ₦${Number(revenue).toLocaleString()} revenue`,
      { priority: 'LOW', actionUrl: '/dashboard' }
    );
  }
}

module.exports = new NotificationService();