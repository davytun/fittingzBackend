const { Resend } = require("resend");

const { RESEND_API_KEY, MAIL_FROM } = process.env;

// Basic check for essential mail configuration
if (!RESEND_API_KEY || !MAIL_FROM) {
  console.warn(
    "Email service is not fully configured. Missing one or more environment variables (RESEND_API_KEY, MAIL_FROM). Email sending will likely fail."
  );
}

const resend = new Resend(RESEND_API_KEY);

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
  if (!RESEND_API_KEY) {
    console.error("Resend API key not configured. Cannot send email.");
    throw new Error("Email service not configured.");
  }
  
  try {
    const response = await resend.emails.send({
      from: MAIL_FROM,
      to: [to],
      subject: subject,
      text: text,
      html: html,
    });

    console.log("Email sent successfully:", JSON.stringify(response, null, 2));
    if (!response.data?.id) {
      console.warn("No email ID returned in Resend response:", response);
    }
    return response;
  } catch (error) {
    console.error(
      "Error sending email with Resend:",
      JSON.stringify(error, null, 2)
    );
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

module.exports = {
  sendEmail,
};
