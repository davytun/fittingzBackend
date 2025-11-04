const { PrismaClient } = require("@prisma/client");
const cache = require("../utils/cache");
const { getIO } = require("../socket");

const prisma = new PrismaClient();

class ClientService {
  async createClient({ name, phone, email, gender, adminId }) {
    if (!adminId) {
      throw new Error("Unauthorized. Admin ID not found.");
    }

    const client = await prisma.client.create({
      data: {
        name,
        phone,
        email,
        gender,
        admin: { connect: { id: adminId } },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        gender: true,
        adminId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Clear cache
    await cache.delPattern(`clients:${adminId}:*`);

    // Emit Socket.IO event
    getIO().emit("client_created", client);

    return client;
  }

  async getAllClients({ adminId, page = 1, pageSize = 10 }) {
    if (!adminId) {
      throw new Error("Unauthorized. Admin ID not found.");
    }

    const skip = (page - 1) * pageSize;
    const cacheKey = `clients:${adminId}:${page}:${pageSize}`;

    // Check cache
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const clients = await prisma.client.findMany({
      where: { adminId },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        gender: true,
        adminId: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { measurements: true, styleImages: true },
        },
      },
    });

    const totalClients = await prisma.client.count({
      where: { adminId },
    });

    const result = {
      data: clients,
      pagination: {
        page,
        pageSize,
        total: totalClients,
        totalPages: Math.ceil(totalClients / pageSize),
      },
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, result, 300);

    return result;
  }

  async getClientById({ id, adminId }) {
    if (!adminId) {
      throw new Error("Unauthorized. Admin ID not found.");
    }

    const client = await prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        gender: true,
        adminId: true,
        createdAt: true,
        updatedAt: true,
        measurements: {
          select: {
            id: true,
            fields: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        styleImages: {
          select: {
            id: true,
            imageUrl: true,
            publicId: true,
            category: true,
            description: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!client) {
      throw new Error("Client not found");
    }

    if (client.adminId !== adminId) {
      throw new Error("Forbidden: You do not have access to this client");
    }

    return client;
  }

  async updateClient({
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
  }) {
    if (!adminId) {
      throw new Error("Unauthorized. Admin ID not found.");
    }

    const existingClient = await prisma.client.findUnique({ where: { id } });
    if (!existingClient) {
      throw new Error("Client not found");
    }

    if (existingClient.adminId !== adminId) {
      throw new Error("Forbidden: You cannot update this client");
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        phone: phone !== undefined ? phone : undefined,
        email: email !== undefined ? email : undefined,
        gender: gender !== undefined ? gender : undefined,
        favoriteColors:
          favoriteColors !== undefined ? favoriteColors : undefined,
        dislikedColors:
          dislikedColors !== undefined ? dislikedColors : undefined,
        preferredStyles:
          preferredStyles !== undefined ? preferredStyles : undefined,
        bodyShape: bodyShape !== undefined ? bodyShape : undefined,
        additionalDetails:
          additionalDetails !== undefined ? additionalDetails : undefined,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        gender: true,
        adminId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Clear cache
    await cache.delPattern(`clients:${adminId}:*`);
    await cache.del(`client:${id}`);

    // Emit Socket.IO event
    getIO().emit("client_updated", updatedClient);

    return updatedClient;
  }

  async deleteClient({ id, adminId }) {
    if (!adminId) {
      throw new Error("Unauthorized. Admin ID not found.");
    }

    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) {
      throw new Error("Client not found");
    }

    if (client.adminId !== adminId) {
      throw new Error("Forbidden: You cannot delete this client");
    }

    await prisma.client.delete({ where: { id } });

    // Clear cache
    await cache.delPattern(`clients:${adminId}:*`);
    await cache.del(`client:${id}`);

    // Emit Socket.IO event
    getIO().emit("client_deleted", { id });

    return { message: "Client deleted successfully" };
  }
}

module.exports = new ClientService();
