const nodemailer = require('nodemailer');

const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE, // true for 465, false for other ports (like 587 with STARTTLS)
    SMTP_USER,
    SMTP_PASS,
    MAIL_FROM,
} = process.env;

// Basic check for essential mail configuration
if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !MAIL_FROM) {
    console.warn(
        'Email service is not fully configured. Missing one or more SMTP environment variables (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM). Email sending will likely fail.'
    );
}

const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10), // Ensure port is an integer
    secure: SMTP_SECURE === 'true', // Convert string 'true' to boolean true
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
    // Optional: Add TLS options if needed, e.g., for self-signed certificates (not recommended for production)
    // tls: {
    //   rejectUnauthorized: false // Use only for development with self-signed certs
    // }
});

/**
 * Sends an email.
 * @param {string} to Recipient's email address.
 * @param {string} subject Email subject.
 * @param {string} text Plain text body of the email.
 * @param {string} html HTML body of the email.
 * @returns {Promise<object>} Promise resolving to the info object from Nodemailer.
 * @throws {Error} If email sending fails.
 */
const sendEmail = async (to, subject, text, html) => {
    if (!SMTP_HOST) { // Check again in case console.warn was bypassed or for runtime check
        console.error('SMTP host not configured. Cannot send email.');
        throw new Error('Email service not configured.');
    }

    const mailOptions = {
        from: MAIL_FROM, // sender address
        to: to, // list of receivers
        subject: subject, // Subject line
        text: text, // plain text body
        html: html, // html body
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Message sent: %s', info.messageId);
        // Preview URL (if using ethereal.email or similar for testing)
        // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error; // Re-throw the error to be handled by the caller
    }
};

module.exports = {
    sendEmail,
    // You can also export the transporter itself if needed for advanced use cases
    // transporter,
};
