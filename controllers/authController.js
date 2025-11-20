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
        return ApiResponse.error(res, "An account with this email already exists", 409, "DUPLICATE_EMAIL");
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
      if (error.message.includes('No account found')) {
        return ApiResponse.error(res, "No account found with this email address", 404, "ACCOUNT_NOT_FOUND");
      }
      if (error.message.includes('already verified')) {
        return ApiResponse.error(res, "Your email is already verified", 400, "ALREADY_VERIFIED");
      }
      if (error.message.includes('No verification code found')) {
        return ApiResponse.error(res, "No verification code found. Please request a new one.", 400, "NO_CODE_FOUND");
      }
      if (error.message.includes('expired')) {
        return ApiResponse.error(res, "Your verification code has expired. Please get a new one.", 400, "CODE_EXPIRED");
      }
      if (error.message.includes('Invalid verification code')) {
        return ApiResponse.error(res, "Invalid verification code. Please check and try again.", 400, "INVALID_CODE");
      }
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
      if (error.message.includes('verify your email')) {
        return ApiResponse.error(res, "Please verify your email before logging in", 403, "EMAIL_NOT_VERIFIED");
      }
      if (error.message.includes('Invalid email or password')) {
        return ApiResponse.error(res, "Invalid email or password", 401, "INVALID_CREDENTIALS");
      }
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const refreshToken = req.cookies.refresh;
      if (!refreshToken) {
        return ApiResponse.error(res, "Please log in to continue", 401, "NO_REFRESH_TOKEN");
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
      return ApiResponse.error(res, "Session expired. Please log in again.", 401, "INVALID_REFRESH_TOKEN");
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
      if (error.message.includes('No account found')) {
        return ApiResponse.error(res, "No account found with this email address", 404, "ACCOUNT_NOT_FOUND");
      }
      if (error.message.includes('verify your email')) {
        return ApiResponse.error(res, "Please verify your email before resetting your password", 403, "EMAIL_NOT_VERIFIED");
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