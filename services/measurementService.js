const { PrismaClient } = require("@prisma/client");
const cache = require("../utils/cache");
const { getIO } = require("../socket");

const prisma = new PrismaClient();

class MeasurementService {
  async addOrUpdateMeasurement({ clientId, fields, adminId }) {
    if (!adminId) {
      throw new Error("Unauthorized. Admin ID not found.");
    }

    // Verify client exists and belongs to the admin
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, adminId: true, name: true },
    });
    if (!client) {
      throw new Error("Client not found");
    }
    if (client.adminId !== adminId) {
      throw new Error(
        "Forbidden: You do not have access to this client's measurements"
      );
    }

    // Upsert measurement
    const measurement = await prisma.measurement.upsert({
      where: { clientId },
      update: { fields: fields || {} },
      create: {
        clientId,
        fields: fields || {},
      },
      select: {
        id: true,
        clientId: true,
        fields: true,
        createdAt: true,
        updatedAt: true,
        client: { select: { name: true } },
      },
    });

    // Clear cache for client's measurements
    await cache.del(`measurement:${clientId}`);

    // Emit Socket.IO event
    getIO().emit("measurement_updated", measurement);

    return measurement;
  }

  async getMeasurementsByClientId({ clientId, adminId }) {
    if (!adminId) {
      throw new Error("Unauthorized. Admin ID not found.");
    }

    // Verify client exists and belongs to the admin
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, adminId: true, name: true },
    });
    if (!client) {
      throw new Error("Client not found");
    }
    if (client.adminId !== adminId) {
      throw new Error(
        "Forbidden: You do not have access to this client's measurements"
      );
    }

    const cacheKey = `measurement:${clientId}`;
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const measurement = await prisma.measurement.findUnique({
      where: { clientId },
      select: {
        id: true,
        clientId: true,
        fields: true,
        createdAt: true,
        updatedAt: true,
        client: { select: { name: true } },
      },
    });

    const result = measurement || {
      id: null,
      clientId,
      fields: {},
      createdAt: null,
      updatedAt: null,
      client: { name: client.name },
    };

    // Cache for 5 minutes
    await cache.set(cacheKey, result, 300);

    return result;
  }

  async deleteMeasurementsByClientId({ clientId, adminId }) {
    if (!adminId) {
      throw new Error("Unauthorized. Admin ID not found.");
    }

    // Verify client exists and belongs to the admin
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, adminId: true },
    });
    if (!client) {
      throw new Error("Client not found");
    }
    if (client.adminId !== adminId) {
      throw new Error(
        "Forbidden: You cannot delete measurements for this client."
      );
    }

    const existingMeasurement = await prisma.measurement.findUnique({
      where: { clientId },
      select: { id: true },
    });
    if (!existingMeasurement) {
      throw new Error("No measurements found for this client to delete.");
    }

    await prisma.measurement.delete({
      where: { clientId },
    });

    // Clear cache
    await cache.del(`measurement:${clientId}`);

    // Emit Socket.IO event
    getIO().emit("measurement_deleted", { clientId });

    return { message: "Measurements deleted successfully for client." };
  }
}

module.exports = new MeasurementService();
