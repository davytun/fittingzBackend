const { PrismaClient, OrderStatus } = require("@prisma/client");
const cache = require("../utils/cache");
const { getIO } = require("../socket");

const prisma = new PrismaClient();

// Enhanced price validation
const validatePrice = (price) => {
  if (typeof price === "string") {
    price = parseFloat(price);
  }
  if (typeof price !== "number" || isNaN(price)) {
    return false;
  }
  const absPrice = Math.abs(price);
  return absPrice <= 9999999.99;
};

// Improved date parsing
const parseOrderDate = (dateString) => {
  if (!dateString) return null;
  if (dateString instanceof Date) {
    return dateString;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    throw new Error(
      `Invalid date format. Expected YYYY-MM-DD but got ${dateString}`
    );
  }
  const date = new Date(`${dateString}T00:00:00Z`);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date components in ${dateString}`);
  }
  return date;
};

// Generate unique order number
const generateOrderNumber = async (adminId) => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  const orderNumber = `ORD-${timestamp}-${random}`;

  const existingOrder = await prisma.order.findFirst({
    where: { orderNumber, adminId },
  });

  if (existingOrder) {
    return generateOrderNumber(adminId);
  }

  return orderNumber;
};

class OrderService {
  async createOrderForEvent({
    eventId,
    clientId,
    details,
    price,
    currency,
    dueDate,
    status,
    projectId,
    deposit,
    styleDescription,
    styleImageIds,
    adminId,
  }) {
    if (!adminId) throw new Error("Unauthorized. Admin ID not found.");

    // Validate price
    if (!validatePrice(price)) {
      throw new Error(
        "Invalid price value. Must be a number between -9,999,999.99 and 9,999,999.99"
      );
    }

    // Parse and validate dueDate
    let parsedDueDate = null;
    try {
      parsedDueDate = parseOrderDate(dueDate);
    } catch (dateError) {
      throw new Error(`Invalid due date: ${dateError.message}`);
    }

    // Verify event exists and client is part of it
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { clients: { where: { clientId } } },
    });

    if (!event) throw new Error("Event not found");
    if (event.adminId !== adminId)
      throw new Error("Forbidden: Event does not belong to you");
    if (event.clients.length === 0)
      throw new Error("Client is not part of this event");

    // Generate unique order number
    const orderNumber = await generateOrderNumber(adminId);

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        details,
        price: parseFloat(price.toFixed(2)),
        currency: currency || "NGN",
        dueDate: parsedDueDate,
        status: status || OrderStatus.PENDING_PAYMENT,
        clientId,
        adminId,
        eventId,
        projectId: projectId || null,
        deposit: deposit ? parseFloat(deposit.toFixed(2)) : null,
        styleDescription: styleDescription || null,
      },
      include: {
        client: { select: { name: true } },
        project: { select: { name: true } },
        event: { select: { name: true } },
        payments: true,
      },
    });

    // Create initial payment if deposit is provided
    if (deposit && deposit > 0) {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: parseFloat(deposit.toFixed(2)),
          notes: "Initial deposit",
        },
      });
    }

    // Link style images if provided
    if (styleImageIds && styleImageIds.length > 0) {
      await prisma.orderStyleImage.createMany({
        data: styleImageIds.map((imageId) => ({
          orderId: order.id,
          styleImageId: imageId,
        })),
      });
    }

    // Clear cache
    await cache.delPattern(`orders:admin:${adminId}:*`);
    await cache.delPattern(`orders:client:${clientId}:*`);

    // Emit Socket.IO event
    getIO().emit("order_created", order);

    return order;
  }

  async createOrderForClient({
    clientId,
    details,
    price,
    currency,
    dueDate,
    status,
    projectId,
    eventId,
    deposit,
    styleDescription,
    styleImageIds,
    adminId,
  }) {
    if (!adminId) throw new Error("Unauthorized. Admin ID not found.");

    // Validate price
    if (!validatePrice(price)) {
      throw new Error(
        "Invalid price value. Must be a number between -9,999,999.99 and 9,999,999.99"
      );
    }

    // Parse and validate dueDate
    let parsedDueDate = null;
    try {
      parsedDueDate = parseOrderDate(dueDate);
    } catch (dateError) {
      throw new Error(`Invalid due date: ${dateError.message}`);
    }

    // Verify client exists and belongs to the admin
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, adminId: true },
    });
    if (!client) throw new Error("Client not found");
    if (client.adminId !== adminId)
      throw new Error("Forbidden: You do not have access to this client");

    // Verify project if provided
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, adminId: true, clientId: true },
      });
      if (!project) throw new Error("Project not found");
      if (project.adminId !== adminId || project.clientId !== clientId) {
        throw new Error(
          "Forbidden: Project does not belong to this client or admin"
        );
      }
    }

    // Verify event if provided
    if (eventId) {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, adminId: true, clients: { where: { clientId } } },
      });
      if (!event) throw new Error("Event not found");
      if (event.adminId !== adminId)
        throw new Error("Forbidden: Event does not belong to this admin");
      if (event.clients.length === 0)
        throw new Error("Client is not associated with this event");
    }

    // Generate unique order number
    const orderNumber = await generateOrderNumber(adminId);

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        details,
        price: parseFloat(price.toFixed(2)),
        currency: currency || "NGN",
        dueDate: parsedDueDate,
        status: status || OrderStatus.PENDING_PAYMENT,
        clientId,
        adminId,
        projectId: projectId || null,
        eventId: eventId || null,
        deposit: deposit ? parseFloat(deposit.toFixed(2)) : null,
        styleDescription: styleDescription || null,
      },
      include: {
        client: { select: { name: true } },
        project: { select: { name: true } },
        event: { select: { name: true } },
        payments: true,
      },
    });

    // Create initial payment if deposit is provided
    if (deposit && deposit > 0) {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amount: parseFloat(deposit.toFixed(2)),
          notes: "Initial deposit",
        },
      });
    }

    // Link style images if provided
    if (styleImageIds && styleImageIds.length > 0) {
      await prisma.orderStyleImage.createMany({
        data: styleImageIds.map((imageId) => ({
          orderId: order.id,
          styleImageId: imageId,
        })),
      });
    }

    // Clear cache
    await cache.delPattern(`orders:admin:${adminId}:*`);
    await cache.delPattern(`orders:client:${clientId}:*`);

    // Emit Socket.IO event
    getIO().emit("order_created", order);

    return order;
  }

  async getAllOrdersForAdmin({ adminId, page = 1, pageSize = 10 }) {
    if (!adminId) throw new Error("Unauthorized. Admin ID not found.");

    const skip = (page - 1) * pageSize;
    const cacheKey = `orders:admin:${adminId}:${page}:${pageSize}`;

    const cachedData = await cache.get(cacheKey);
    if (cachedData) return cachedData;

    const orders = await prisma.order.findMany({
      where: { adminId },
      include: {
        client: { select: { name: true, id: true } },
        project: { select: { name: true, id: true } },
        event: { select: { name: true, id: true } },
        styleImages: { include: { styleImage: true } },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    });

    const totalOrders = await prisma.order.count({ where: { adminId } });

    const result = {
      data: orders,
      pagination: {
        page,
        pageSize,
        total: totalOrders,
        totalPages: Math.ceil(totalOrders / pageSize),
      },
    };

    await cache.set(cacheKey, result, 300);
    return result;
  }

  async getOrdersByClientId({ clientId, adminId, page = 1, pageSize = 10 }) {
    if (!adminId) throw new Error("Unauthorized. Admin ID not found.");

    const skip = (page - 1) * pageSize;
    const cacheKey = `orders:client:${clientId}:${page}:${pageSize}`;

    const cachedData = await cache.get(cacheKey);
    if (cachedData) return cachedData;

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw new Error("Client not found");
    if (client.adminId !== adminId)
      throw new Error(
        "Forbidden: You do not have access to this client's orders"
      );

    const orders = await prisma.order.findMany({
      where: { clientId, adminId },
      include: {
        client: { select: { name: true, id: true } },
        project: { select: { name: true, id: true } },
        event: { select: { name: true, id: true } },
        styleImages: { include: { styleImage: true } },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    });

    const totalOrders = await prisma.order.count({
      where: { clientId, adminId },
    });

    const result = {
      data: orders,
      pagination: {
        page,
        pageSize,
        total: totalOrders,
        totalPages: Math.ceil(totalOrders / pageSize),
      },
    };

    await cache.set(cacheKey, result, 300);
    return result;
  }

  async getOrderById({ orderId, adminId }) {
    if (!adminId) throw new Error("Unauthorized. Admin ID not found.");

    const cacheKey = `order:${orderId}`;
    const cachedData = await cache.get(cacheKey);
    if (cachedData) return cachedData;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: { select: { name: true, id: true } },
        project: { select: { name: true, id: true } },
        event: { select: { name: true, id: true } },
        styleImages: { include: { styleImage: true } },
        payments: true,
      },
    });

    if (!order) throw new Error("Order not found");
    if (order.adminId !== adminId)
      throw new Error("Forbidden: You do not have access to this order");

    await cache.set(cacheKey, order, 300);
    return order;
  }

  async updateOrderStatus({ orderId, status, adminId }) {
    if (!adminId) throw new Error("Unauthorized. Admin ID not found.");
    if (!Object.values(OrderStatus).includes(status)) {
      throw new Error(
        `Invalid order status. Valid statuses: ${Object.values(OrderStatus).join(", ")}`
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, adminId: true, clientId: true },
    });
    if (!order) throw new Error("Order not found");
    if (order.adminId !== adminId)
      throw new Error("Forbidden: You cannot update this order");

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        client: { select: { name: true } },
        project: { select: { name: true } },
        event: { select: { name: true } },
      },
    });

    // Clear cache
    await cache.delPattern(`orders:admin:${adminId}:*`);
    await cache.delPattern(`orders:client:${updatedOrder.clientId}:*`);
    await cache.del(`order:${orderId}`);

    // Emit Socket.IO event
    getIO().emit("order_updated", updatedOrder);

    return updatedOrder;
  }

  async updateOrderDetails({
    orderId,
    details,
    price,
    currency,
    dueDate,
    projectId,
    eventId,
    deposit,
    styleDescription,
    styleImageIds,
    adminId,
  }) {
    if (!adminId) throw new Error("Unauthorized. Admin ID not found.");

    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });
    if (!existingOrder) throw new Error("Order not found");
    if (existingOrder.adminId !== adminId)
      throw new Error("Forbidden: You cannot update this order's details");

    // Prevent editing price and deposit if payments exist
    const hasPayments = existingOrder.payments.length > 0;
    if (
      hasPayments &&
      ((price !== undefined && price !== Number(existingOrder.price)) ||
        (deposit !== undefined && deposit !== Number(existingOrder.deposit)))
    ) {
      throw new Error(
        "Cannot modify price or deposit after payments have been made"
      );
    }

    // Validate price and deposit for orders without payments
    if (!hasPayments) {
      if (price !== undefined && !validatePrice(price)) {
        throw new Error(
          "Invalid price value. Must be a number between -999,999.99 and 999,999.99"
        );
      }
      if (deposit !== undefined && deposit > 0) {
        const newPrice =
          price !== undefined ? Number(price) : Number(existingOrder.price);
        if (Number(deposit) > newPrice) {
          throw new Error("Deposit cannot exceed total price");
        }
      }
    }

    // Verify project if provided
    if (projectId && projectId !== existingOrder.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project) throw new Error("Project not found");
      if (
        project.adminId !== adminId ||
        project.clientId !== existingOrder.clientId
      ) {
        throw new Error(
          "Forbidden: Project does not belong to this client or admin"
        );
      }
    }

    // Parse and validate dueDate
    let parsedDueDate = undefined;
    if (dueDate !== undefined) {
      try {
        parsedDueDate = dueDate ? parseOrderDate(dueDate) : null;
      } catch (dateError) {
        throw new Error(`Invalid due date: ${dateError.message}`);
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        details: details || undefined,
        price: price !== undefined ? parseFloat(price.toFixed(2)) : undefined,
        currency: currency || undefined,
        dueDate: parsedDueDate,
        projectId:
          projectId !== undefined
            ? projectId === ""
              ? null
              : projectId
            : undefined,
        eventId:
          eventId !== undefined ? (eventId === "" ? null : eventId) : undefined,
        deposit:
          deposit !== undefined
            ? deposit
              ? parseFloat(deposit.toFixed(2))
              : null
            : undefined,
        styleDescription:
          styleDescription !== undefined ? styleDescription : undefined,
      },
      include: {
        client: { select: { name: true } },
        project: { select: { name: true } },
        event: { select: { name: true } },
        styleImages: { include: { styleImage: true } },
      },
    });

    // Update style images if provided
    if (styleImageIds !== undefined) {
      await prisma.orderStyleImage.deleteMany({ where: { orderId } });
      if (styleImageIds.length > 0) {
        await prisma.orderStyleImage.createMany({
          data: styleImageIds.map((imageId) => ({
            orderId,
            styleImageId: imageId,
          })),
        });
      }
    }

    // Clear cache
    await cache.delPattern(`orders:admin:${adminId}:*`);
    await cache.delPattern(`orders:client:${updatedOrder.clientId}:*`);
    await cache.del(`order:${orderId}`);

    // Emit Socket.IO event
    getIO().emit("order_updated", updatedOrder);

    return updatedOrder;
  }

  async deleteOrder({ orderId, adminId }) {
    if (!adminId) throw new Error("Unauthorized. Admin ID not found.");

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new Error("Order not found");
    if (order.adminId !== adminId)
      throw new Error("Forbidden: You cannot delete this order");

    await prisma.order.delete({ where: { id: orderId } });

    // Clear cache
    await cache.delPattern(`orders:admin:${adminId}:*`);
    await cache.delPattern(`orders:client:${order.clientId}:*`);
    await cache.del(`order:${orderId}`);

    // Emit Socket.IO event
    getIO().emit("order_deleted", { id: orderId });

    return { message: "Order deleted successfully" };
  }
}

module.exports = new OrderService();
