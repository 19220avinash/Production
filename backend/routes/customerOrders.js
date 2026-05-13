const express = require("express");
const router = express.Router();
const CustomerOrder = require("../models/CustomerOrder");
const authMiddleware = require("../middleware/authMiddleware");
const DispatchOrder = require("../models/DispatchOrder"); 
const User = require("../models/User"); // ✅ ADD THIS
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);   // ✅ original filename
  }
});

const upload = multer({ storage });
// =============================================
// CREATE CUSTOMER ORDER
// =============================================
router.post("/excel-upload", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userData = await User.findById(userId);

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    const { data, fileName } = req.body;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: "No data received" });
    }

    // 🔥 CHECK DUPLICATE FILE UPLOAD
    const existingFile = await CustomerOrder.findOne({
      excel_file_name: fileName
    });

    if (existingFile) {
      return res.status(400).json({
        message: "This Excel file has already been uploaded"
      });
    }

    const batchId = Date.now();

    const finalData = data.map(row => ({
      ...row,
      excel_file_name: fileName,
      upload_batch: batchId,
      user: userData.name,
      userLocations: userData.locations || []
    }));

    await CustomerOrder.insertMany(finalData);

    res.status(201).json({
      message: "Excel data saved successfully"
    });

  } catch (err) {
    console.error("❌ EXCEL UPLOAD ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});
router.get("/planner-ready", async (req, res) => {
  try {

    // ✅ STEP 1: get dispatched orders only
    const dispatchOrders = await DispatchOrder.find({
      pdc: "Dispatched"
    });

    const readyOrders = [];

    // ✅ STEP 2: loop dispatch orders
    for (let d of dispatchOrders) {

      // ✅ STEP 3: match condition (DO NOT CHANGE)
      const matches = await CustomerOrder.find({
        excel_file_name: new RegExp(`^${d.order_reference}(\\.xlsx)?$`, "i"),
         status: "ORDER_RECEIVED"  
      }).sort({ createdAt: -1 });

      if (matches.length === 0) continue;

      // 🔥 STEP 4: group by excel_file_name (KEY FIX)
      const grouped = {};

      matches.forEach(m => {
        const key = m.excel_file_name;

        if (!grouped[key]) {
          grouped[key] = [];
        }

        grouped[key].push(m);
      });

      // 🔥 STEP 5: push each file as separate planner order
      Object.values(grouped).forEach(group => {

        const base = group[0];

        readyOrders.push({
          garment_po_number: base.garment_po_number,
          Format: base.Format,
          vendor_name: base.vendor_name,
          desc: base.desc,
  deadline: d.deadline,   // ✅ ADD THIS
          dispatch_pdc: d.pdc,
          dispatch_order_reference: d.order_reference,

          excel_file_name: base.excel_file_name,
          userLocations: base.userLocations,

          // 🔥 full rows for UI (EAN, qty etc.)
         rows: group.map(m => ({
  ...m._doc,
  _id: m._id   // 🔥 important
})),

ids: group.map(m => m._id)   // 🔥 ADD THIS
        });

      });
    }

    // ✅ STEP 6: sort latest first (new upload on top)
    readyOrders.sort((a, b) => {
      const aTime = new Date(a.rows[0].createdAt);
      const bTime = new Date(b.rows[0].createdAt);
      return bTime - aTime;
    });

    res.json(readyOrders);

  } catch (err) {
    console.error("PLANNER ERROR:", err);
    res.status(500).json({ message: "Error fetching planner data" });
  }
});
// =============================================
// GET CUSTOMER ORDERS
// =============================================
router.get("/", authMiddleware, async (req, res) => {
  try {
const filter = {};

if (req.query.status) {
  filter.status = req.query.status;
}

const orders = await CustomerOrder.find(filter).sort({ createdAt: -1 });

    res.status(200).json(orders);

  } catch (err) {
    console.error("FETCH ERROR:", err);
    res.status(500).json({ message: "Error fetching data" });
  }
});


// =============================================
// UPDATE ORDER STATUS
// =============================================
router.patch("/:id",authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;

    const order = await CustomerOrder.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(order);

  } catch (err) {
    console.error("UPDATE STATUS ERROR:", err);
    res.status(500).json({ message: "Error updating order status" });
  }
});

// =============================================
// DELETE CUSTOMER ORDER
// =============================================
router.delete("/:id",authMiddleware, async (req, res) => {
  try {

    const order = await CustomerOrder.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order deleted successfully" });

  } catch (err) {
    console.error("DELETE ORDER ERROR:", err);
    res.status(500).json({ message: "Error deleting order" });
  }
});
// =============================================
// UPDATE CUSTOMER ORDER
// =============================================
router.put("/:id",authMiddleware, upload.single("attachment"), async (req, res) => {
  try {

  const {
  purchaseOrderNo,
    wono,
      enNo,
  poDate,
  expectedDeliveryDate ,
  productCode,
  materialType,
  description,
  customerName,

  colorFront,
  colorBack,
  wasteQty,
  jobSize,
  inkDetails,

  quantity,
  location,
  orderType,
  remarks,
  remarks2,
  user
} = req.body;
const userId = req.user.id;
const userData = await User.findById(userId);
const attachment = req.file ? req.file.filename : undefined;
  const order = await CustomerOrder.findByIdAndUpdate(
req.params.id,
{
purchaseOrderNo,
poDate,
  wono,
  enNo,
expectedDeliveryDate,
productCode,
materialType,
description,
customerName,

colorFront,
colorBack,
wasteQty,
jobSize,
inkDetails,

quantity,
location,
orderType,
remarks,
remarks2,
user,
userLocations: userData.locations || [],

...(attachment && { attachment })   // ✅ ADD THIS
},
{ new: true }
);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(order);

  } catch (err) {
    console.error("UPDATE ORDER ERROR:", err);

    if (err.code === 11000) {
      return res.status(400).json({ message: "PO Number already exists" });
    }

    res.status(500).json({ message: "Error updating order" });
  }
});

module.exports = router;