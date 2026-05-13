const express = require("express");
const router = express.Router();

const Email = require("../models/Email");
const sendMail = require("../utils/mailer");
const Item = require("../models/Item"); // needed for delete

// ================= GET EMAILS =================
router.get("/emails", async (req, res) => {
  try {
    const emails = await Email.find();
    res.json(emails);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= ADD EMAIL =================
router.post("/emails", async (req, res) => {
  try {
    const email = new Email(req.body);
    await email.save();
    res.json(email);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= DELETE ITEM + SEND MAIL =================
router.delete("/emails/:id", async (req, res) => {
  try {
    await Email.findByIdAndDelete(req.params.id);
    res.json({ message: "Email deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;