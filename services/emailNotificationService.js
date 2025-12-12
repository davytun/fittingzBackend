const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');
const notificationPreferenceService = require('./notificationPreferenceService');

class EmailNotificationService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendNotificationEmail(adminEmail, notification) {
    try {
      const preferences = await notificationPreferenceService.getPreferences(notification.adminId);
      
      // Only send email for HIGH/URGENT priority if email notifications enabled
      if (!preferences.emailNotifications || !['HIGH', 'URGENT'].includes(notification.priority)) {
        return;
      }

      const templatePath = path.join(__dirname, '../templates/emails/notification-alert.ejs');
      const html = await ejs.renderFile(templatePath, {
        notification,
        businessName: 'Fittingz',
        actionUrl: `${process.env.FRONTEND_URL}${notification.actionUrl || '/dashboard'}`
      });

      await this.transporter.sendMail({
        from: `"Fittingz Notifications" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        subject: `🔔 ${notification.title}`,
        html
      });

    } catch (error) {
      console.error('Failed to send notification email:', error);
    }
  }

  async sendDailyDigest(adminEmail, adminId) {
    try {
      const preferences = await notificationPreferenceService.getPreferences(adminId);
      if (!preferences.emailNotifications) return;

      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      const [todayStats, unreadNotifications] = await Promise.all([
        this.getDailyStats(prisma, adminId, yesterday, today),
        prisma.notification.findMany({
          where: { adminId, isRead: false },
          orderBy: { createdAt: 'desc' },
          take: 5
        })
      ]);

      if (todayStats.totalActivity === 0 && unreadNotifications.length === 0) {
        return; // Skip empty digests
      }

      const templatePath = path.join(__dirname, '../templates/emails/daily-digest.ejs');
      const html = await ejs.renderFile(templatePath, {
        stats: todayStats,
        notifications: unreadNotifications,
        businessName: 'Fittingz',
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`
      });

      await this.transporter.sendMail({
        from: `"Fittingz Daily Digest" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        subject: `📊 Daily Business Summary - ${today.toLocaleDateString()}`,
        html
      });

    } catch (error) {
      console.error('Failed to send daily digest:', error);
    }
  }

  async sendWeeklyReport(adminEmail, adminId) {
    try {
      const preferences = await notificationPreferenceService.getPreferences(adminId);
      if (!preferences.emailNotifications || !preferences.weeklyReports) return;

      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const weeklyStats = await this.getWeeklyStats(prisma, adminId, weekAgo, today);

      const templatePath = path.join(__dirname, '../templates/emails/weekly-report.ejs');
      const html = await ejs.renderFile(templatePath, {
        stats: weeklyStats,
        businessName: 'Fittingz',
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
        weekStart: weekAgo.toLocaleDateString(),
        weekEnd: today.toLocaleDateString()
      });

      await this.transporter.sendMail({
        from: `"Fittingz Weekly Report" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        subject: `📈 Weekly Business Report - ${weekAgo.toLocaleDateString()} to ${today.toLocaleDateString()}`,
        html
      });

    } catch (error) {
      console.error('Failed to send weekly report:', error);
    }
  }

  async getDailyStats(prisma, adminId, startDate, endDate) {
    const [orders, payments, clients, activities] = await Promise.all([
      prisma.order.count({
        where: { adminId, createdAt: { gte: startDate, lt: endDate } }
      }),
      prisma.payment.aggregate({
        where: { 
          order: { adminId },
          createdAt: { gte: startDate, lt: endDate }
        },
        _sum: { amount: true },
        _count: true
      }),
      prisma.client.count({
        where: { adminId, createdAt: { gte: startDate, lt: endDate } }
      }),
      prisma.recentUpdate.count({
        where: { adminId, createdAt: { gte: startDate, lt: endDate } }
      })
    ]);

    return {
      newOrders: orders,
      newClients: clients,
      paymentsReceived: payments._count || 0,
      totalRevenue: Number(payments._sum.amount || 0),
      totalActivity: activities
    };
  }

  async getWeeklyStats(prisma, adminId, startDate, endDate) {
    const [orders, revenue, completedOrders, overdueOrders] = await Promise.all([
      prisma.order.count({
        where: { adminId, createdAt: { gte: startDate, lt: endDate } }
      }),
      prisma.payment.aggregate({
        where: { 
          order: { adminId },
          createdAt: { gte: startDate, lt: endDate }
        },
        _sum: { amount: true }
      }),
      prisma.order.count({
        where: { 
          adminId, 
          status: 'COMPLETED',
          updatedAt: { gte: startDate, lt: endDate }
        }
      }),
      prisma.order.count({
        where: {
          adminId,
          dueDate: { lt: new Date() },
          status: { notIn: ['COMPLETED', 'CANCELLED', 'DELIVERED'] }
        }
      })
    ]);

    return {
      newOrders: orders,
      totalRevenue: Number(revenue._sum.amount || 0),
      completedOrders,
      overdueOrders
    };
  }
}

module.exports = new EmailNotificationService();