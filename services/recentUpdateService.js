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
}

module.exports = new RecentUpdateService();