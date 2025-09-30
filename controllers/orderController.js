const { validationResult } = require("express-validator");
const { OrderStatus } = require("@prisma/client");
const OrderService = require("../services/orderService");

class OrderController {
  async createOrderForEvent(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ message: "Validation errors", errors: errors.array() });
    }

    try {
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

      const order = await OrderService.createOrderForEvent({
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
      });

      res
        .status(201)
        .json({ message: "Order created successfully for event", order });
    } catch (error) {
      if (
        error.message.includes("Event not found") ||
        error.message.includes("Client not found")
      ) {
        return res.status(404).json({ message: error.message });
      }
      if (
        error.message.includes("Forbidden") ||
        error.message.includes("Client is not part of this event")
      ) {
        return res.status(403).json({ message: error.message });
      }
      if (
        error.message.includes("Invalid price") ||
        error.message.includes("Invalid due date")
      ) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  }

  async createOrderForClient(req, res, next) {
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

    try {
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
      } = req.body;
      const adminId = req.user.id;

      const order = await OrderService.createOrderForClient({
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
      });

      res.status(201).json({ message: "Order created successfully", order });
    } catch (error) {
      if (
        error.message.includes("Client not found") ||
        error.message.includes("Project not found") ||
        error.message.includes("Event not found")
      ) {
        return res.status(404).json({ message: error.message });
      }
      if (
        error.message.includes("Forbidden") ||
        error.message.includes("Client is not associated with this event")
      ) {
        return res.status(403).json({ message: error.message });
      }
      if (
        error.message.includes("Invalid price") ||
        error.message.includes("Invalid due date")
      ) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  }

  async getAllOrdersForAdmin(req, res, next) {
    try {
      const adminId = req.user.id;
      const page = parseInt(req.query.page, 10) || 1;
      const pageSize = parseInt(req.query.pageSize, 10) || 10;

      const result = await OrderService.getAllOrdersForAdmin({
        adminId,
        page,
        pageSize,
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getOrdersByClientId(req, res, next) {
    try {
      const { clientId } = req.params;
      const adminId = req.user.id;
      const page = parseInt(req.query.page, 10) || 1;
      const pageSize = parseInt(req.query.pageSize, 10) || 10;

      const result = await OrderService.getOrdersByClientId({
        clientId,
        adminId,
        page,
        pageSize,
      });
      res.status(200).json(result);
    } catch (error) {
      if (error.message.includes("Client not found")) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes("Forbidden")) {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  }

  async getOrderById(req, res, next) {
    try {
      const { orderId } = req.params;
      const adminId = req.user.id;

      const order = await OrderService.getOrderById({ orderId, adminId });
      res.status(200).json(order);
    } catch (error) {
      if (error.message.includes("Order not found")) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes("Forbidden")) {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  }

  async updateOrderStatus(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation errors",
        errors: errors.array(),
        example: { status: "PROCESSING" },
      });
    }

    try {
      const { orderId } = req.params;
      const { status } = req.body;
      const adminId = req.user.id;

      const updatedOrder = await OrderService.updateOrderStatus({
        orderId,
        status,
        adminId,
      });
      res
        .status(200)
        .json({
          message: "Order status updated successfully",
          order: updatedOrder,
        });
    } catch (error) {
      if (error.message.includes("Order not found")) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes("Forbidden")) {
        return res.status(403).json({ message: error.message });
      }
      if (error.message.includes("Invalid order status")) {
        return res.status(400).json({
          message: error.message,
          validStatuses: Object.values(OrderStatus),
        });
      }
      next(error);
    }
  }

  async updateOrderDetails(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
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

      const updatedOrder = await OrderService.updateOrderDetails({
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
      });

      res.status(200).json(updatedOrder);
    } catch (error) {
      if (
        error.message.includes("Order not found") ||
        error.message.includes("Project not found")
      ) {
        return res.status(404).json({ message: error.message });
      }
      if (
        error.message.includes("Forbidden") ||
        error.message.includes("Cannot modify price or deposit")
      ) {
        return res.status(403).json({ message: error.message });
      }
      if (
        error.message.includes("Invalid price") ||
        error.message.includes("Invalid due date") ||
        error.message.includes("Deposit cannot exceed")
      ) {
        return res.status(400).json({ message: error.message });
      }
      next(error);
    }
  }

  async deleteOrder(req, res, next) {
    try {
      const { orderId } = req.params;
      const adminId = req.user.id;

      const result = await OrderService.deleteOrder({ orderId, adminId });
      res.status(200).json(result);
    } catch (error) {
      if (error.message.includes("Order not found")) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes("Forbidden")) {
        return res.status(403).json({ message: error.message });
      }
      if (error.code === "P2025") {
        return res
          .status(404)
          .json({ message: "Order not found or already deleted." });
      }
      next(error);
    }
  }
}

module.exports = new OrderController();
