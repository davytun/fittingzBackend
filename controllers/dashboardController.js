const { PrismaClient } = require("@prisma/client");
const cache = require("../utils/cache");
const prisma = new PrismaClient();

class DashboardController {
  async getBatchData(req, res, next) {
    const adminId = req.user.id;
    const { entities = 'clients,orders,projects,events,gallery' } = req.query;
    const cacheKey = `batch:${adminId}:${entities}`;

    try {
      const cached = await cache.get(cacheKey);
      if (cached) return res.json(cached);

      const list = entities.split(',');
      const queries = {};
      
      if (list.includes('clients')) queries.clients = prisma.client.findMany({ where: { adminId }, take: 50, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, email: true, phone: true, createdAt: true } });
      if (list.includes('orders')) queries.orders = prisma.order.findMany({ where: { adminId }, take: 50, orderBy: { createdAt: 'desc' }, include: { client: { select: { name: true } } } });
      if (list.includes('projects')) queries.projects = prisma.project.findMany({ where: { adminId }, take: 50, orderBy: { createdAt: 'desc' } });
      if (list.includes('events')) queries.events = prisma.event.findMany({ where: { adminId }, take: 50, orderBy: { createdAt: 'desc' } });
      if (list.includes('gallery')) queries.gallery = prisma.styleImage.findMany({ where: { adminId }, take: 50, orderBy: { createdAt: 'desc' } });

      // Add summary data
      const [summaryData, recentClients, recentOrders, orderStats, recentUpdates] = await Promise.all([
        this.getSummaryData(adminId),
        this.getRecentClientsData(adminId),
        this.getRecentOrdersData(adminId),
        this.getOrderStatsData(adminId),
        this.getRecentUpdatesData(adminId)
      ]);

      const result = {};
      await Promise.all(Object.entries(queries).map(async ([key, query]) => {
        result[key] = await query;
      }));

      // Add the additional data you requested
      result.summary = summaryData;
      result.recentClients = recentClients;
      result.recentOrders = recentOrders;
      result.orderStats = orderStats;
      result.recentUpdates = recentUpdates;

      await cache.set(cacheKey, result, 300);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }



  async getSummaryData(adminId) {
    const [totalClients, totalOrders, totalRevenue] = await Promise.all([
      prisma.client.count({ where: { adminId } }),
      prisma.order.count({ where: { adminId } }),
      prisma.order.aggregate({ where: { adminId }, _sum: { price: true } })
    ]);
    return {
      totalClients,
      totalOrders,
      totalRevenue: Number(totalRevenue._sum.price || 0)
    };
  }

  async getRecentClientsData(adminId) {
    return prisma.client.findMany({
      where: { adminId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        measurements: { select: { id: true, fields: true, createdAt: true, updatedAt: true } },
        styleImages: { select: { id: true, imageUrl: true, publicId: true, category: true, description: true, createdAt: true, updatedAt: true } },
        _count: { select: { measurements: true, styleImages: true } }
      }
    });
  }

  async getRecentOrdersData(adminId) {
    const orders = await prisma.order.findMany({
      where: { adminId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { id: true, name: true } },
        payments: { select: { id: true, amount: true, paymentDate: true, notes: true } },
        styleImages: { include: { styleImage: { select: { id: true, imageUrl: true, description: true } } } },
        project: { select: { name: true } },
        event: { select: { name: true } },
        measurements: { select: { id: true, name: true, fields: true }, take: 1 }
      }
    });

    return orders.map(order => {
      const totalPaid = order.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const outstandingBalance = Number(order.price) - totalPaid;
      return {
        ...order,
        price: Number(order.price),
        deposit: Number(order.deposit || 0),
        totalPaid,
        outstandingBalance,
        outstandingAmount: outstandingBalance,
        measurement: order.measurements[0] || null
      };
    });
  }

  async getOrderStatsData(adminId) {
    return prisma.order.groupBy({
      by: ['status'],
      where: { adminId },
      _count: { _all: true },
      _sum: { price: true }
    }).then(stats => stats.map(stat => ({
      status: stat.status,
      _count: { _all: stat._count._all },
      _sum: { price: Number(stat._sum.price || 0) }
    })));
  }

  async getRecentUpdatesData(adminId) {
    return prisma.recentUpdate.findMany({
      where: { adminId },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });
  }

  async getStats(req, res, next) {
    const adminId = req.user.id;
    const cacheKey = `stats:${adminId}`;

    try {
      const cached = await cache.get(cacheKey);
      if (cached) return res.json(cached);

      const [clients, orders, projects, events, gallery, pending] = await Promise.all([
        prisma.client.count({ where: { adminId } }),
        prisma.order.count({ where: { adminId } }),
        prisma.project.count({ where: { adminId } }),
        prisma.event.count({ where: { adminId } }),
        prisma.styleImage.count({ where: { adminId } }),
        prisma.order.count({ where: { adminId, status: "PENDING_PAYMENT" } })
      ]);

      const stats = { clients, orders, projects, events, gallery, pending };
      await cache.set(cacheKey, stats, 180);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async getClientDetails(req, res, next) {
    const adminId = req.user.id;
    const { clientId } = req.params;
    const cacheKey = `client-details:${adminId}:${clientId}`;

    try {
      const cached = await cache.get(cacheKey);
      if (cached) return res.json(cached);

      const [client, orders, measurements, styleImages] = await Promise.all([
        prisma.client.findUnique({
          where: { id: clientId, adminId }
        }),
        prisma.order.findMany({
          where: { clientId, adminId },
          orderBy: { createdAt: 'desc' },
          include: { payments: true }
        }),
        prisma.measurement.findMany({
          where: { clientId },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.styleImage.findMany({
          where: { clientId },
          orderBy: { createdAt: 'desc' }
        })
      ]);

      if (!client) return res.status(404).json({ error: 'Client not found' });

      const result = { client, orders, measurements, styleImages };
      await cache.set(cacheKey, result, 300);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();