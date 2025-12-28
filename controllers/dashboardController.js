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

      const result = {};
      await Promise.all(Object.entries(queries).map(async ([key, query]) => {
        result[key] = await query;
      }));

      await cache.set(cacheKey, result, 300);
      res.json(result);
    } catch (error) {
      next(error);
    }
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