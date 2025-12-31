const { validationResult } = require("express-validator");
const ClientService = require("../services/clientService");
const { trackActivity, ActivityTypes } = require('../utils/activityTracker');
const { notifyClientAdded } = require('../utils/notificationHelper');
const cache = require('../utils/cache');
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class ClientController {
  async createClient(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Client creation validation errors:', errors.array());
      console.log('Request body:', req.body);
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, phone, email, gender } = req.body;
      const adminId = req.user.id;
      const client = await ClientService.createClient({
        name,
        phone,
        email,
        gender,
        adminId,
      });
      
      await trackActivity(
        adminId,
        ActivityTypes.CLIENT_CREATED,
        `New client added: ${name}`,
        `Client ${name} has been successfully added to your system`,
        client.id,
        'Client'
      );
      
      await notifyClientAdded(adminId, name, client.id);
      
      res.status(201).json(client);
    } catch (error) {
      if (error.message === "Unauthorized. Admin ID not found.") {
        return res.status(401).json({ message: error.message });
      }
      if (error.code === "P2025") {
        return res
          .status(400)
          .json({ message: "Admin user not found for creating client." });
      }
      next(error);
    }
  }

  async getAllClients(req, res, next) {
    try {
      const adminId = req.user.id;
      const page = parseInt(req.query.page, 10) || 1;
      const pageSize = parseInt(req.query.pageSize, 10) || 10;
      const result = await ClientService.getAllClients({
        adminId,
        page,
        pageSize,
      });
      res.status(200).json(result);
    } catch (error) {
      if (error.message === "Unauthorized. Admin ID not found.") {
        return res.status(401).json({ message: error.message });
      }
      next(error);
    }
  }

  async getClientById(req, res, next) {
    const start = Date.now();
    try {
      const { id } = req.params;
      const adminId = req.user.id;
      const cacheKey = `client:${id}:${adminId}`;
      
      // Check cache first
      const cachedClient = await cache.get(cacheKey);
      if (cachedClient) {
        console.log(`getClientById took ${Date.now() - start} ms (cache hit)`);
        return res.status(200).json(cachedClient);
      }
      
      const client = await ClientService.getClientById({ id, adminId });
      
      // Cache for 10 minutes
      await cache.set(cacheKey, client, 600);
      
      console.log(`getClientById took ${Date.now() - start} ms`);
      res.status(200).json(client);
    } catch (error) {
      if (error.message === "Unauthorized. Admin ID not found.") {
        return res.status(401).json({ message: error.message });
      }
      if (error.message.includes("Client not found")) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes("Forbidden")) {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  }

  // Batch endpoint: Get all client details in one request
  async getClientDetails(req, res, next) {
    const start = Date.now();
    const { id } = req.params;
    const adminId = req.user.id;
    const cacheKey = `client_details:${id}:${adminId}`;

    try {
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        console.log(`getClientDetails took ${Date.now() - start} ms (cache hit)`);
        return res.status(200).json(cachedData);
      }

      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();

      // Verify client access
      const client = await prisma.client.findUnique({
        where: { id },
        select: { id: true, adminId: true }
      });

      if (!client || client.adminId !== adminId) {
        return res.status(404).json({ message: "Client not found" });
      }

      // Fetch all data in parallel
      const [clientInfo, measurements, orders, styleImages] = await Promise.all([
        prisma.client.findUnique({ where: { id } }),
        prisma.measurement.findMany({ where: { clientId: id }, orderBy: { createdAt: "desc" }, take: 10 }),
        prisma.order.findMany({
          where: { clientId: id, adminId },
          include: { project: { select: { name: true } }, payments: true },
          orderBy: { createdAt: "desc" },
          take: 10
        }),
        prisma.styleImage.findMany({ where: { clientId: id, adminId }, orderBy: { createdAt: "desc" }, take: 20 })
      ]);

      const result = {
        client: clientInfo,
        measurements,
        orders: orders.map(order => ({
          ...order,
          totalPaid: order.payments.reduce((sum, p) => sum + Number(p.amount), 0),
          outstandingBalance: Number(order.price) - order.payments.reduce((sum, p) => sum + Number(p.amount), 0)
        })),
        styleImages,
        summary: {
          totalMeasurements: measurements.length,
          totalOrders: orders.length,
          totalStyleImages: styleImages.length
        }
      };

      await cache.set(cacheKey, result, 300);
      console.log(`getClientDetails took ${Date.now() - start} ms`);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateClient(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const {
        name,
        phone,
        email,
        gender,
        favoriteColors,
        dislikedColors,
        preferredStyles,
        bodyShape,
        additionalDetails,
      } = req.body;
      const adminId = req.user.id;
      const updatedClient = await ClientService.updateClient({
        id,
        adminId,
        name,
        phone,
        email,
        gender,
        favoriteColors,
        dislikedColors,
        preferredStyles,
        bodyShape,
        additionalDetails,
      });
      
      // Clear related caches
      await cache.delPattern(`client:${id}:*`);
      await cache.delPattern(`client_details:${id}:*`);
      await cache.delPattern(`dashboard:${adminId}`);
      
      res.status(200).json(updatedClient);
    } catch (error) {
      if (error.message === "Unauthorized. Admin ID not found.") {
        return res.status(401).json({ message: error.message });
      }
      if (error.message.includes("Client not found")) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes("Forbidden")) {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  }

  async deleteClient(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;
      const result = await ClientService.deleteClient({ id, adminId });
      res.status(200).json(result);
    } catch (error) {
      if (error.message === "Unauthorized. Admin ID not found.") {
        return res.status(401).json({ message: error.message });
      }
      if (error.message.includes("Client not found")) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes("Forbidden")) {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  }

  // Dashboard statistics
  async getDashboardStats(req, res, next) {
    const start = Date.now();
    const adminId = req.user.id;
    const cacheKey = `dashboard:${adminId}`;

    try {
      const cachedData = await cache.get(cacheKey);
      if (cachedData) {
        console.log(`getDashboardStats took ${Date.now() - start} ms (cache hit)`);
        return res.status(200).json(cachedData);
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [totalClients, totalOrders, totalStyleImages, newClientsThisMonth, recentUpdates, orderActivity] = await Promise.all([
        prisma.client.count({ where: { adminId } }),
        prisma.order.count({ where: { adminId } }),
        prisma.styleImage.count({ where: { adminId } }),
        prisma.client.count({ where: { adminId, createdAt: { gte: startOfMonth } } }),
        prisma.recentUpdate.findMany({ where: { adminId }, orderBy: { createdAt: "desc" }, take: 5 }),
        prisma.order.findMany({ 
          where: { adminId, createdAt: { gte: thirtyDaysAgo } },
          select: { createdAt: true },
          orderBy: { createdAt: "asc" }
        })
      ]);

      // Group orders by date for chart
      const chartData = {};
      orderActivity.forEach(order => {
        const date = order.createdAt.toISOString().split('T')[0];
        chartData[date] = (chartData[date] || 0) + 1;
      });

      const result = {
        totalClients,
        totalOrders,
        galleryImages: totalStyleImages,
        newClientsThisMonth,
        recentUpdates,
        orderActivity: {
          total: orderActivity.length,
          chartData
        }
      };

      await cache.set(cacheKey, result, 120);
      console.log(`getDashboardStats took ${Date.now() - start} ms`);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ClientController();
