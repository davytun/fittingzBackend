const { PrismaClient, OrderStatus } = require("@prisma/client");
const { validationResult } = require("express-validator");
const prisma = new PrismaClient();
const { getIO } = require("../socket");
const cache = require("../utils/cache");
const { trackActivity, ActivityTypes } = require('../utils/activityTracker');
const { notifyOrderStatusChange } = require('../utils/notificationHelper');

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
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const random = Math.floor(Math.random() * 999) + 1;
  const orderNumber = `ORD${year}${month}${day}${random}`;

  const existingOrder = await prisma.order.findFirst({
    where: { orderNumber, adminId },
  });

  if (existingOrder) {
    return generateOrderNumber(adminId);
  }

  return orderNumber;
};

// Validate style image IDs
const validateStyleImageIds = async (styleImageIds, adminId) => {
  if (!styleImageIds || styleImageIds.length === 0) return true;
  const styleImages = await prisma.styleImage.findMany({
    where: {
      id: { in: styleImageIds },
      adminId,
    },
    select: { id: true },
  });
  const foundIds = styleImages.map((image) => image.id);
  const invalidIds = styleImageIds.filter((id) => !foundIds.includes(id));
  if (invalidIds.length > 0) {
    throw new Error(`Invalid style image IDs: ${invalidIds.join(", ")}`);
  }
  return true;
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
  const {
    details,
    price,
    currency,
    dueDate,
    status,
    projectId,
    deposit,
    styleDescription,
    styleImageIds,
  } = req.body;
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

    // Validate details as JSON
    if (details) {
      try {
        JSON.stringify(details);
      } catch (e) {
        return res.status(400).json({
          message: "Invalid details format",
          details: "Details must be a valid JSON object.",
        });
      }
    }

    // Validate styleImageIds
    try {
      await validateStyleImageIds(styleImageIds, adminId);
    } catch (error) {
      return res.status(400).json({
        message: "Invalid style image IDs",
        details: error.message,
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
      return res
        .status(403)
        .json({ message: "Forbidden: Event does not belong to you" });
    }
    if (event.clients.length === 0) {
      return res
        .status(403)
        .json({ message: "Client is not part of this event" });
    }

    // Generate unique order number
    const finalOrderNumber = await generateOrderNumber(adminId);

    // Create order tied to event
    const order = await prisma.order.create({
      data: {
        orderNumber: finalOrderNumber,
        details: details || null,
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

    // Clear cache in parallel
    await Promise.all([
      cache.delPattern(`orders:admin:${adminId}:*`),
      cache.delPattern(`orders:client:${clientId}:*`),
      cache.delPattern(`client_details:${clientId}:*`),
      cache.delPattern(`dashboard:${adminId}`)
    ]);

    await trackActivity(
      adminId,
      ActivityTypes.ORDER_CREATED,
      `New order created: ${order.orderNumber}`,
      `Order ${order.orderNumber} created for ${order.client.name} (Event: ${order.event.name})`,
      order.id,
      'Order'
    );

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
    });
  }

  const { clientId } = req.params;
  const {
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
    note,
    measurementId,
  } = req.body;
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

    // Validate details as JSON
    if (details) {
      try {
        JSON.stringify(details);
      } catch (e) {
        return res.status(400).json({
          message: "Invalid details format",
          details: "Details must be a valid JSON object.",
        });
      }
    }

    // Validate styleImageIds
    try {
      await validateStyleImageIds(styleImageIds, adminId);
    } catch (error) {
      return res.status(400).json({
        message: "Invalid style image IDs",
        details: error.message,
      });
    }

    // Verify client exists and belongs to the admin
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, adminId: true, name: true },
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

    // Verify measurement if provided
    if (measurementId) {
      const measurement = await prisma.measurement.findUnique({
        where: { id: measurementId },
        select: { id: true, clientId: true },
      });

      if (!measurement) {
        return res.status(404).json({
          message: "Measurement not found",
          measurementId,
        });
      }
      if (measurement.clientId !== clientId) {
        return res.status(403).json({
          message: "Forbidden",
          details: "Measurement does not belong to this client",
        });
      }
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
        details: details || null,
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
        note: note !== undefined ? note : undefined,
      },
      include: {
        client: { select: { name: true } },
        project: { select: { name: true } },
        event: { select: { name: true } },
        payments: true,
        measurements: true,
        styleImages: {
          include: {
            styleImage: true,
          },
        },
      },
    });

    // Parallel operations after order creation
    const operations = [];
    
    // Create initial payment if deposit is provided
    if (deposit && deposit > 0) {
      operations.push(
        prisma.payment.create({
          data: {
            orderId: order.id,
            amount: parseFloat(deposit.toFixed(2)),
            notes: "Initial deposit",
          },
        })
      );
    }

    // Link measurement if provided
    if (measurementId) {
      operations.push(
        prisma.measurement.update({
          where: { id: measurementId },
          data: { orderId: order.id },
        })
      );
    }

    // Link style images if provided
    if (styleImageIds && styleImageIds.length > 0) {
      operations.push(
        prisma.orderStyleImage.createMany({
          data: styleImageIds.map((imageId) => ({
            orderId: order.id,
            styleImageId: imageId,
          })),
        })
      );
    }

    // Execute all operations in parallel
    if (operations.length > 0) {
      await Promise.all(operations);
    }

    // Calculate outstanding balance
    const totalPaid = order.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const outstandingBalance = Number(order.price) - totalPaid;

    // Use the provided measurementId directly
    const linkedMeasurementId = measurementId || null;
    
    // Clear cache in parallel
    await Promise.all([
      cache.delPattern(`orders:admin:${adminId}:*`),
      cache.delPattern(`orders:client:${clientId}:*`),
      cache.delPattern(`client_details:${clientId}:*`),
      cache.delPattern(`dashboard:${adminId}`)
    ]);

    await trackActivity(
      adminId,
      ActivityTypes.ORDER_CREATED,
      `New order created: ${order.orderNumber}`,
      `Order ${order.orderNumber} created for ${order.client.name}`,
      order.id,
      'Order'
    );

    res.status(201).json({
      message: "Order created successfully",
      order: {
        ...order,
        measurementId: linkedMeasurementId,
        outstandingBalance,
        totalPaid,
      },
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
  const start = Date.now();
  const adminId = req.user.id;
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const skip = (page - 1) * pageSize;
  const cacheKey = `orders:admin:${adminId}:${page}:${pageSize}`;

  try {
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      console.log(
        `getAllOrdersForAdmin took ${Date.now() - start} ms (cache hit)`
      );
      return res.status(200).json(cachedData);
    }

    // Parallel database queries
    const [orders, totalOrders] = await Promise.all([
      prisma.order.findMany({
        where: { adminId },
        include: {
          client: { select: { name: true, id: true } },
          project: { select: { name: true, id: true } },
          event: { select: { name: true, id: true } },
          measurements: req.query.include === 'measurement' ? true : { select: { id: true } },
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
      }),
      prisma.order.count({
        where: { adminId },
      })
    ]);

    // Add measurementId to each order
    const ordersWithMeasurementId = orders.map(order => ({
      ...order,
      measurementId: order.measurements.length > 0 ? order.measurements[0].id : null,
      measurement: req.query.include === 'measurement' && order.measurements.length > 0 ? order.measurements[0] : undefined
    }));

    const result = {
      data: ordersWithMeasurementId,
      pagination: {
        page,
        pageSize,
        total: totalOrders,
        totalPages: Math.ceil(totalOrders / pageSize),
      },
    };

    await cache.set(cacheKey, result, 300);
    console.log(`getAllOrdersForAdmin took ${Date.now() - start} ms`);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Get all orders for a specific client
exports.getOrdersByClientId = async (req, res, next) => {
  const start = Date.now();
  const { clientId } = req.params;
  const adminId = req.user.id;
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const skip = (page - 1) * pageSize;
  const cacheKey = `orders:client:${clientId}:${page}:${pageSize}`;

  try {
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      console.log(
        `getOrdersByClientId took ${Date.now() - start} ms (cache hit)`
      );
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
        measurements: req.query.include === 'measurement' ? true : { select: { id: true } },
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

    // Calculate outstanding balance and add measurementId for each order
    const ordersWithBalance = orders.map(order => {
      const totalPaid = order.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const outstandingBalance = Number(order.price) - totalPaid;
      return {
        ...order,
        measurementId: order.measurements.length > 0 ? order.measurements[0].id : null,
        measurement: req.query.include === 'measurement' && order.measurements.length > 0 ? order.measurements[0] : undefined,
        totalPaid,
        outstandingBalance,
      };
    });

    const result = {
      data: ordersWithBalance,
      pagination: {
        page,
        pageSize,
        total: totalOrders,
        totalPages: Math.ceil(totalOrders / pageSize),
      },
    };

    await cache.set(cacheKey, result, 300);
    console.log(`getOrdersByClientId took ${Date.now() - start} ms`);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// Get a single order by ID
exports.getOrderById = async (req, res, next) => {
  const start = Date.now();
  const { orderId } = req.params;
  const adminId = req.user.id;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: { select: { name: true, id: true } },
        project: { select: { name: true, id: true } },
        event: { select: { name: true, id: true } },
        measurements: req.query.include === 'measurement' ? true : { select: { id: true } },
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
    // Add measurementId to response
    const orderWithMeasurementId = {
      ...order,
      measurementId: order.measurements.length > 0 ? order.measurements[0].id : null,
      measurement: req.query.include === 'measurement' && order.measurements.length > 0 ? order.measurements[0] : undefined,
      outstandingAmount: Number(order.price) - order.payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
    };

    console.log(`getOrderById took ${Date.now() - start} ms`);
    res.status(200).json(orderWithMeasurementId);
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
      select: { id: true, adminId: true, clientId: true },
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

    // Clear cache in parallel
    await Promise.all([
      cache.delPattern(`orders:admin:${adminId}:*`),
      cache.delPattern(`orders:client:${updatedOrder.clientId}:*`),
      cache.del(`order:${orderId}`)
    ]);

    await trackActivity(
      adminId,
      ActivityTypes.ORDER_STATUS_CHANGED,
      `Order status updated: ${updatedOrder.orderNumber}`,
      `Order ${updatedOrder.orderNumber} status changed to ${status}`,
      updatedOrder.id,
      'Order'
    );

    await notifyOrderStatusChange(adminId, updatedOrder.orderNumber, status, updatedOrder.id);

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
  const {
    details,
    price,
    currency,
    dueDate,
    projectId,
    eventId,
    deposit,
    styleDescription,
    styleImageIds,
  } = req.body;
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

    // Validate details as JSON
    if (details) {
      try {
        JSON.stringify(details);
      } catch (e) {
        return res.status(400).json({
          message: "Invalid details format",
          details: "Details must be a valid JSON object.",
        });
      }
    }

    // Validate styleImageIds
    try {
      await validateStyleImageIds(styleImageIds, adminId);
    } catch (error) {
      return res.status(400).json({
        message: "Invalid style image IDs",
        details: error.message,
      });
    }

    // Prevent editing price and deposit if payments exist
    const hasPayments = existingOrder.payments.length > 0;
    if (
      hasPayments &&
      ((price !== undefined && price !== Number(existingOrder.price)) ||
        (deposit !== undefined && deposit !== Number(existingOrder.deposit)))
    ) {
      return res.status(400).json({
        message: "Cannot modify price or deposit after payments have been made",
        details: {
          paymentsCount: existingOrder.payments.length,
          totalPaid: existingOrder.payments.reduce(
            (sum, payment) => sum + Number(payment.amount),
            0
          ),
        },
      });
    }

    // Validate price and deposit for orders without payments
    if (!hasPayments) {
      if (price !== undefined && !validatePrice(price)) {
        return res.status(400).json({
          message:
            "Invalid price value. Must be a number between -999,999.99 and 999,999.99",
        });
      }

      if (deposit !== undefined && deposit > 0) {
        const newPrice =
          price !== undefined ? Number(price) : Number(existingOrder.price);
        if (Number(deposit) > newPrice) {
          return res.status(400).json({
            message: "Deposit cannot exceed total price",
            details: {
              deposit: Number(deposit),
              totalPrice: newPrice,
            },
          });
        }
      }
    }

    // Validate project if provided
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

    // Validate event if provided
    if (eventId && eventId !== existingOrder.eventId) {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          adminId: true,
          clients: { where: { clientId: existingOrder.clientId } },
        },
      });
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      if (event.adminId !== adminId) {
        return res
          .status(403)
          .json({ message: "Forbidden: Event does not belong to this admin" });
      }
      if (event.clients.length === 0) {
        return res
          .status(403)
          .json({ message: "Client is not associated with this event" });
      }
    }

    const safePrice =
      price !== undefined ? parseFloat(price.toFixed(2)) : undefined;

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        details: details !== undefined ? details : undefined,
        price: safePrice,
        currency: currency || undefined,
        status: req.body.status !== undefined ? req.body.status : undefined,
        note: req.body.note !== undefined ? req.body.note : undefined,
        dueDate: dueDate
          ? parseOrderDate(dueDate)
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
        styleImages: {
          include: {
            styleImage: true,
          },
        },
      },
    });

    // Update style images if provided
    if (styleImageIds !== undefined) {
      await prisma.orderStyleImage.deleteMany({
        where: { orderId },
      });
      if (styleImageIds.length > 0) {
        await prisma.orderStyleImage.createMany({
          data: styleImageIds.map((imageId) => ({
            orderId,
            styleImageId: imageId,
          })),
        });
      }
    }

    // Clear cache in parallel
    await Promise.all([
      cache.delPattern(`orders:admin:${adminId}:*`),
      cache.delPattern(`orders:client:${updatedOrder.clientId}:*`),
      cache.del(`order:${orderId}`)
    ]);

    res.status(200).json(updatedOrder);
    getIO().emit("order_updated", updatedOrder);
  } catch (error) {
    console.error("Order update error:", error);
    res.status(500).json({
      message: "Failed to update order",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
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

    // Clear cache in parallel
    await Promise.all([
      cache.delPattern(`orders:admin:${adminId}:*`),
      cache.delPattern(`orders:client:${order.clientId}:*`),
      cache.del(`order:${orderId}`)
    ]);

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

// Link measurement to order
exports.linkMeasurementToOrder = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation errors",
      errors: errors.array(),
    });
  }

  const { orderId, clientId } = req.params;
  const { measurementId } = req.body;
  const adminId = req.user.id;

  try {
    // Verify order exists and belongs to admin
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, adminId: true, clientId: true, orderNumber: true },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.adminId !== adminId) {
      return res.status(403).json({
        message: "Forbidden: You cannot modify this order",
      });
    }

    if (order.clientId !== clientId) {
      return res.status(400).json({
        message: "Order does not belong to the specified client",
      });
    }

    // Verify measurement exists and belongs to the same client
    const measurement = await prisma.measurement.findUnique({
      where: { id: measurementId },
      select: { id: true, clientId: true, name: true },
    });

    if (!measurement) {
      return res.status(404).json({ message: "Measurement not found" });
    }

    if (measurement.clientId !== clientId) {
      return res.status(403).json({
        message: "Measurement does not belong to this client",
      });
    }

    // Update measurement to link it to the order
    await prisma.measurement.update({
      where: { id: measurementId },
      data: { orderId: orderId },
    });

    // Get updated order with measurement
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: { select: { name: true } },
        project: { select: { name: true } },
        event: { select: { name: true } },
        measurements: true,
        styleImages: {
          include: {
            styleImage: true,
          },
        },
        payments: true,
      },
    });

    // Clear cache in parallel
    await Promise.all([
      cache.delPattern(`orders:admin:${adminId}:*`),
      cache.delPattern(`orders:client:${clientId}:*`),
      cache.del(`order:${orderId}`)
    ]);

    await trackActivity(
      adminId,
      ActivityTypes.MEASUREMENT_ADDED,
      `Measurement linked to order: ${order.orderNumber}`,
      `Measurement "${measurement.name}" linked to order ${order.orderNumber}`,
      orderId,
      'Order'
    );

    res.status(200).json({
      message: "Measurement linked to order successfully",
      order: {
        ...updatedOrder,
        measurementId: measurementId,
      },
    });

    getIO().emit("order_updated", updatedOrder);
  } catch (error) {
    console.error("Link measurement error:", error);
    res.status(500).json({
      message: "Failed to link measurement to order",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
