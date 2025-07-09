const { PrismaClient, OrderStatus } = require('@prisma/client');
const { validationResult } = require('express-validator');
const prisma = new PrismaClient();

// Helper function to validate price
const validatePrice = (price) => {
  if (typeof price !== 'number' || isNaN(price)) {
    return false;
  }
  
  // Check if price is within NUMERIC(10,2) range
  const absPrice = Math.abs(price);
  return absPrice <= 999999.99;
};

// Create a new order for a specific client
exports.createOrderForClient = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { clientId } = req.params;
    const { orderNumber, details, price, currency, dueDate, status, projectId } = req.body;
    const adminId = req.user.id;

    try {
        // Validate price
        if (!validatePrice(price)) {
            return res.status(400).json({ 
                message: 'Invalid price value. Must be a number between -999,999.99 and 999,999.99'
            });
        }

        // Verify client exists and belongs to the admin
        const client = await prisma.client.findUnique({ where: { id: clientId } });
        if (!client) {
            return res.status(404).json({ message: 'Client not found' });
        }
        if (client.adminId !== adminId) {
            return res.status(403).json({ message: 'Forbidden: You do not have access to this client' });
        }

        // Optional: Verify project exists and belongs to the admin/client if projectId is provided
        if (projectId) {
            const project = await prisma.project.findUnique({ where: { id: projectId } });
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }
            if (project.adminId !== adminId || project.clientId !== clientId) {
                return res.status(403).json({ message: 'Forbidden: Project does not belong to this client or admin' });
            }
        }

        // Basic check for orderNumber uniqueness per admin
        if (orderNumber) {
            const existingOrder = await prisma.order.findFirst({
                where: { orderNumber, adminId }
            });
            if (existingOrder) {
                return res.status(400).json({ message: `Order number '${orderNumber}' already exists for this admin.` });
            }
        }

        // Convert price to fixed decimal to avoid floating point issues
        const safePrice = parseFloat(price.toFixed(2));

        const order = await prisma.order.create({
            data: {
                orderNumber: orderNumber || `ORD-${Date.now()}`,
                details,
                price: safePrice,
                currency: currency || 'NGN', // Default to NGN if not provided
                dueDate: dueDate ? new Date(dueDate) : null,
                status: status || OrderStatus.PENDING,
                clientId,
                adminId,
                projectId: projectId || null,
            },
            include: { 
                client: { select: { name: true } }, 
                project: { select: { name: true } } 
            }
        });
        
        res.status(201).json(order);
    } catch (error) {
        if (error.code === 'P2002' && error.meta?.target?.includes('orderNumber')) {
            return res.status(400).json({ message: `Order number '${orderNumber}' already exists.` });
        }
        next(error);
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
                project: { select: { name: true, id: true } }
            },
            orderBy: { createdAt: 'desc' },
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
            return res.status(404).json({ message: 'Client not found' });
        }
        if (client.adminId !== adminId) {
            return res.status(403).json({ message: 'Forbidden: You do not have access to this client\'s orders' });
        }

        const orders = await prisma.order.findMany({
            where: { clientId, adminId },
            include: { 
                client: { select: { name: true, id: true } },
                project: { select: { name: true, id: true } } 
            },
            orderBy: { createdAt: 'desc' },
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
                project: { select: { name: true, id: true } }
            },
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        if (order.adminId !== adminId) {
            return res.status(403).json({ message: 'Forbidden: You do not have access to this order' });
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
        return res.status(400).json({ errors: errors.array() });
    }

    const { orderId } = req.params;
    const { status } = req.body;
    const adminId = req.user.id;

    try {
        const existingOrder = await prisma.order.findUnique({ where: { id: orderId } });
        if (!existingOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }
        if (existingOrder.adminId !== adminId) {
            return res.status(403).json({ message: 'Forbidden: You cannot update this order\'s status' });
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: { status },
            include: { 
                client: { select: { name: true } },
                project: { select: { name: true } } 
            }
        });
        res.status(200).json(updatedOrder);
    } catch (error) {
        next(error);
    }
};

// Update order details (e.g., price, details, dueDate)
exports.updateOrderDetails = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { orderId } = req.params;
    const { orderNumber, details, price, currency, dueDate, projectId } = req.body;
    const adminId = req.user.id;

    try {
        const existingOrder = await prisma.order.findUnique({ where: { id: orderId } });
        if (!existingOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }
        if (existingOrder.adminId !== adminId) {
            return res.status(403).json({ message: 'Forbidden: You cannot update this order\'s details' });
        }

        // Validate price if it's being updated
        if (price !== undefined && !validatePrice(price)) {
            return res.status(400).json({ 
                message: 'Invalid price value. Must be a number between -999,999.99 and 999,999.99'
            });
        }

        // Optional: Verify project exists and belongs to the admin/client if projectId is provided and changing
        if (projectId && projectId !== existingOrder.projectId) {
            const project = await prisma.project.findUnique({ where: { id: projectId } });
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }
            if (project.adminId !== adminId || project.clientId !== existingOrder.clientId) {
                return res.status(403).json({ message: 'Forbidden: Project does not belong to this client or admin' });
            }
        }

        // Basic check for orderNumber uniqueness per admin if it's being changed
        if (orderNumber && orderNumber !== existingOrder.orderNumber) {
            const conflictingOrder = await prisma.order.findFirst({
                where: { orderNumber, adminId, NOT: { id: orderId } }
            });
            if (conflictingOrder) {
                return res.status(400).json({ message: `Order number '${orderNumber}' already exists for this admin.` });
            }
        }

        // Convert price to fixed decimal if updating
        const safePrice = price !== undefined ? parseFloat(price.toFixed(2)) : undefined;

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
                orderNumber: orderNumber || undefined,
                details: details || undefined,
                price: safePrice,
                currency: currency || undefined,
                dueDate: dueDate ? new Date(dueDate) : (dueDate === null ? null : undefined),
                projectId: projectId !== undefined ? (projectId === '' ? null : projectId) : undefined,
            },
            include: { 
                client: { select: { name: true } },
                project: { select: { name: true } } 
            }
        });
        res.status(200).json(updatedOrder);
    } catch (error) {
        if (error.code === 'P2002' && error.meta?.target?.includes('orderNumber')) {
            return res.status(400).json({ message: `Order number '${orderNumber}' already exists.` });
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
            return res.status(404).json({ message: 'Order not found' });
        }
        if (order.adminId !== adminId) {
            return res.status(403).json({ message: 'Forbidden: You cannot delete this order' });
        }

        await prisma.order.delete({ where: { id: orderId } });
        res.status(200).json({ message: 'Order deleted successfully' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ message: 'Order not found or already deleted.'});
        }
        next(error);
    }
};