const { validationResult } = require('express-validator');
const AdminService = require('../services/adminService');

class AdminController {
  async registerAdmin(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const result = await AdminService.registerAdmin(req.body);
      res.status(201).json(result);
    } catch (error) {
      console.error('Error during admin registration:', error);
      next(error);
    }
  }

  async resendVerificationEmail(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const result = await AdminService.resendVerificationEmail(req.body.email);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error resending verification email:', error);
      next(error);
    }
  }

  async verifyEmail(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const result = await AdminService.verifyEmail(req.body);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error during email verification:', error);
      next(error);
    }
  }

  async loginAdmin(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const result = await AdminService.loginAdmin(req.body);
      res.status(200).json(result);
    } catch (error) {
      console.error('Error during admin login:', error);
      if (error.message.includes('Email not verified')) {
        return res.status(403).json({
          message: error.message,
          errorType: 'EMAIL_NOT_VERIFIED',
        });
      }
      res.status(401).json({ message: error.message });
    }
  }
}

module.exports = new AdminController();