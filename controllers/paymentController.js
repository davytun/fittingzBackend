const { PrismaClient } = require("@prisma/client");
const { validationResult } = require("express-validator");
const prisma = new PrismaClient();
const { getIO } = require("../socket");
const cache = require('../utils/cache');

// Add payment to an order
exports.addPayment = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation errors",
      errors: errors.array(),
    });
  }

  const { orderId } = req.params;
  const { amount, notes } = req.body;
  const adminId = req.user.id;

  try {
    // Verify order exists and belongs to admin
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payments: true,
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.adminId !== adminId) {
      return res.status(403).json({ message: "Forbidden: Order does not belong to you" });
    }

    // Calculate total paid so far
    const totalPaid = order.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const newTotal = totalPaid + Number(amount);

    // Check if payment exceeds remaining balance
    if (newTotal > Number(order.price)) {
      return res.status(400).json({
        message: "Payment amount exceeds remaining balance",
        details: {
          orderTotal: Number(order.price),
          totalPaid,
          remainingBalance: Number(order.price) - totalPaid,
          attemptedPayment: Number(amount),
        },
      });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        orderId,
        amount: parseFloat(amount.toFixed(2)),
        notes: notes || null,
      },
    });

    // Update order status if fully paid
    let updatedOrder = order;
    if (newTotal >= Number(order.price)) {
      updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: "PROCESSING" },
        include: {
          client: { select: { name: true } },
          project: { select: { name: true } },
          event: { select: { name: true } },
          payments: true,
        },
      });
    } else {
      updatedOrder = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          client: { select: { name: true } },
          project: { select: { name: true } },
          event: { select: { name: true } },
          payments: true,
        },
      });
    }

    // Clear cache
    await cache.delPattern(`orders:admin:${adminId}:*`);
    await cache.delPattern(`orders:client:${order.clientId}:*`);

    res.status(201).json({
      message: "Payment added successfully",
      payment,
      order: updatedOrder,
      paymentSummary: {
        totalPaid: newTotal,
        remainingBalance: Number(order.price) - newTotal,
        isFullyPaid: newTotal >= Number(order.price),
      },
    });

    getIO().emit("payment_added", { payment, orderId });
  } catch (error) {
    console.error("Payment creation error:", error);
    res.status(500).json({
      message: "Failed to add payment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get payments for an order
exports.getOrderPayments = async (req, res, next) => {
  const { orderId } = req.params;
  const adminId = req.user.id;

  try {
    // Verify order exists and belongs to admin
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, adminId: true, price: true },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.adminId !== adminId) {
      return res.status(403).json({ message: "Forbidden: Order does not belong to you" });
    }

    const payments = await prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
    });

    const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);

    res.status(200).json({
      payments,
      summary: {
        totalPaid,
        remainingBalance: Number(order.price) - totalPaid,
        isFullyPaid: totalPaid >= Number(order.price),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete a payment
exports.deletePayment = async (req, res, next) => {
  const { paymentId } = req.params;
  const adminId = req.user.id;

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: { select: { id: true, adminId: true, clientId: true } },
      },
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.order.adminId !== adminId) {
      return res.status(403).json({ message: "Forbidden: Payment does not belong to you" });
    }

    await prisma.payment.delete({ where: { id: paymentId } });

    // Clear cache
    await cache.delPattern(`orders:admin:${adminId}:*`);
    await cache.delPattern(`orders:client:${payment.order.clientId}:*`);

    res.status(200).json({ message: "Payment deleted successfully" });
    getIO().emit("payment_deleted", { paymentId, orderId: payment.orderId });
  } catch (error) {
    next(error);
  }
};