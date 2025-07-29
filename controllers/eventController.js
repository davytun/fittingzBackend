const { PrismaClient } = require("@prisma/client");
const { validationResult } = require("express-validator");
const { getIO } = require("../socket");

const prisma = new PrismaClient();

// Create event with clients
exports.createEvent = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, eventDate, location, clientIds } = req.body;
  const adminId = req.user.id;

  try {
    const event = await prisma.event.create({
      data: {
        name,
        description,
        eventDate: eventDate ? new Date(eventDate) : null,
        location,
        adminId,
        clients: {
          create: clientIds.map(clientId => ({ clientId }))
        }
      },
      include: {
        clients: {
          include: { client: true }
        }
      }
    });

    res.status(201).json(event);
    getIO().emit("event_created", event);
  } catch (error) {
    next(error);
  }
};

// Get all events for admin
exports.getAllEvents = async (req, res, next) => {
  const adminId = req.user.id;

  try {
    const events = await prisma.event.findMany({
      where: { adminId },
      include: {
        clients: {
          include: { client: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.status(200).json({ data: events });
  } catch (error) {
    next(error);
  }
};

// Get event by ID
exports.getEventById = async (req, res, next) => {
  const { id } = req.params;
  const adminId = req.user.id;

  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        clients: {
          include: { client: true }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.adminId !== adminId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.status(200).json(event);
  } catch (error) {
    next(error);
  }
};

// Update event
exports.updateEvent = async (req, res, next) => {
  const { id } = req.params;
  const { name, description, eventDate, location, clientIds } = req.body;
  const adminId = req.user.id;

  try {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event || event.adminId !== adminId) {
      return res.status(404).json({ message: "Event not found" });
    }

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        name,
        description,
        eventDate: eventDate ? new Date(eventDate) : null,
        location,
        clients: {
          deleteMany: {},
          create: clientIds.map(clientId => ({ clientId }))
        }
      },
      include: {
        clients: {
          include: { client: true }
        }
      }
    });

    res.status(200).json(updatedEvent);
    getIO().emit("event_updated", updatedEvent);
  } catch (error) {
    next(error);
  }
};

// Delete event
exports.deleteEvent = async (req, res, next) => {
  const { id } = req.params;
  const adminId = req.user.id;

  try {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event || event.adminId !== adminId) {
      return res.status(404).json({ message: "Event not found" });
    }

    await prisma.event.delete({ where: { id } });
    res.status(200).json({ message: "Event deleted successfully" });
    getIO().emit("event_deleted", { id });
  } catch (error) {
    next(error);
  }
};