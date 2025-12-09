const { PrismaClient } = require("@prisma/client");
const cache = require("../utils/cache");
const { getIO } = require("../socket");

const prisma = new PrismaClient();

class MeasurementService {
  async addMeasurement({ clientId, name, orderId, fields, isDefault = false, adminId }) {
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

    // If orderId is provided, verify order exists and belongs to the client
    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, clientId: true, adminId: true },
      });
      if (!order) {
        throw new Error("Order not found");
      }
      if (order.clientId !== clientId || order.adminId !== adminId) {
        throw new Error("Forbidden: Order does not belong to this client");
      }
    }

    // Check if there's already a default measurement for this client
    const hasDefault = await prisma.measurement.findFirst({
      where: { clientId, isDefault: true },
    });
    
    // If no default exists, make this one default
    const shouldBeDefault = !hasDefault || isDefault;
    
    // If setting as default, unset other default measurements for this client
    if (shouldBeDefault) {
      await prisma.measurement.updateMany({
        where: { clientId, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Create new measurement
    const measurement = await prisma.measurement.create({
      data: {
        clientId,
        name,
        orderId,
        fields: fields || {},
        isDefault: shouldBeDefault,
      },
      select: {
        id: true,
        name: true,
        clientId: true,
        orderId: true,
        fields: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
        client: { select: { name: true } },
        order: { select: { orderNumber: true } },
      },
    });

    // Clear cache for client's measurements
    await cache.del(`measurements:${clientId}`);

    // Emit Socket.IO event
    getIO().emit("measurement_created", measurement);

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

    const cacheKey = `measurements:${clientId}`;
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const measurements = await prisma.measurement.findMany({
      where: { clientId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        clientId: true,
        orderId: true,
        fields: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
        client: { select: { name: true } },
        order: { select: { orderNumber: true } },
      },
    });

    // Cache for 5 minutes
    await cache.set(cacheKey, measurements, 300);

    return measurements;
  }

  async updateMeasurement({ id, name, fields, isDefault, adminId }) {
    if (!adminId) {
      throw new Error("Unauthorized. Admin ID not found.");
    }

    // Verify measurement exists and belongs to the admin
    const existingMeasurement = await prisma.measurement.findUnique({
      where: { id },
      select: { id: true, clientId: true, client: { select: { adminId: true } } },
    });
    if (!existingMeasurement) {
      throw new Error("Measurement not found");
    }
    if (existingMeasurement.client.adminId !== adminId) {
      throw new Error(
        "Forbidden: You cannot update this measurement."
      );
    }

    // If setting as default, unset other default measurements for this client
    if (isDefault) {
      await prisma.measurement.updateMany({
        where: { clientId: existingMeasurement.clientId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const measurement = await prisma.measurement.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        fields: fields !== undefined ? fields : undefined,
        isDefault: isDefault !== undefined ? isDefault : undefined,
      },
      select: {
        id: true,
        name: true,
        clientId: true,
        orderId: true,
        fields: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
        client: { select: { name: true } },
        order: { select: { orderNumber: true } },
      },
    });

    // Clear cache
    await cache.del(`measurements:${measurement.clientId}`);

    // Emit Socket.IO event
    getIO().emit("measurement_updated", measurement);

    return measurement;
  }

  async getSingleMeasurement({ id, adminId }) {
    if (!adminId) {
      throw new Error("Unauthorized. Admin ID not found.");
    }

    const measurement = await prisma.measurement.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        clientId: true,
        orderId: true,
        fields: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
        client: {
          select: {
            id: true,
            name: true,
            adminId: true
          }
        },
        order: {
          select: {
            id: true,
            orderNumber: true
          }
        }
      }
    });

    if (!measurement) {
      throw new Error("Measurement not found");
    }

    if (measurement.client.adminId !== adminId) {
      throw new Error("Forbidden: You do not have access to this measurement");
    }

    return measurement;
  }

  async deleteMeasurement({ id, adminId }) {
    if (!adminId) {
      throw new Error("Unauthorized. Admin ID not found.");
    }

    // Verify measurement exists and belongs to the admin
    const measurement = await prisma.measurement.findUnique({
      where: { id },
      select: { id: true, clientId: true, client: { select: { adminId: true } } },
    });
    if (!measurement) {
      throw new Error("Measurement not found");
    }
    if (measurement.client.adminId !== adminId) {
      throw new Error(
        "Forbidden: You cannot delete this measurement."
      );
    }

    await prisma.measurement.delete({
      where: { id },
    });

    // Clear cache
    await cache.del(`measurements:${measurement.clientId}`);

    // Emit Socket.IO event
    getIO().emit("measurement_deleted", { id, clientId: measurement.clientId });

    return { message: "Measurement deleted successfully." };
  }


}

module.exports = new MeasurementService();