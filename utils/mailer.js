const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');

const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;

// Basic check for essential mail configuration
if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
  console.warn(
    "Email service is not fully configured. Missing SMTP configuration. Email sending will likely fail."
  );
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: parseInt(SMTP_PORT) || 587,
  secure: SMTP_SECURE === 'true',
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

/**
 * Sends an email using Resend.
 * @param {string} to Recipient's email address.
 * @param {string} subject Email subject.
 * @param {string} text Plain text body of the email.
 * @param {string} html HTML body of the email.
 * @returns {Promise<object>} Promise resolving to the info object from Resend.
 * @throws {Error} If email sending fails.
 */
const sendEmail = async (to, subject, text, html) => {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error("SMTP not configured. Cannot send email.");
    throw new Error("Email service not configured.");
  }
  
  try {
    const info = await transporter.sendMail({
      from: MAIL_FROM || SMTP_USER,
      to: to,
      subject: subject,
      text: text,
      html: html,
    });

    console.log("Email sent successfully:", info.messageId);
    return { data: { id: info.messageId }, error: null };
  } catch (error) {
    console.error("Error sending email with nodemailer:", error.message);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

const sendTemplateEmail = async (to, subject, templateName, templateData) => {
  try {
    const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.ejs`);
    const html = await ejs.renderFile(templatePath, templateData);
    return await sendEmail(to, subject, '', html);
  } catch (error) {
    console.error('Error rendering email template:', error.message);
    throw new Error(`Failed to send template email: ${error.message}`);
  }
};

module.exports = {
  sendEmail,
  sendTemplateEmail,
};
