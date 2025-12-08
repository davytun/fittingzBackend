const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class RecentUpdateService {
  async createUpdate(adminId, type, title, description, entityId, entityType) {
    return await prisma.recentUpdate.create({
      data: {
        adminId,
        type,
        title,
        description,
        entityId,
        entityType
      }
    });
  }

  async getRecentUpdates(adminId, limit = 20) {
    return await prisma.recentUpdate.findMany({
      where: { adminId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  async cleanupOldUpdates(adminId, daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    return await prisma.recentUpdate.deleteMany({
      where: {
        adminId,
        createdAt: { lt: cutoffDate }
      }
    });
  }

  async getActivitySummary(adminId, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [activities, totalClients, totalOrders, totalGalleryStyles] = await Promise.all([
      prisma.recentUpdate.findMany({
        where: {
          adminId,
          createdAt: { gte: startDate }
        },
        select: {
          type: true,
          createdAt: true
        }
      }),
      prisma.client.count({ where: { adminId } }),
      prisma.order.count({ where: { adminId } }),
      prisma.styleImage.count({ where: { adminId } })
    ]);

    const summary = {
      totalActivities: activities.length,
      totalClients,
      totalOrders,
      totalGalleryStyles,
      byType: {},
      byDay: {},
      mostActiveDay: null,
      averagePerDay: 0
    };

    // Count by type
    activities.forEach(activity => {
      summary.byType[activity.type] = (summary.byType[activity.type] || 0) + 1;
    });

    // Count by day
    activities.forEach(activity => {
      const day = activity.createdAt.toISOString().split('T')[0];
      summary.byDay[day] = (summary.byDay[day] || 0) + 1;
    });

    // Find most active day
    let maxCount = 0;
    Object.entries(summary.byDay).forEach(([day, count]) => {
      if (count > maxCount) {
        maxCount = count;
        summary.mostActiveDay = { date: day, count };
      }
    });

    // Calculate average per day
    summary.averagePerDay = Math.round((summary.totalActivities / days) * 10) / 10;

    return summary;
  }
}

module.exports = new RecentUpdateService();