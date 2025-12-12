const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const emailNotificationService = require('./emailNotificationService');

const prisma = new PrismaClient();

class EmailCronService {
  init() {
    // Daily digest at 8:00 AM
    cron.schedule('0 8 * * *', async () => {
      console.log('Running daily digest email job...');
      await this.sendDailyDigests();
    });

    // Weekly report on Mondays at 9:00 AM
    cron.schedule('0 9 * * 1', async () => {
      console.log('Running weekly report email job...');
      await this.sendWeeklyReports();
    });

    console.log('Email cron jobs initialized');
  }

  async sendDailyDigests() {
    try {
      const admins = await prisma.admin.findMany({
        where: { isEmailVerified: true },
        select: { id: true, email: true }
      });

      for (const admin of admins) {
        await emailNotificationService.sendDailyDigest(admin.email, admin.id);
      }

      console.log(`Daily digests sent to ${admins.length} admins`);
    } catch (error) {
      console.error('Failed to send daily digests:', error);
    }
  }

  async sendWeeklyReports() {
    try {
      const admins = await prisma.admin.findMany({
        where: { isEmailVerified: true },
        select: { id: true, email: true }
      });

      for (const admin of admins) {
        await emailNotificationService.sendWeeklyReport(admin.email, admin.id);
      }

      console.log(`Weekly reports sent to ${admins.length} admins`);
    } catch (error) {
      console.error('Failed to send weekly reports:', error);
    }
  }

  // Manual trigger methods for testing
  async triggerDailyDigest(adminId) {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { email: true }
    });

    if (admin) {
      await emailNotificationService.sendDailyDigest(admin.email, adminId);
      return true;
    }
    return false;
  }

  async triggerWeeklyReport(adminId) {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { email: true }
    });

    if (admin) {
      await emailNotificationService.sendWeeklyReport(admin.email, adminId);
      return true;
    }
    return false;
  }
}

module.exports = new EmailCronService();