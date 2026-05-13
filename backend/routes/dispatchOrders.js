const express = require("express");
const router = express.Router();
const DispatchOrder = require("../models/DispatchOrder");
const DispatchDeleteLog = require("../models/DispatchDeleteLog");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const Email = require("../models/Email");
const sendMail = require("../utils/mailer");

router.post("/upload", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const data = req.body;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: "No data received" });
    }

    // 🔥 GET FILE NAME FROM FIRST ROW
    const fileName = data[0]?.excel_file_name;

    if (!fileName) {
      return res.status(400).json({ message: "File name missing" });
    }

    // 🔥 CHECK DUPLICATE FILE
    const existing = await DispatchOrder.findOne({
      excel_file_name: fileName
    });

    if (existing) {
      return res.status(400).json({
        message: "This dispatch file is already uploaded"
      });
    }

    const finalData = data.map(row => ({
      ...row,
      user: user.name,
      userLocations: user.locations
    }));

    await DispatchOrder.insertMany(finalData);

    res.status(201).json({ message: "Dispatch data saved" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving dispatch data" });
  }
});
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Delete reason required" });
    }

    const order = await DispatchOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Dispatch order not found" });
    }

    const user = await User.findById(req.user.id);

    // ✅ Save delete log
    await DispatchDeleteLog.create({
      orderId: order._id,
      order_reference: order.order_reference,
      vendor_name: order.vendor_name,
      excel_file_name: order.excel_file_name,
      reason,
      deletedBy: user?.name || "Unknown",
      userLocations: user?.locations || []
    });

    // ✅ Delete original
    await DispatchOrder.findByIdAndDelete(req.params.id);

    // ============================
    // 🔥 SEND EMAIL
    // ============================
    const emails = await Email.find();

    const emailList = emails.map(e => e.email);

    if (emailList.length > 0) {
      await sendMail({
        to: emailList,

        subject: "🚨 Dispatch Order Deleted",

        text: `
Order Deleted

Order Ref: ${order.order_reference}
Vendor: ${order.vendor_name}
File: ${order.excel_file_name}

Deleted By: ${user?.name}
Reason: ${reason}
        `,

        // ✅ Nice HTML Email
        html: `
        <h2 style="color:red;">🚨 Dispatch Order Deleted</h2>

        <table border="1" cellpadding="8" cellspacing="0">
          <tr><td><b>Order Ref</b></td><td>${order.order_reference}</td></tr>
          <tr><td><b>Vendor</b></td><td>${order.vendor_name}</td></tr>
          <tr><td><b>File</b></td><td>${order.excel_file_name}</td></tr>
          <tr><td><b>Deleted By</b></td><td>${user?.name}</td></tr>
          <tr><td><b>Reason</b></td><td>${reason}</td></tr>
        </table>

        <br/>
        <small>This is an automated ERP notification.</small>
        `
      });
    }

    res.json({ message: "Deleted + Email Sent" });

  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ message: "Error deleting dispatch order" });
  }
});
router.get("/delete-logs/:ref", authMiddleware, async (req, res) => {
  try {

    const logs = await DispatchDeleteLog.find({
      order_reference: req.params.ref
    }).sort({ deletedAt: -1 });

    res.json(logs);

  } catch {
    res.status(500).json({ message: "Error fetching logs" });
  }
});

router.get("/", async (req, res) => {
  const data = await DispatchOrder.find().sort({ createdAt: -1 });
  res.json(data);
});

router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { total_quantity, color_code, order_reference } = req.body;  // ✅ ADD

    const updated = await DispatchOrder.findByIdAndUpdate(
      req.params.id,
      { total_quantity, color_code, order_reference },  // ✅ ADD
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Updated successfully", updated });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error updating dispatch order" });
  }
});
module.exports = router;