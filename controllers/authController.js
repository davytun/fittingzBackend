const { validationResult } = require('express-validator');
const AdminService = require('../services/authService');
const ApiResponse = require('../utils/response');

class AdminController {
  async registerAdmin(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.error(res, "Validation failed", 400, "VALIDATION_ERROR", errors.array());
    }

    try {
      const result = await AdminService.registerAdmin(req.body);
      
      // Set refresh token as HttpOnly cookie
      res.cookie('refresh', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/auth/refresh',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      return res.status(201).json({
        success: true,
        message: "Registered",
        token: result.token,
        admin: result.admin
      });
    } catch (error) {
      if (error.message.includes('already exists')) {
        return ApiResponse.error(res, error.message, 409, "DUPLICATE_EMAIL");
      }
      next(error);
    }
  }

  async resendVerificationEmail(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.error(res, "Validation failed", 400, "VALIDATION_ERROR", errors.array());
    }

    try {
      await AdminService.resendVerificationEmail(req.body.email);
      return ApiResponse.success(res, null, "Sent");
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.error(res, "Validation failed", 400, "VALIDATION_ERROR", errors.array());
    }

    try {
      const result = await AdminService.verifyEmail(req.body);
      
      // Set refresh token as HttpOnly cookie
      res.cookie('refresh', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/auth/refresh',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      return res.status(200).json({
        success: true,
        message: result.message,
        token: result.token,
        admin: result.admin
      });
    } catch (error) {
      next(error);
    }
  }

  async loginAdmin(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.error(res, "Validation failed", 400, "VALIDATION_ERROR", errors.array());
    }

    try {
      const result = await AdminService.loginAdmin(req.body);
      
      // Set refresh token as HttpOnly cookie
      res.cookie('refresh', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/auth/refresh',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      return res.status(200).json({
        success: true,
        message: result.message,
        token: result.token,
        admin: result.admin
      });
    } catch (error) {
      if (error.message.includes('Email not verified')) {
        return ApiResponse.error(res, error.message, 403, "EMAIL_NOT_VERIFIED");
      }
      if (error.message.includes('Invalid credentials')) {
        return ApiResponse.error(res, "Invalid credentials", 401, "INVALID_CREDENTIALS");
      }
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const refreshToken = req.cookies.refresh;
      if (!refreshToken) {
        return ApiResponse.error(res, "No refresh token provided", 401, "NO_REFRESH_TOKEN");
      }

      const result = await AdminService.refreshToken(refreshToken);
      
      // Set new refresh token as HttpOnly cookie
      res.cookie('refresh', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/api/auth/refresh',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      });

      return res.status(200).json({
        success: true,
        message: "Refreshed",
        token: result.token,
        admin: result.admin
      });
    } catch (error) {
      return ApiResponse.error(res, "Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");
    }
  }

  async forgotPassword(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.error(res, "Validation failed", 400, "VALIDATION_ERROR", errors.array());
    }

    try {
      await AdminService.forgotPassword(req.body.email);
      return ApiResponse.success(res, null, "Code sent");
    } catch (error) {
      if (error.message.includes('Email not verified')) {
        return ApiResponse.error(res, error.message, 403, "EMAIL_NOT_VERIFIED");
      }
      next(error);
    }
  }

  async verifyResetCode(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.error(res, "Validation failed", 400, "VALIDATION_ERROR", errors.array());
    }

    try {
      const result = await AdminService.verifyResetCode(req.body);
      return res.status(200).json({
        success: true,
        message: result.message,
        verified: result.verified
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.error(res, "Validation failed", 400, "VALIDATION_ERROR", errors.array());
    }

    try {
      const result = await AdminService.resetPassword(req.body);
      return ApiResponse.success(res, null, "Password reset");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();