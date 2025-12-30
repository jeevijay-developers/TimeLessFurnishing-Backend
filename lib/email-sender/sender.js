const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");

const sendEmail = (body, res, message) => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("Email configuration missing!");
    return res.status(500).send({
      message: "Email service is not configured. Please contact support.",
    });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail", // Use Gmail service instead of manual host config for better compatibility
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  // Set a timeout to prevent hanging indefinitely
  const emailTimeout = setTimeout(() => {
    console.error(
      "Email operation timed out - this may indicate SMTP is blocked"
    );
    if (!res.headersSent) {
      res.status(500).send({
        message:
          "Email service timeout. Your hosting provider may block SMTP connections. Consider using an email API service.",
      });
    }
  }, 15000); // 15 seconds total timeout

  // Skip verify() in serverless environments as it often hangs
  // Send email directly for better serverless compatibility
  transporter.sendMail(body, (err, data) => {
    clearTimeout(emailTimeout);
    if (err) {
      console.error("Error sending email:", err);
      if (!res.headersSent) {
        res.status(403).send({
          message: `Error sending email: ${err.message}. If this persists, SMTP may be blocked.`,
        });
      }
    } else {
      console.log("Email sent successfully:", data?.messageId);
      if (!res.headersSent) {
        res.send({
          message: message,
        });
      }
    }
  });
};
//limit email verification and forget password
const minutes = 30;
const emailVerificationLimit = rateLimit({
  windowMs: minutes * 60 * 1000,
  max: 3,
  handler: (req, res) => {
    res.status(429).send({
      success: false,
      message: `You made too many requests. Please try again after ${minutes} minutes.`,
    });
  },
});

const passwordVerificationLimit = rateLimit({
  windowMs: minutes * 60 * 1000,
  max: 3,
  handler: (req, res) => {
    res.status(429).send({
      success: false,
      message: `You made too many requests. Please try again after ${minutes} minutes.`,
    });
  },
});

const supportMessageLimit = rateLimit({
  windowMs: minutes * 60 * 1000,
  max: 5,
  handler: (req, res) => {
    res.status(429).send({
      success: false,
      message: `You made too many requests. Please try again after ${minutes} minutes.`,
    });
  },
});

const phoneVerificationLimit = rateLimit({
  windowMs: minutes * 60 * 1000,
  max: 2,
  handler: (req, res) => {
    res.status(429).send({
      success: false,
      message: `You made too many requests. Please try again after ${minutes} minutes.`,
    });
  },
});

module.exports = {
  sendEmail,
  emailVerificationLimit,
  passwordVerificationLimit,
  supportMessageLimit,
  phoneVerificationLimit,
};
