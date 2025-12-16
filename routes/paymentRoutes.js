const express = require("express");
const { body } = require("express-validator");
const paymentController = require("../controllers/paymentController");
const { authenticateJwt } = require("../middlewares/authMiddleware");

const router = express.Router();

// Get payments history
router.get("/history", authenticateJwt, paymentController.getPaymentsHistory);

// Create new payment
router.post("/new", authenticateJwt,
  body("orderId").notEmpty().withMessage("Order ID is required"),
  body("amount").isFloat({ min: 0.01 }).withMessage("Amount must be positive"),
  body("notes").optional().isString(),
  paymentController.createPayment
);

// Add payment to order
router.post(
  "/:clientId/orders/:orderId/payments",
  authenticateJwt,
  body("amount").isFloat({ min: 0.01 }).withMessage("Amount must be a positive number"),
  body("notes").optional().isString().withMessage("Notes must be a string"),
  paymentController.addPayment
);

// Get payments for order
router.get(
  "/:clientId/orders/:orderId/payments",
  authenticateJwt,
  paymentController.getOrderPayments
);

// Delete payment
router.delete(
  "/:clientId/orders/:orderId/payments/:paymentId",
  authenticateJwt,
  paymentController.deletePayment
);

module.exports = router;