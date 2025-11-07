const { PrismaClient, TokenType } = require("@prisma/client");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { sendEmail } = require("../utils/mailer");
const ejs = require("ejs");
const path = require("path");
const JWTUtils = require("../utils/jwt");

const prisma = new PrismaClient();

class AdminService {
  async registerAdmin({
    email,
    password,
    businessName,
    contactPhone,
    businessAddress,
  }) {
    // Check for existing admin
    const existingAdmin = await prisma.admin.findUnique({ where: { email } });
    if (existingAdmin) {
      throw new Error("An account with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        businessName,
        contactPhone: contactPhone || null,
        businessAddress: businessAddress || null,
        isEmailVerified: false,
      },
    });

    // Generate email verification token (6-digit code)
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const hashedVerificationCode = await bcrypt.hash(verificationCode, 10);
    const tokenExpiresIn = 15 * 60 * 1000; // 15 minutes

    // Invalidate existing tokens
    await prisma.verificationToken.deleteMany({
      where: {
        email: admin.email,
        type: TokenType.EMAIL_VERIFICATION,
      },
    });

    // Store new verification token
    await prisma.verificationToken.create({
      data: {
        email: admin.email,
        token: hashedVerificationCode,
        type: TokenType.EMAIL_VERIFICATION,
        expiresAt: new Date(Date.now() + tokenExpiresIn),
        adminId: admin.id,
      },
    });

    // Render email template
    const emailSubject = "Verify Your Email Address";
    const emailText = `Welcome to Fashion Designer App! Your email verification code is: ${verificationCode}\nThis code will expire in 15 minutes.`;
    const emailHtml = await ejs.renderFile(
      path.join(__dirname, "../templates/emails/verify-email.ejs"),
      { businessName, verificationCode }
    );

    // Send verification email
    try {
      await sendEmail(admin.email, emailSubject, emailText, emailHtml);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      throw new Error(
        "We couldn't send your verification email. Please try again."
      );
    }

    // Generate tokens
    const tokenPayload = { id: admin.id, email: admin.email, type: "admin" };
    const accessToken = JWTUtils.signAccessToken(tokenPayload);
    const refreshToken = JWTUtils.signRefreshToken(tokenPayload);

