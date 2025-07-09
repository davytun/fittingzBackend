const { PrismaClient, TokenType } = require('@prisma/client'); // Import TokenType
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const crypto = require('crypto'); // For generating random tokens
const { sendEmail } = require('../utils/mailer'); // Import the mailer utility

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET is not defined in .env file. Authentication will not work.");
    // In a real app, you might want to prevent the app from starting or have a default fallback for tests,
    // but for now, just logging and proceeding. Functions requiring it will fail.
}

// Register Admin
exports.registerAdmin = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, businessName, contactPhone, businessAddress } = req.body;

    if (!JWT_SECRET) {
        return res.status(500).json({ message: "Authentication system not configured (missing JWT_SECRET)." });
    }

    try {
        const existingAdmin = await prisma.admin.findUnique({ where: { email } });
        if (existingAdmin) {
            return res.status(400).json({ message: 'Admin with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await prisma.admin.create({
            data: {
                email,
                password: hashedPassword,
                businessName,
                contactPhone: contactPhone || null,
                businessAddress: businessAddress || null,
                isEmailVerified: false, // Set email as not verified initially
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
                adminId: admin.id, // Link to the created admin
            },
        });

        // Send verification email
        const emailSubject = 'Verify Your Email Address';
        const emailText = `Welcome to Fashion Designer App! Your email verification code is: ${verificationCode}\nThis code will expire in 15 minutes.`;
        const emailHtml = `<p>Welcome to Fashion Designer App!</p><p>Your email verification code is: <strong>${verificationCode}</strong></p><p>This code will expire in 15 minutes.</p>`;

        try {
            await sendEmail(admin.email, emailSubject, emailText, emailHtml);
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError);
            // Decide if registration should fail or proceed with a warning.
            // For now, let's assume registration is okay, but admin needs to be aware.
            // In a production app, you might want to roll back admin creation or queue the email.
            // Returning a specific error or message might be better here.
             return res.status(500).json({ message: 'Admin registered, but failed to send verification email. Please try resending it.' });
        }

        res.status(201).json({
            message: 'Admin registered successfully. Please check your email to verify your account.',
            admin: { id: admin.id, email: admin.email, businessName: admin.businessName },
            // No JWT token is issued until email is verified
        });

    } catch (error) {
        console.error("Error during admin registration:", error);
        // Check if the error is because the admin was created but token/email failed,
        // potentially delete the admin record to allow re-registration if that's desired.
        // This depends on transactional guarantees not easily available without explicit transaction management.
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
            return res.status(404).json({ message: 'Admin not found with this email.' });
        }

        if (admin.isEmailVerified) {
            return res.status(400).json({ message: 'Email is already verified.' });
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

        // Send new verification email
        const emailSubject = 'Resend: Verify Your Email Address';
        const emailText = `Your new email verification code is: ${verificationCode}\nThis code will expire in 15 minutes.`;
        const emailHtml = `<p>Your new email verification code is: <strong>${verificationCode}</strong></p><p>This code will expire in 15 minutes.</p>`;

        try {
            await sendEmail(admin.email, emailSubject, emailText, emailHtml);
        } catch (emailError) {
            console.error('Failed to resend verification email:', emailError);
            // Log the error but don't necessarily fail the whole request if token was stored.
            // The user might still be able to try verifying if they somehow get the code,
            // or they can try resending again.
            return res.status(500).json({ message: 'Failed to resend verification email. Please try again later.' });
        }

        res.status(200).json({ message: 'A new verification email has been sent. Please check your inbox.' });

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
            return res.status(404).json({ message: 'Admin not found with this email.' });
        }

        if (admin.isEmailVerified) {
            return res.status(400).json({ message: 'Email is already verified.' });
        }

        const verificationTokenRecord = await prisma.verificationToken.findFirst({
            where: {
                email: email,
                type: TokenType.EMAIL_VERIFICATION,
            },
            orderBy: {
                createdAt: 'desc', // Get the latest one if multiple somehow exist
            },
        });

        if (!verificationTokenRecord) {
            return res.status(400).json({ message: 'No active verification token found. Please request a new one.' });
        }

        const isTokenExpired = new Date() > new Date(verificationTokenRecord.expiresAt);
        if (isTokenExpired) {
            // Optionally delete expired token
            await prisma.verificationToken.delete({ where: { id: verificationTokenRecord.id } });
            return res.status(400).json({ message: 'Verification token has expired. Please request a new one.' });
        }

        const isCodeMatch = await bcrypt.compare(verificationCode, verificationTokenRecord.token);
        if (!isCodeMatch) {
            return res.status(400).json({ message: 'Invalid verification code.' });
        }

        // Verification successful
        await prisma.admin.update({
            where: { email: email },
            data: { isEmailVerified: true },
        });

        // Delete the used token
        await prisma.verificationToken.delete({ where: { id: verificationTokenRecord.id } });

        // Issue JWT token for immediate login
        if (!JWT_SECRET) {
            console.error("JWT_SECRET not found during email verification success.");
            return res.status(500).json({ message: "Verification successful, but login token could not be generated at this time."});
        }
        const tokenPayload = { id: admin.id, email: admin.email, type: 'admin' };
        const jwtToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            message: 'Email verified successfully. You are now logged in.',
            token: jwtToken,
            admin: {
                id: admin.id,
                email: admin.email,
                businessName: admin.businessName,
                isEmailVerified: true
            }
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
        return res.status(500).json({ message: "Authentication system not configured (missing JWT_SECRET)." });
    }

    try {
        const admin = await prisma.admin.findUnique({ where: { email } });
        if (!admin) {
            return res.status(401).json({ message: 'Invalid credentials (email not found)' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials (password incorrect)' });
        }

        // Check if email is verified
        if (!admin.isEmailVerified) {
            return res.status(403).json({
                message: 'Email not verified. Please verify your email before logging in.',
                errorType: 'EMAIL_NOT_VERIFIED' // Custom error type for client-side handling
            });
        }

        // --- IP Verification Logic Start ---
        const currentIp = req.ip; // Make sure req.ip is correctly populated (e.g., app.set('trust proxy', true) if behind a proxy)
        const userAgent = req.headers['user-agent'];

        // Check for a recent, VERIFIED login attempt from this IP for this admin
        const recentVerifiedAttempt = await prisma.adminLoginAttempt.findFirst({
            where: {
                adminId: admin.id,
                ipAddress: currentIp,
                status: 'VERIFIED',
                verifiedAt: {
                    gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // e.g., trusted for 24 hours
                },
                // Optionally, you could also check userAgent if you want to be stricter
            },
            orderBy: {
                verifiedAt: 'desc',
            },
        });

        if (!recentVerifiedAttempt) {
            // No recent verified login from this IP. Trigger IP verification.

            // Invalidate any older PENDING codes for this admin to avoid confusion
            await prisma.adminLoginAttempt.updateMany({
                where: {
                    adminId: admin.id,
                    status: 'PENDING',
                },
                data: {
                    status: 'EXPIRED', // Or just delete them
                }
            });

            const loginVerificationCode = crypto.randomInt(100000, 999999).toString();
            const hashedLoginVerificationCode = await bcrypt.hash(loginVerificationCode, 10);
            const codeExpiresIn = 10 * 60 * 1000; // 10 minutes for login verification

            await prisma.adminLoginAttempt.create({
                data: {
                    adminId: admin.id,
                    ipAddress: currentIp,
                    userAgent: userAgent,
                    verificationCode: hashedLoginVerificationCode,
                    verificationCodeExpiresAt: new Date(Date.now() + codeExpiresIn),
                    status: 'PENDING',
                },
            });

            // Send login verification email
            const emailSubject = 'Security Alert: New Login Attempt';
            const emailText = `We detected a login attempt from a new IP address (${currentIp}). Your verification code is: ${loginVerificationCode}\nThis code will expire in 10 minutes. If you did not attempt this login, please secure your account.`;
            const emailHtml = `<p>We detected a login attempt from a new IP address (<strong>${currentIp}</strong>).</p><p>Your verification code is: <strong>${loginVerificationCode}</strong></p><p>This code will expire in 10 minutes.</p><p>If you did not attempt this login, please secure your account immediately.</p>`;

            try {
                await sendEmail(admin.email, emailSubject, emailText, emailHtml);
            } catch (emailError) {
                console.error('Failed to send login verification email:', emailError);
                // Log the error, but still inform the user that verification is needed.
                // They might need to use the "resend code" option later.
                return res.status(500).json({ message: 'Login attempt recorded, but failed to send verification code. Please try resending the code or contact support.' });
            }

            return res.status(403).json({ // 403 Forbidden, but with a clear message
                message: 'Login attempt from a new IP address. Please verify your identity.',
                errorType: 'IP_VERIFICATION_REQUIRED',
                // Optionally, you can send some identifier for the attempt if needed client-side
            });
        }
        // --- IP Verification Logic End ---


        // If execution reaches here, email is verified, password matches, and IP is recognized or verified.
        const tokenPayload = { id: admin.id, email: admin.email, type: 'admin' };
        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            message: 'Login successful',
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

// Verify Login IP
exports.verifyLoginIp = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, loginVerificationCode } = req.body;
    const currentIp = req.ip; // Get current IP for logging/matching if necessary

    if (!JWT_SECRET) {
        return res.status(500).json({ message: "Authentication system not configured (missing JWT_SECRET)." });
    }

    try {
        const admin = await prisma.admin.findUnique({ where: { email } });
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found with this email.' });
        }

        // Find the most recent PENDING login attempt for this admin
        const loginAttempt = await prisma.adminLoginAttempt.findFirst({
            where: {
                adminId: admin.id,
                status: 'PENDING',
                // Optional: you might want to ensure it's from the same IP that's trying to verify,
                // but the code is the primary factor.
                // ipAddress: currentIp,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (!loginAttempt) {
            return res.status(400).json({ message: 'No pending login verification found. Please try logging in again.' });
        }

        const isCodeExpired = new Date() > new Date(loginAttempt.verificationCodeExpiresAt);
        if (isCodeExpired) {
            await prisma.adminLoginAttempt.update({
                where: { id: loginAttempt.id },
                data: { status: 'EXPIRED' },
            });
            return res.status(400).json({ message: 'Login verification code has expired. Please try logging in again to get a new code.' });
        }

        const isCodeMatch = await bcrypt.compare(loginVerificationCode, loginAttempt.verificationCode);
        if (!isCodeMatch) {
            // Optional: Implement attempt counter here to prevent brute-force
            return res.status(400).json({ message: 'Invalid login verification code.' });
        }

        // Verification successful
        await prisma.adminLoginAttempt.update({
            where: { id: loginAttempt.id },
            data: {
                status: 'VERIFIED',
                verifiedAt: new Date(),
                ipAddress: currentIp, // Update IP address at the time of verification, in case it changed slightly (e.g. proxy)
            },
        });

        // Issue JWT token
        const tokenPayload = { id: admin.id, email: admin.email, type: 'admin' };
        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({
            message: 'Login IP verified successfully. You are now logged in.',
            token,
            admin: {
                id: admin.id,
                email: admin.email,
                businessName: admin.businessName,
                isEmailVerified: admin.isEmailVerified, // Ensure this is still relevant
            },
        });

    } catch (error) {
        console.error("Error during login IP verification:", error);
        next(error);
    }
};


// Resend Login IP Verification Code
exports.resendLoginIpVerificationCode = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const requestIp = req.ip; // IP from which the resend request is made

    try {
        const admin = await prisma.admin.findUnique({ where: { email } });
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found.' });
        }

        if (!admin.isEmailVerified) {
            // Should not happen if they are at IP verification stage, but good check.
            return res.status(403).json({ message: 'Please verify your email address first.' });
        }

        // Find the latest PENDING login attempt for this admin.
        // We only resend for an *existing* PENDING attempt from a *specific IP* that was challenged.
        const pendingAttempt = await prisma.adminLoginAttempt.findFirst({
            where: {
                adminId: admin.id,
                status: 'PENDING',
                // We might want to ensure the resend is for the most recent IP that was challenged.
                // If multiple IPs were challenged and are PENDING, this logic might need refinement.
                // For simplicity, target the most recent PENDING one.
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        if (!pendingAttempt) {
            return res.status(400).json({ message: 'No active login verification pending. Please try to login first to trigger a new code.' });
        }

        // Optional: Check if too many resend requests for this attempt.
        // For now, we generate a new code and update the existing PENDING attempt.

        const newLoginVerificationCode = crypto.randomInt(100000, 999999).toString();
        const hashedNewLoginVerificationCode = await bcrypt.hash(newLoginVerificationCode, 10);
        const newCodeExpiresIn = 10 * 60 * 1000; // 10 minutes

        await prisma.adminLoginAttempt.update({
            where: { id: pendingAttempt.id },
            data: {
                verificationCode: hashedNewLoginVerificationCode,
                verificationCodeExpiresAt: new Date(Date.now() + newCodeExpiresIn),
                // ipAddress: requestIp, // Optionally update IP if resend must come from same IP as original attempt
                                       // Or keep original IP that was challenged: pendingAttempt.ipAddress
            },
        });

        // Send the new login verification email
        const emailSubject = 'Resent: Security Alert - Login Verification Code';
        const emailText = `Your new login verification code for IP address ${pendingAttempt.ipAddress} is: ${newLoginVerificationCode}\nThis code will expire in 10 minutes.`;
        const emailHtml = `<p>Your new login verification code for IP address <strong>${pendingAttempt.ipAddress}</strong> is: <strong>${newLoginVerificationCode}</strong></p><p>This code will expire in 10 minutes.</p>`;

        try {
            await sendEmail(admin.email, emailSubject, emailText, emailHtml);
        } catch (emailError) {
            console.error('Failed to resend login verification email:', emailError);
            return res.status(500).json({ message: 'Failed to resend login verification code. Please try again later.' });
        }

        res.status(200).json({ message: 'A new login verification code has been sent to your email.' });

    } catch (error) {
        console.error("Error resending login IP verification code:", error);
        next(error);
    }
};
