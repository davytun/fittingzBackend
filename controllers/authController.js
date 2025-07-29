const { PrismaClient, TokenType } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const crypto = require("crypto");
const { sendEmail } = require("../utils/mailer");
const ejs = require("ejs");
const path = require("path");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error(
    "FATAL ERROR: JWT_SECRET is not defined in .env file. Authentication will not work."
  );
}

// Register Admin
exports.registerAdmin = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, businessName, contactPhone, businessAddress } =
    req.body;

  if (!JWT_SECRET) {
    return res.status(500).json({
      message: "Authentication system not configured (missing JWT_SECRET).",
    });
  }

  try {
    const existingAdmin = await prisma.admin.findUnique({ where: { email } });
    if (existingAdmin) {
      return res
        .status(400)
        .json({ message: "Admin with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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

    // Invalidate any existing email verification tokens for this email
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

    // Render EJS template for verification email
    const emailSubject = "Verify Your Email Address";
    const emailText = `Welcome to Fashion Designer App! Your email verification code is: ${verificationCode}\nThis code will expire in 15 minutes.`;
    const emailHtml = await ejs.renderFile(
      path.join(__dirname, "../templates/emails/verify-email.ejs"),
      { businessName, verificationCode }
    );

    try {
      await sendEmail(admin.email, emailSubject, emailText, emailHtml);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      return res.status(500).json({
        message:
          "Admin registered, but failed to send verification email. Please try resending it.",
      });
    }

    res.status(201).json({
      message:
        "Admin registered successfully. Please check your email to verify your account.",
      admin: {
        id: admin.id,
        email: admin.email,
        businessName: admin.businessName,
      },
    });
  } catch (error) {
    console.error("Error during admin registration:", error);
    next(error);
  }
};

// Resend Verification Email
exports.resendVerificationEmail = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email } = req.body;

  try {
    const admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin) {
      return res
        .status(404)
        .json({ message: "Admin not found with this email." });
    }

    if (admin.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified." });
    }

    // Invalidate any existing email verification tokens for this email
    await prisma.verificationToken.deleteMany({
      where: {
        email: admin.email,
        type: TokenType.EMAIL_VERIFICATION,
      },
    });

    // Generate new email verification token (6-digit code)
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

    // Render EJS template for resend verification email
    const emailSubject = "Resend: Verify Your Email Address";
    const emailText = `Your new email verification code is: ${verificationCode}\nThis code will expire in 15 minutes.`;
    const emailHtml = await ejs.renderFile(
      path.join(__dirname, "../templates/emails/resend-verify-email.ejs"),
      { verificationCode }
    );

    try {
      await sendEmail(admin.email, emailSubject, emailText, emailHtml);
    } catch (emailError) {
      console.error("Failed to resend verification email:", emailError);
      return res.status(500).json({
        message: "Failed to resend verification email. Please try again later.",
      });
    }

    res.status(200).json({
      message:
        "A new verification email has been sent. Please check your inbox.",
    });
  } catch (error) {
    console.error("Error resending verification email:", error);
    next(error);
  }
};

// Verify Email
exports.verifyEmail = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, verificationCode } = req.body;

  try {
    const admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin) {
      return res
        .status(404)
        .json({ message: "Admin not found with this email." });
    }

    if (admin.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified." });
    }

    const verificationTokenRecord = await prisma.verificationToken.findFirst({
      where: {
        email: email,
        type: TokenType.EMAIL_VERIFICATION,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!verificationTokenRecord) {
      return res.status(400).json({
        message:
          "No active verification token found. Please request a new one.",
      });
    }

    const isTokenExpired =
      new Date() > new Date(verificationTokenRecord.expiresAt);
    if (isTokenExpired) {
      await prisma.verificationToken.delete({
        where: { id: verificationTokenRecord.id },
      });
      return res.status(400).json({
        message: "Verification token has expired. Please request a new one.",
      });
    }

    const isCodeMatch = await bcrypt.compare(
      verificationCode,
      verificationTokenRecord.token
    );
    if (!isCodeMatch) {
      return res.status(400).json({ message: "Invalid verification code." });
    }

    // Verification successful
    await prisma.admin.update({
      where: { email: email },
      data: { isEmailVerified: true },
    });

    // Delete the used token
    await prisma.verificationToken.delete({
      where: { id: verificationTokenRecord.id },
    });

    if (!JWT_SECRET) {
      console.error("JWT_SECRET not found during email verification success.");
      return res.status(500).json({
        message:
          "Verification successful, but login token could not be generated at this time.",
      });
    }
    const tokenPayload = { id: admin.id, email: admin.email, type: "admin" };
    const jwtToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({
      message: "Email verified successfully. You are now logged in.",
      token: jwtToken,
      admin: {
        id: admin.id,
        email: admin.email,
        businessName: admin.businessName,
        isEmailVerified: true,
      },
    });
  } catch (error) {
    console.error("Error during email verification:", error);
    next(error);
  }
};

// Login Admin
exports.loginAdmin = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  if (!JWT_SECRET) {
    return res.status(500).json({
      message: "Authentication system not configured (missing JWT_SECRET).",
    });
  }

  try {
    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      return res
        .status(401)
        .json({ message: "Invalid credentials (email not found)" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Invalid credentials (password incorrect)" });
    }

    // Check if email is verified
    if (!admin.isEmailVerified) {
      return res.status(403).json({
        message:
          "Email not verified. Please verify your email before logging in.",
        errorType: "EMAIL_NOT_VERIFIED",
      });
    }

    // Issue JWT token
    const tokenPayload = { id: admin.id, email: admin.email, type: "admin" };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({
      message: "Login successful",
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        businessName: admin.businessName,
        contactPhone: admin.contactPhone,
        businessAddress: admin.businessAddress,
        isEmailVerified: admin.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("Error during admin login:", error);
    next(error);
  }
};
