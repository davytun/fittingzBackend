const { PrismaClient, OrderStatus } = require("@prisma/client");
const { validationResult } = require("express-validator");
const prisma = new PrismaClient();
const { getIO } = require("../socket");
const cache = require('../utils/cache');

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

// Create a new order for a specific event and client
exports.createOrderForEvent = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation errors",
      errors: errors.array(),
    });
  }

  const { eventId, clientId } = req.params;
  const { details, price, currency, dueDate, status, projectId, deposit, styleDescription, styleImageIds } = req.body;
  const adminId = req.user.id;

  try {
    // Validate price
    if (!validatePrice(price)) {
      return res.status(400).json({
        message: "Invalid price value",
        details: "Must be a number between -9,999,999.99 and 9,999,999.99",
      });
    }

    // Parse and validate dueDate
    let parsedDueDate = null;
    try {
      parsedDueDate = dueDate ? parseOrderDate(dueDate) : null;
    } catch (dateError) {
      return res.status(400).json({
        message: "Invalid due date",
        details: dateError.message,
      });
    }

    // Verify event exists and client is part of it
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { clients: { where: { clientId } } },
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (event.adminId !== adminId) {
      return res.status(403).json({ message: "Forbidden: Event does not belong to you" });
    }
    if (event.clients.length === 0) {
      return res.status(403).json({ message: "Client is not part of this event" });
    }

    // Generate unique order number
    const finalOrderNumber = await generateOrderNumber(adminId);

    // Create order tied to event
    const order = await prisma.order.create({
      data: {
        orderNumber: finalOrderNumber,
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
        data: styleImageIds.map(imageId => ({
          orderId: order.id,
          styleImageId: imageId,
        })),
      });
    }

    // Clear cache
    await cache.delPattern(`orders:admin:${adminId}:*`);
    await cache.delPattern(`orders:client:${clientId}:*`);

    res.status(201).json({
      message: "Order created successfully for event",
      order,
    });
    getIO().emit("order_created", order);
  } catch (error) {
    console.error("Event order creation error:", error);
    res.status(500).json({
      message: "Failed to create order for event",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Create a new order for a specific client
exports.createOrderForClient = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation errors",
      errors: errors.array(),
      example: {
        details: "Summer collection",
        price: 25000,
        currency: "NGN",
        dueDate: "2025-07-20",
        status: "PENDING_PAYMENT",
        projectId: "optional-project-id",
      },
    });
  }

  const { clientId } = req.params;
  const { details, price, currency, dueDate, status, projectId, eventId, deposit, styleDescription, styleImageIds } = req.body;
  const adminId = req.user.id;

  try {
    // Validate price
    if (!validatePrice(price)) {
      return res.status(400).json({
        message: "Invalid price value",
        details: "Must be a number between -9,999,999.99 and 9,999,999.99",
        received: price,
        type: typeof price,
      });
    }

    // Parse and validate dueDate
    let parsedDueDate = null;
    try {
      parsedDueDate = dueDate ? parseOrderDate(dueDate) : null;
    } catch (dateError) {
      return res.status(400).json({
        message: "Invalid due date",
        details: dateError.message,
        expectedFormat: "YYYY-MM-DD",
        example: "2025-07-20",
      });
    }

    // Verify client exists and belongs to the admin
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, adminId: true },
    });

    if (!client) {
      return res.status(404).json({
        message: "Client not found",
        clientId,
      });
    }
    if (client.adminId !== adminId) {
      return res.status(403).json({
        message: "Forbidden",
        details: "You do not have access to this client",
      });
    }

    // Verify project if provided
    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, adminId: true, clientId: true },
      });

      if (!project) {
        return res.status(404).json({
          message: "Project not found",
          projectId,
        });
      }
      if (project.adminId !== adminId || project.clientId !== clientId) {
        return res.status(403).json({
          message: "Forbidden",
          details: "Project does not belong to this client or admin",
        });
      }
    }

    // Verify event if provided
    if (eventId) {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, adminId: true, clients: { where: { clientId } } },
      });

      if (!event) {
        return res.status(404).json({
          message: "Event not found",
          eventId,
        });
      }
      if (event.adminId !== adminId) {
        return res.status(403).json({
          message: "Forbidden",
          details: "Event does not belong to this admin",
        });
      }
      if (event.clients.length === 0) {
        return res.status(403).json({
          message: "Forbidden",
          details: "Client is not associated with this event",
        });
      }
    }

    // Generate unique order number
    const finalOrderNumber = await generateOrderNumber(adminId);

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: finalOrderNumber,
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
        data: styleImageIds.map(imageId => ({
          orderId: order.id,
          styleImageId: imageId,
        })),
      });
    }

    // Clear cache
    await cache.delPattern(`orders:admin:${adminId}:*`);
    await cache.delPattern(`orders:client:${clientId}:*`);

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
    getIO().emit("order_created", order);
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({
      message: "Failed to create order",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get all orders for the authenticated admin
exports.getAllOrdersForAdmin = async (req, res, next) => {
  const adminId = req.user.id;
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const skip = (page - 1) * pageSize;
  const cacheKey = `orders:admin:${adminId}:${page}:${pageSize}`;

  try {
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const orders = await prisma.order.findMany({
      where: { adminId },
      include: {
        client: { select: { name: true, id: true } },
        project: { select: { name: true, id: true } },
        event: { select: { name: true, id: true } },
        styleImages: {
          include: {
            styleImage: true,
          },
        },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
      skip: skip,
      take: pageSize,
    });

    const totalOrders = await prisma.order.count({
      where: { adminId },
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
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Get all orders for a specific client
exports.getOrdersByClientId = async (req, res, next) => {
  const { clientId } = req.params;
  const adminId = req.user.id;
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const skip = (page - 1) * pageSize;
  const cacheKey = `orders:client:${clientId}:${page}:${pageSize}`;

  try {
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    if (client.adminId !== adminId) {
      return res.status(403).json({
        message: "Forbidden: You do not have access to this client's orders",
      });
    }

    const orders = await prisma.order.findMany({
      where: { clientId, adminId },
      include: {
        client: { select: { name: true, id: true } },
        project: { select: { name: true, id: true } },
        event: { select: { name: true, id: true } },
        styleImages: {
          include: {
            styleImage: true,
          },
        },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
      skip: skip,
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
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Get a single order by ID
exports.getOrderById = async (req, res, next) => {
  const { orderId } = req.params;
  const adminId = req.user.id;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: { select: { name: true, id: true } },
        project: { select: { name: true, id: true } },
        event: { select: { name: true, id: true } },
        styleImages: {
          include: {
            styleImage: true,
          },
        },
        payments: true,
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.adminId !== adminId) {
      return res
        .status(403)
        .json({ message: "Forbidden: You do not have access to this order" });
    }
    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
};

// Update order status
exports.updateOrderStatus = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation errors",
      errors: errors.array(),
      example: { status: "PROCESSING" },
    });
  }

  const { orderId } = req.params;
  const { status } = req.body;
  const adminId = req.user.id;

  if (!Object.values(OrderStatus).includes(status)) {
    return res.status(400).json({
      message: "Invalid order status",
      validStatuses: Object.values(OrderStatus),
      received: status,
    });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, adminId: true },
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
        orderId,
      });
    }

    if (order.adminId !== adminId) {
      return res.status(403).json({
        message: "Forbidden",
        details: "You cannot update this order",
      });
    }

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

    res.status(200).json({
      message: "Order status updated successfully",
      order: updatedOrder,
    });
    getIO().emit("order_updated", updatedOrder);
  } catch (error) {
    console.error("Order status update error:", error);
    res.status(500).json({
      message: "Failed to update order status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Update order details
exports.updateOrderDetails = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { orderId } = req.params;
  const { details, price, currency, dueDate, projectId, eventId, deposit, styleDescription, styleImageIds } = req.body;
  const adminId = req.user.id;

  try {
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });
    if (!existingOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (existingOrder.adminId !== adminId) {
      return res.status(403).json({
        message: "Forbidden: You cannot update this order's details",
      });
    }



    // Prevent editing price and deposit if payments exist
    const hasPayments = existingOrder.payments.length > 0;
    if (hasPayments && (price !== undefined && price !== Number(existingOrder.price) || deposit !== undefined && deposit !== Number(existingOrder.deposit))) {
      return res.status(400).json({
        message: "Cannot modify price or deposit after payments have been made",
        details: {
          paymentsCount: existingOrder.payments.length,
          totalPaid: existingOrder.payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
        }
      });
    }

    // Validate price and deposit for orders without payments
    if (!hasPayments) {
      if (price !== undefined && !validatePrice(price)) {
        return res.status(400).json({
          message: "Invalid price value. Must be a number between -999,999.99 and 999,999.99"
        });
      }
      
      if (deposit !== undefined && deposit > 0) {
        const newPrice = price !== undefined ? Number(price) : Number(existingOrder.price);
        if (Number(deposit) > newPrice) {
          return res.status(400).json({
            message: "Deposit cannot exceed total price",
            details: {
              deposit: Number(deposit),
              totalPrice: newPrice
            }
          });
        }
      }
    }

    if (projectId && projectId !== existingOrder.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      if (
        project.adminId !== adminId ||
        project.clientId !== existingOrder.clientId
      ) {
        return res.status(403).json({
          message: "Forbidden: Project does not belong to this client or admin",
        });
      }
    }

    const safePrice =
      price !== undefined ? parseFloat(price.toFixed(2)) : undefined;

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        details: details || undefined,
        price: safePrice,
        currency: currency || undefined,
        dueDate: dueDate
          ? new Date(dueDate)
          : dueDate === null
            ? null
            : undefined,
        projectId:
          projectId !== undefined
            ? projectId === ""
              ? null
              : projectId
            : undefined,
        eventId:
          eventId !== undefined
            ? eventId === ""
              ? null
              : eventId
            : undefined,
        deposit: deposit !== undefined ? (deposit ? parseFloat(deposit.toFixed(2)) : null) : undefined,
        styleDescription: styleDescription !== undefined ? styleDescription : undefined,
      },
      include: {
        client: { select: { name: true } },
        project: { select: { name: true } },
        event: { select: { name: true } },
        styleImages: {
          include: {
            styleImage: true,
          },
        },
      },
    });

    // Update style images if provided
    if (styleImageIds !== undefined) {
      // Remove existing style images
      await prisma.orderStyleImage.deleteMany({
        where: { orderId },
      });
      
      // Add new style images
      if (styleImageIds.length > 0) {
        await prisma.orderStyleImage.createMany({
          data: styleImageIds.map(imageId => ({
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

    res.status(200).json(updatedOrder);
    getIO().emit("order_updated", updatedOrder);
  } catch (error) {
    next(error);
  }
};

// Delete an order by ID
exports.deleteOrder = async (req, res, next) => {
  const { orderId } = req.params;
  const adminId = req.user.id;

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.adminId !== adminId) {
      return res
        .status(403)
        .json({ message: "Forbidden: You cannot delete this order" });
    }

    await prisma.order.delete({ where: { id: orderId } });
    
    // Clear cache
    await cache.delPattern(`orders:admin:${adminId}:*`);
    await cache.delPattern(`orders:client:${order.clientId}:*`);
    await cache.del(`order:${orderId}`);
    
    res.status(200).json({ message: "Order deleted successfully" });
    getIO().emit("order_deleted", { id: orderId });
  } catch (error) {
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ message: "Order not found or already deleted." });
    }
    next(error);
  }
};
