const { PrismaClient, OrderStatus } = require("@prisma/client");
const { validationResult } = require("express-validator");
const prisma = new PrismaClient();

// Enhanced price validation
const validatePrice = (price) => {
  // Handle string inputs that can be converted to numbers
  if (typeof price === "string") {
    price = parseFloat(price);
  }

  // Check if price is a valid number
  if (typeof price !== "number" || isNaN(price)) {
    return false;
  }

  // Check if price is within NUMERIC(10,2) range
  const absPrice = Math.abs(price);
  return absPrice <= 9999999.99; // Increased limit for Nigerian currency
};

// Improved date parsing
const parseOrderDate = (dateString) => {
  if (!dateString) return null;

  // Handle both Date objects and strings
  if (dateString instanceof Date) {
    return dateString;
  }

  // Validate format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    throw new Error(
      `Invalid date format. Expected YYYY-MM-DD but got ${dateString}`
    );
  }

  // Create date in UTC
  const date = new Date(`${dateString}T00:00:00Z`);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date components in ${dateString}`);
  }

  return date;
};

// Create a new order for a specific client
exports.createOrderForClient = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation errors",
      errors: errors.array(),
      example: {
        orderNumber: "ORD-123",
        details: "Summer collection",
        price: 25000,
        currency: "NGN",
        dueDate: "2025-07-20",
        projectId: "optional-project-id",
      },
    });
  }

  const { clientId } = req.params;
  const { orderNumber, details, price, currency, dueDate, status, projectId } =
    req.body;
  const adminId = req.user.id;

  try {
    // Enhanced price validation
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

    // Generate order number if not provided
    const finalOrderNumber = orderNumber || `ORD-${Date.now()}`;

    // Create order with proper data types
    const order = await prisma.order.create({
      data: {
        orderNumber: finalOrderNumber,
        details,
        price: parseFloat(price.toFixed(2)), // Ensure proper decimal format
        currency: currency || "NGN",
        dueDate: parsedDueDate,
        status: status || OrderStatus.PENDING_PAYMENT,
        clientId,
        adminId,
        projectId: projectId || null,
      },
      include: {
        client: { select: { name: true } },
        project: { select: { name: true } },
      },
    });

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("Order creation error:", error);

    if (error.code === "P2002" && error.meta?.target?.includes("orderNumber")) {
      return res.status(400).json({
        message: "Order number conflict",
        details: `Order number '${orderNumber}' already exists`,
        solution:
          "Provide a unique order number or leave blank to auto-generate",
      });
    }

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

  try {
    const orders = await prisma.order.findMany({
      where: { adminId },
      include: {
        client: { select: { name: true, id: true } },
        project: { select: { name: true, id: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: skip,
      take: pageSize,
    });

    const totalOrders = await prisma.order.count({
      where: { adminId },
    });

    res.status(200).json({
      data: orders,
      pagination: {
        page,
        pageSize,
        total: totalOrders,
        totalPages: Math.ceil(totalOrders / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get all orders for a specific client (owned by the authenticated admin)
exports.getOrdersByClientId = async (req, res, next) => {
  const { clientId } = req.params;
  const adminId = req.user.id;
  const page = parseInt(req.query.page, 10) || 1;
  const pageSize = parseInt(req.query.pageSize, 10) || 10;
  const skip = (page - 1) * pageSize;

  try {
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
      },
      orderBy: { createdAt: "desc" },
      skip: skip,
      take: pageSize,
    });

    const totalOrders = await prisma.order.count({
      where: { clientId, adminId },
    });

    res.status(200).json({
      data: orders,
      pagination: {
        page,
        pageSize,
        total: totalOrders,
        totalPages: Math.ceil(totalOrders / pageSize),
      },
    });
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
      example: {
        status: "PROCESSING",
      },
    });
  }

  const { orderId } = req.params;
  const { status } = req.body;
  const adminId = req.user.id;

  // Validate status is a valid OrderStatus
  if (!Object.values(OrderStatus).includes(status)) {
    return res.status(400).json({
      message: "Invalid order status",
      validStatuses: Object.values(OrderStatus),
      received: status,
    });
  }

  try {
    // Verify order exists and belongs to admin
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

    // Update status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        client: { select: { name: true } },
        project: { select: { name: true } },
      },
    });

    res.status(200).json({
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Order status update error:", error);
    res.status(500).json({
      message: "Failed to update order status",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Update order details (e.g., price, details, dueDate)
exports.updateOrderDetails = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { orderId } = req.params;
  const { orderNumber, details, price, currency, dueDate, projectId } =
    req.body;
  const adminId = req.user.id;

  try {
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!existingOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (existingOrder.adminId !== adminId) {
      return res
        .status(403)
        .json({ message: "Forbidden: You cannot update this order's details" });
    }

    // Validate price if it's being updated
    if (price !== undefined && !validatePrice(price)) {
      return res.status(400).json({
        message:
          "Invalid price value. Must be a number between -999,999.99 and 999,999.99",
      });
    }

    // Optional: Verify project exists and belongs to the admin/client if projectId is provided and changing
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

    // Basic check for orderNumber uniqueness per admin if it's being changed
    if (orderNumber && orderNumber !== existingOrder.orderNumber) {
      const conflictingOrder = await prisma.order.findFirst({
        where: { orderNumber, adminId, NOT: { id: orderId } },
      });
      if (conflictingOrder) {
        return res.status(400).json({
          message: `Order number '${orderNumber}' already exists for this admin.`,
        });
      }
    }

    // Convert price to fixed decimal if updating
    const safePrice =
      price !== undefined ? parseFloat(price.toFixed(2)) : undefined;

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        orderNumber: orderNumber || undefined,
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
      },
      include: {
        client: { select: { name: true } },
        project: { select: { name: true } },
      },
    });
    res.status(200).json(updatedOrder);
  } catch (error) {
    if (error.code === "P2002" && error.meta?.target?.includes("orderNumber")) {
      return res
        .status(400)
        .json({ message: `Order number '${orderNumber}' already exists.` });
    }
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
    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ message: "Order not found or already deleted." });
    }
    next(error);
  }
};
