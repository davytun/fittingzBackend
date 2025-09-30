const { validationResult } = require('express-validator');
const MeasurementService = require('../services/measurementService');

class MeasurementController {
  async addOrUpdateMeasurement(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { clientId } = req.params;
      const { fields } = req.body;
      const adminId = req.user.id;
      const measurement = await MeasurementService.addOrUpdateMeasurement({ clientId, fields, adminId });
      res.status(200).json(measurement);
    } catch (error) {
      if (error.message === 'Client not found') {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('Forbidden')) {
        return res.status(403).json({ message: error.message });
      }
      if (error.code === 'P2002') {
        return res.status(409).json({ message: 'Measurement record for this client already being processed.' });
      }
      next(error);
    }
  }

  async getMeasurementsByClientId(req, res, next) {
    try {
      const { clientId } = req.params;
      const adminId = req.user.id;
      const measurement = await MeasurementService.getMeasurementsByClientId({ clientId, adminId });
      res.status(200).json(measurement);
    } catch (error) {
      if (error.message === 'Client not found') {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('Forbidden')) {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  }

  async deleteMeasurementsByClientId(req, res, next) {
    try {
      const { clientId } = req.params;
      const adminId = req.user.id;
      const result = await MeasurementService.deleteMeasurementsByClientId({ clientId, adminId });
      res.status(200).json(result);
    } catch (error) {
      if (error.message === 'Client not found' || error.message.includes('No measurements found')) {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('Forbidden')) {
        return res.status(403).json({ message: error.message });
      }
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'No measurements found for this client to delete or already deleted.' });
      }
      next(error);
    }
  }
}

module.exports = new MeasurementController();