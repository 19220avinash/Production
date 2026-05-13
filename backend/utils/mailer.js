const nodemailer = require("nodemailer");

// Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail", // you can change (outlook, smtp, etc.)
  auth: {
    user: process.env.EMAIL_USER, // your email
    pass: process.env.EMAIL_PASS, // app password (NOT normal password)
  },
});

// Send Mail Function
const sendMail = async ({ to, subject, text, html }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,

      // ✅ Supports multiple emails
      to: Array.isArray(to) ? to.join(",") : to,

      subject: subject || "Notification",

      // Plain text fallback
      text: text || "",

      // Optional HTML
      html:
        html ||
        `<p>${text || "No content"}</p>`,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent:", info.response);
  } catch (error) {
    console.error("❌ Email error:", error.message);
  }
};

module.exports = sendMail;