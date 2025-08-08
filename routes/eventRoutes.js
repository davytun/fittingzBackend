const express = require("express");
const { body, param } = require("express-validator");
const eventController = require("../controllers/eventController");
const { authenticateJwt } = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authenticateJwt);

const validateEventInput = [
  body("name").trim().notEmpty().withMessage("Event name is required"),
  body("clientIds").isArray().withMessage("Client IDs must be an array"),
  body("eventDate").optional().isISO8601().withMessage("Invalid date format"),
];

const validateEventUpdate = [
  body("name").trim().notEmpty().withMessage("Event name is required"),
  body("clientIds").isArray({ min: 2 }).withMessage("At least 2 clients required for update"),
  body("eventDate").optional().isISO8601().withMessage("Invalid date format"),
];

const validateEventId = [
  param("id").isString().notEmpty().withMessage("Event ID required"),
];

router.post("/", validateEventInput, eventController.createEvent);
router.get("/", eventController.getAllEvents);
router.get("/:id", validateEventId, eventController.getEventById);
router.get("/:id/orders", validateEventId, eventController.getEventOrders);
router.put("/:id", validateEventId, validateEventUpdate, eventController.updateEvent);
router.delete("/:id", validateEventId, eventController.deleteEvent);

module.exports = router;