    return {
      token: accessToken,
      refreshToken,
      admin: {
        id: admin.id,
        email: admin.email,
        businessName: admin.businessName,
        isEmailVerified: admin.isEmailVerified,
      },
      message:
        "Admin registered successfully. Please check your email to verify your account.",
    };
  }

  async resendVerificationEmail(email) {
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      throw new Error("No account found with this email address");
    }

    if (admin.isEmailVerified) {
      throw new Error("Your email is already verified");
    }

    // Invalidate existing tokens
    await prisma.verificationToken.deleteMany({
      where: {
        email: admin.email,
        type: TokenType.EMAIL_VERIFICATION,
      },
    });

    // Generate new verification token
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const hashedVerificationCode = await bcrypt.hash(verificationCode, 10);
    const tokenExpiresIn = 15 * 60 * 1000; // 15 minutes

    await prisma.verificationToken.create({
      data: {
        email: admin.email,
        token: hashedVerificationCode,
        type: TokenType.EMAIL_VERIFICATION,
        expiresAt: new Date(Date.now() + tokenExpiresIn),
        adminId: admin.id,
      },
    });

    // Render email template
    const emailSubject = "Resend: Verify Your Email Address";
    const emailText = `Your new email verification code is: ${verificationCode}\nThis code will expire in 15 minutes.`;
    const emailHtml = await ejs.renderFile(
      path.join(__dirname, "../templates/emails/resend-verify-email.ejs"),
      { verificationCode }
    );

    // Send verification email
    try {
      await sendEmail(admin.email, emailSubject, emailText, emailHtml);
    } catch (emailError) {
      console.error("Failed to resend verification email:", emailError);
      throw new Error(
        "We couldn't send your verification email. Please try again."
      );
    }

    return {
      message:
        "A new verification email has been sent. Please check your inbox.",
    };
  }

  async verifyEmail({ email, verificationCode }) {
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      throw new Error("No account found with this email address");
    }

    if (admin.isEmailVerified) {
      throw new Error("Your email is already verified");
    }

    const verificationTokenRecord = await prisma.verificationToken.findFirst({
      where: {
        email: email,
        type: TokenType.EMAIL_VERIFICATION,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!verificationTokenRecord) {
      throw new Error(
        "No verification code found. Please request a new one."
      );
    }

    const isTokenExpired =
      new Date() > new Date(verificationTokenRecord.expiresAt);
    if (isTokenExpired) {
      await prisma.verificationToken.delete({
        where: { id: verificationTokenRecord.id },
      });
      throw new Error(
        "Your verification code has expired. Please get a new one."
      );
    }

    const isCodeMatch = await bcrypt.compare(
      verificationCode,
      verificationTokenRecord.token
    );
    if (!isCodeMatch) {
      throw new Error("Invalid verification code. Please check and try again.");
    }

    // Update admin verification status
    await prisma.admin.update({
      where: { email: email },
      data: { isEmailVerified: true },
    });

    // Delete used token
    await prisma.verificationToken.delete({
      where: { id: verificationTokenRecord.id },
    });

    // Generate tokens
    const tokenPayload = { id: admin.id, email: admin.email, type: "admin" };
    const accessToken = JWTUtils.signAccessToken(tokenPayload);
    const refreshToken = JWTUtils.signRefreshToken(tokenPayload);

    return {
      message: "Email verified successfully. You are now logged in.",
      token: accessToken,
      refreshToken,
      admin: {
        id: admin.id,
        email: admin.email,
        businessName: admin.businessName,
        isEmailVerified: true,
      },
    };
  }

  async loginAdmin({ email, password }) {
    const admin = await prisma.admin.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        businessName: true,
        password: true,
        isEmailVerified: true,
      },
    });
    if (!admin) {
      throw new Error("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    if (!admin.isEmailVerified) {
      throw new Error(
        "Please verify your email before logging in"
      );
    }

    // Generate tokens
    const tokenPayload = { id: admin.id, email: admin.email, type: "admin" };
    const accessToken = JWTUtils.signAccessToken(tokenPayload);
    const refreshToken = JWTUtils.signRefreshToken(tokenPayload);

    return {
      message: "Login successful",
      token: accessToken,
      refreshToken,
      admin: {
        id: admin.id,
        email: admin.email,
        businessName: admin.businessName,
        isEmailVerified: admin.isEmailVerified,
      },
    };
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = JWTUtils.verifyRefreshToken(refreshToken);
      
      // Get admin data
      const admin = await prisma.admin.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          businessName: true,
          isEmailVerified: true,
        },
      });

      if (!admin) {
        throw new Error("Account not found");
      }

      // Generate new tokens
      const tokenPayload = { id: admin.id, email: admin.email, type: "admin" };
      const newAccessToken = JWTUtils.signAccessToken(tokenPayload);
      const newRefreshToken = JWTUtils.signRefreshToken(tokenPayload);

      return {
        token: newAccessToken,
        refreshToken: newRefreshToken,
        admin,
      };
    } catch (error) {
      throw new Error("Session expired. Please log in again.");
    }
  }

  async forgotPassword(email) {
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      throw new Error("No account found with this email address.");
    }

    if (!admin.isEmailVerified) {
      throw new Error(
        "Please verify your email before resetting your password"
      );
    }

    // Invalidate existing password reset tokens
    await prisma.verificationToken.deleteMany({
      where: {
        email: admin.email,
        type: TokenType.PASSWORD_RESET,
      },
    });

    // Generate 6-digit reset code
    const resetCode = crypto.randomInt(100000, 999999).toString();
    const hashedResetCode = await bcrypt.hash(resetCode, 10);
    const tokenExpiresIn = 15 * 60 * 1000; // 15 minutes

    await prisma.verificationToken.create({
      data: {
        email: admin.email,
        token: hashedResetCode,
        type: TokenType.PASSWORD_RESET,
        expiresAt: new Date(Date.now() + tokenExpiresIn),
        adminId: admin.id,
      },
    });

    // Render email template
    const emailSubject = "Password Reset Request";
    const emailText = `You requested to reset your password. Your password reset code is: ${resetCode}\nThis code will expire in 15 minutes. If you didn't request this, please ignore this email.`;
    const emailHtml = await ejs.renderFile(
      path.join(__dirname, "../templates/emails/forgot-password.ejs"),
      { businessName: admin.businessName, resetCode }
    );

    try {
      await sendEmail(admin.email, emailSubject, emailText, emailHtml);
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      throw new Error(
        "We couldn't send your reset code. Please try again."
      );
    }

    return {
      message:
        "Reset code sent to your email. Please check your inbox.",
    };
  }

  async verifyResetCode({ email, resetCode }) {
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      throw new Error("No account found with this email address.");
    }

    const resetTokenRecord = await prisma.verificationToken.findFirst({
      where: {
        email: email,
        type: TokenType.PASSWORD_RESET,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!resetTokenRecord) {
      throw new Error(
        "No reset code found. Please request a new password reset."
      );
    }

    const isTokenExpired = new Date() > new Date(resetTokenRecord.expiresAt);
    if (isTokenExpired) {
      await prisma.verificationToken.delete({
        where: { id: resetTokenRecord.id },
      });
      throw new Error(
        "Your reset code has expired. Please request a new one."
      );
    }

    const isCodeMatch = await bcrypt.compare(
      resetCode,
      resetTokenRecord.token
    );
    if (!isCodeMatch) {
      throw new Error("Invalid reset code. Please check and try again.");
    }

    return {
      message: "Reset code verified. You can now set your new password.",
      verified: true,
    };
  }

  async resetPassword({ email, resetCode, newPassword }) {
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      throw new Error("No account found with this email address.");
    }

    const resetTokenRecord = await prisma.verificationToken.findFirst({
      where: {
        email: email,
        type: TokenType.PASSWORD_RESET,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!resetTokenRecord) {
      throw new Error(
        "No reset code found. Please request a new password reset."
      );
    }

    const isTokenExpired = new Date() > new Date(resetTokenRecord.expiresAt);
    if (isTokenExpired) {
      await prisma.verificationToken.delete({
        where: { id: resetTokenRecord.id },
      });
      throw new Error(
        "Your reset code has expired. Please request a new one."
      );
    }

    const isCodeMatch = await bcrypt.compare(
      resetCode,
      resetTokenRecord.token
    );
    if (!isCodeMatch) {
      throw new Error("Invalid reset code. Please check and try again.");
    }

    // Check if new password is same as old password
    const isSamePassword = await bcrypt.compare(newPassword, admin.password);
    if (isSamePassword) {
      throw new Error(
        "Please choose a different password from your current one"
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and delete token in a transaction for atomicity
    await prisma.$transaction([
      prisma.admin.update({
        where: { email: email },
        data: { password: hashedPassword },
      }),
      prisma.verificationToken.delete({
        where: { id: resetTokenRecord.id },
      }),
    ]);

    // Send confirmation email
    const emailSubject = "Password Reset Successful";
    const emailText = `Your password has been successfully reset. If you didn't make this change, please contact support immediately.`;
    const emailHtml = await ejs.renderFile(
      path.join(__dirname, "../templates/emails/password-reset-success.ejs"),
      { businessName: admin.businessName }
    );

    try {
      await sendEmail(admin.email, emailSubject, emailText, emailHtml);
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Don't throw error here as password was already reset
    }

    return {
      message:
        "Password updated successfully. You can now log in.",
    };
  }
}

module.exports = new AdminService();