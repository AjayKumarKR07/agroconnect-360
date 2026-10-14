const nodemailer = require("nodemailer");

/**
 * AgroConnect 360 - Email Service
 * Configured for Nodemailer SMTP if needed for system alerts or notifications.
 * OTP verification emails have been removed.
 */

const createTransporter = () => {
  if (
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_APP_PASSWORD
  ) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
};

module.exports = {
  createTransporter,
};