const { validationResult } = require('express-validator');
const MeasurementService = require('../services/measurementService');
const { trackActivity, ActivityTypes } = require('../utils/activityTracker');

class MeasurementController {
  async addMeasurement(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { clientId } = req.params;
      const { name, orderId, fields, isDefault } = req.body;
      const adminId = req.user.id;
      const measurement = await MeasurementService.addMeasurement({ clientId, name, orderId, fields, isDefault, adminId });
      
      await trackActivity(
        adminId,
        ActivityTypes.MEASUREMENT_ADDED,
        `New measurement added: ${name || 'Measurement'}`,
        `Measurement has been added for client`,
        measurement.id,
        'Measurement'
      );
      
      res.status(201).json(measurement);
    } catch (error) {
      if (error.message === 'Client not found' || error.message === 'Order not found') {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('Forbidden')) {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  }

  async getMeasurementsByClientId(req, res, next) {
    try {
      const { clientId } = req.params;
      const adminId = req.user.id;
      const measurements = await MeasurementService.getMeasurementsByClientId({ clientId, adminId });
      res.status(200).json(measurements);
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

  async updateMeasurement(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { id } = req.params;
      const { name, fields, isDefault } = req.body;
      const adminId = req.user.id;
      const measurement = await MeasurementService.updateMeasurement({ id, name, fields, isDefault, adminId });
      res.status(200).json(measurement);
    } catch (error) {
      if (error.message === 'Measurement not found') {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('Forbidden')) {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  }

  async getSingleMeasurement(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;
      const measurement = await MeasurementService.getSingleMeasurement({ id, adminId });
      res.status(200).json(measurement);
    } catch (error) {
      if (error.message === 'Measurement not found') {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('Forbidden')) {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  }

  async deleteMeasurement(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;
      const result = await MeasurementService.deleteMeasurement({ id, adminId });
      res.status(200).json(result);
    } catch (error) {
      if (error.message === 'Measurement not found') {
        return res.status(404).json({ message: error.message });
      }
      if (error.message.includes('Forbidden')) {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  }


}

module.exports = new MeasurementController();