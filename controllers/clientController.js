const { validationResult } = require("express-validator");
const ClientService = require("../services/clientService");
const { trackActivity, ActivityTypes } = require('../utils/activityTracker');
const { notifyClientAdded } = require('../utils/notificationHelper');

class ClientController {
  async createClient(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, phone, email, gender } = req.body;
      const adminId = req.user.id;
      const client = await ClientService.createClient({
        name,
        phone,
        email,
        gender,
        adminId,
      });
      
      await trackActivity(
        adminId,
        ActivityTypes.CLIENT_CREATED,
        `New client added: ${name}`,
        `Client ${name} has been successfully added to your system`,
        client.id,
        'Client'
      );
      
      await notifyClientAdded(adminId, name, client.id);
      
      res.status(201).json(client);
    } catch (error) {
      if (error.message === "Unauthorized. Admin ID not found.") {
        return res.status(401).json({ message: error.message });
      }
      if (error.code === "P2025") {
        return res
          .status(400)
          .json({ message: "Admin user not found for creating client." });
      }
      next(error);
    }
  }

  async getAllClients(req, res, next) {
    try {
      const adminId = req.user.id;
      const page = parseInt(req.query.page, 10) || 1;
      const pageSize = parseInt(req.query.pageSize, 10) || 10;
      const result = await ClientService.getAllClients({
        adminId,
        page,
        pageSize,
      });
      res.status(200).json(result);
    } catch (error) {
      if (error.message === "Unauthorized. Admin ID not found.") {
        return res.status(401).json({ message: error.message });
      }
      next(error);
    }
  }

  async getClientById(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;
      const client = await ClientService.getClientById({ id, adminId });
      res.status(200).json(client);
    } catch (error) {
      if (error.message === "Unauthorized. Admin ID not found.") {
        return res.status(401).json({ message: error.message });
      }
      if (error.message.includes("Client not found")) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes("Forbidden")) {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  }

  async updateClient(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const {
        name,
        phone,
        email,
        gender,
        favoriteColors,
        dislikedColors,
        preferredStyles,
        bodyShape,
        additionalDetails,
      } = req.body;
      const adminId = req.user.id;
      const updatedClient = await ClientService.updateClient({
        id,
        adminId,
        name,
        phone,
        email,
        gender,
        favoriteColors,
        dislikedColors,
        preferredStyles,
        bodyShape,
        additionalDetails,
      });
      res.status(200).json(updatedClient);
    } catch (error) {
      if (error.message === "Unauthorized. Admin ID not found.") {
        return res.status(401).json({ message: error.message });
      }
      if (error.message.includes("Client not found")) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes("Forbidden")) {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  }

  async deleteClient(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;
      const result = await ClientService.deleteClient({ id, adminId });
      res.status(200).json(result);
    } catch (error) {
      if (error.message === "Unauthorized. Admin ID not found.") {
        return res.status(401).json({ message: error.message });
      }
      if (error.message.includes("Client not found")) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes("Forbidden")) {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  }
}

module.exports = new ClientController();
