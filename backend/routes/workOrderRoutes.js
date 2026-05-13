const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path"); 
const fs = require("fs"); // ✅ ADD THIS
const upload = multer({ dest: "temp/" });
const WorkOrder = require("../models/WorkOrder");
const CustomerOrder = require("../models/CustomerOrder");
const authMiddleware = require("../middleware/authMiddleware");
const DispatchOrder = require("../models/DispatchOrder");
const QrScan = require("../models/QrScan");

// =============================================
// GET ALL WORK ORDERS
// =============================================
router.get("/", authMiddleware, async (req, res) => {
  try {
  const workOrders = await WorkOrder.find()
  .populate("customer")
  .populate("machines")
 // ✅ ADD THIS

    res.json(workOrders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// CREATE WORK ORDER
// =============================================
router.post("/create", authMiddleware, async (req, res) => {
  try {
  const {
  customerOrderId,
    printingId, // ✅ ADD
  workorder2,
   items,
  excel_file_name,
    productCode, 
  priority,
  customer,
  purchaseOrderNo,
   Item,
  poDate,
  productName,
  location,
  qtyInLvs,
  machines,
  materials,   // ✅ ADD THIS
  paperQty,
  colorFront,
  colorBack,
  orderQty,
  wasteQty,
  totalQty,
  jobSize,
  UPS,
  impFront,
  impBack,
  totalImp,
  inkDetails,
  remarks,
     wono,
     enNo   
} = req.body;
// ✅ CONVERT WONO → EFI NUMBER
if (!wono || wono.trim() === "") {
  return res.status(400).json({ message: "WO Number is required" });
}
// 🔹 Get Expected Delivery Date from Customer Order
let expectedDate = null;

if (req.body.wono) {
  const dispatch = await DispatchOrder.findOne({
    order_reference: req.body.wono
  });

if (dispatch && dispatch.deadline) {
  const parts = dispatch.deadline.split("-"); // DD-MM-YYYY

  if (parts.length === 3) {
    const day = parts[0].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    const year = parts[2];

    expectedDate = new Date(`${year}-${month}-${day}`); // ✅ FIX
  }
}
}

    // 🔢 Auto increment SL No
    const lastWorkOrder = await WorkOrder.findOne().sort({ slNo: -1 });
    const nextSlNo = lastWorkOrder ? lastWorkOrder.slNo + 1 : 1;
const ups = Number(req.body.UPS) || 1;

    // 🧮 Auto calculate total IMP  
    const totalImpression =
  (Number(req.body.UPS) || 0) *
  (Number(req.body.orderQty) || 0);

    // 🔥 AUTO GET LOGGED-IN USER NAME
   const plannerName = req.user.name;
const plannerLocations = req.user.locations || [];

 const newWorkOrder = new WorkOrder({
  slNo: nextSlNo,
efiWoNumber: wono,
  printingId, // ✅ ADD HERE
    workorder2,
     items: items || [],
  excel_file_name: excel_file_name || "",
      productCode, 
  priority,
  customer,
  purchaseOrderNo,
   Item,
  poDate,
  productName,
  location,
  qtyInLvs,
  machines,
  materials,   // ✅ THIS FIXES EVERYTHING
  paperQty,
  colorFront,
  colorBack,
  orderQty,
  wasteQty,
  totalQty,
  jobSize,
  UPS,
     enNo,
 totalImp: totalImpression,
  inkDetails,
  remarks,
  planningUser: plannerName,
  userLocations: plannerLocations,
  status: "PLANNED",
  expectedDeliveryDate: expectedDate
});

    await newWorkOrder.save();
    
 

// 🔄 Update Customer Order Status

// ✅ MULTIPLE IDS (GROUPED ORDERS)
if (req.body.customerOrderIds && req.body.customerOrderIds.length > 0) {
if (req.body.customerOrderIds && req.body.customerOrderIds.length > 0) {
  const result = await CustomerOrder.updateMany(
  { _id: { $in: req.body.customerOrderIds } },
  { $set: { status: "PLANNED" } }
);


}
}

// ✅ SINGLE ID (fallback)
else if (customerOrderId) {
  await CustomerOrder.findByIdAndUpdate(customerOrderId, {
    status: "PLANNED",
  });
}

// 🔄 ✅ ADD THIS BLOCK
if (printingId) {
  const PrintingInstruction = require("../models/Print");

  await PrintingInstruction.findByIdAndUpdate(printingId, {
    status: "PLANNED"
  });
}

    res.status(201).json(newWorkOrder);
  } catch (err) {
    console.error("CREATE WORK ORDER ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});


// =============================================
// UPDATE WORK ORDER
// =============================================
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id);

    if (!workOrder) {
      return res.status(404).json({ message: "Work Order not found" });
    }

    // 🔐 Only allow creator to edit
    if (workOrder.planningUser !== req.user.name) {
      return res.status(403).json({ message: "Not authorized to edit this work order" });
    }

    Object.assign(workOrder, req.body);

    await workOrder.save();

    res.json(workOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =============================================
// DELETE WORK ORDER
// =============================================
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const workOrder = await WorkOrder.findById(req.params.id);

    if (!workOrder) {
      return res.status(404).json({ message: "Work Order not found" });
    }

    // 🔐 Only creator can delete
    if (workOrder.planningUser !== req.user.name) {
      return res.status(403).json({ message: "Not authorized to delete this work order" });
    }

    await WorkOrder.findByIdAndDelete(req.params.id);

    res.json({ message: "Work Order deleted successfully" });

  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});
// =============================================
// MOVE FILE (UPLOAD + MOVE TO FOLDER)
// =============================================
const MACHINE_PATHS = {
  "CLS-1": "D:/CLS-1",
  "CLS-2": "D:/CLS-2",
  "CLS-3": "D:/CLS-3"
};

const machineBusy = {
  "CLS-1": false,
  "CLS-2": false,
  "CLS-3": false
};
const DONE_PATH = "D:/DONE";

router.post("/move-file", authMiddleware, upload.array("files", 10), (req, res) => {
  try {
    const machine = req.body.destination;

    // ❌ No files selected
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files selected" });
    }

    // ❌ No destination
    if (!machine || !MACHINE_PATHS[machine]) {
      return res.status(400).json({ message: "Invalid destination folder" });
    }

    // 🚫 Busy check
    if (machineBusy[machine]) {
      return res.status(400).json({
        message: `${machine} is busy, try later`
      });
    }

    machineBusy[machine] = true;

    const destinationBase = MACHINE_PATHS[machine];

    // ✅ Ensure folders exist
    fs.mkdirSync(destinationBase, { recursive: true });
    fs.mkdirSync(DONE_PATH, { recursive: true });

    const movedFiles = [];

    req.files.forEach(file => {
      const sourcePath = file.path;

      const machinePath = path.join(destinationBase, file.originalname);
      const donePath = path.join(DONE_PATH, file.originalname);

      try {
        // 🔥 STEP 1: MOVE (CUT) if same drive
        fs.renameSync(sourcePath, machinePath);

      } catch (err) {
        // 🔥 STEP 2: CROSS DRIVE → COPY + DELETE
        fs.copyFileSync(sourcePath, machinePath);
        fs.unlinkSync(sourcePath);
      }

      // 🔥 STEP 3: COPY TO DONE
      fs.copyFileSync(machinePath, donePath);

      movedFiles.push(file.originalname);
    });

    machineBusy[machine] = false;

    res.json({
      message: `✅ ${movedFiles.length} file(s) moved to ${machine} and DONE`,
      files: movedFiles
    });

  } catch (err) {
    console.error("MOVE ERROR:", err);

    if (req.body.destination) {
      machineBusy[req.body.destination] = false;
    }

    res.status(500).json({ message: err.message });
  }
});

// =============================================
// GET VALIDATED ORDER RECEIVED LIST
// =============================================
router.get("/validated-orders", authMiddleware, async (req, res) => {
  try {
    const customerOrders = await CustomerOrder.find({
      status: "ORDER_RECEIVED"
    });

    const dispatchOrders = await DispatchOrder.find();

    const validatedOrders = customerOrders.map(order => {

      // 🔍 STEP 1: MATCH DISPATCH
      const dispatchMatch = dispatchOrders.find(d =>
        d.order_reference === order.order_reference &&
        d.pdc === "Dispatched"
      );

      // 🔍 STEP 2: MATCH EXCEL NAME
      const excelMatch =
        dispatchMatch &&
        order.excel_file_name &&
        order.excel_file_name.includes(order.order_reference);

      return {
        ...order._doc,
        dispatchMatched: !!dispatchMatch,
        excelMatched: !!excelMatch,
        isValid: !!(dispatchMatch && excelMatch)
      };
    });

    res.json(validatedOrders);

  } catch (err) {
    console.error("VALIDATION ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});
// routes/workorders.js

// 🔍 GET QR DATA
router.get("/qr/:wono/:enNo", async (req, res) => {
  try {
    const { wono, enNo } = req.params;

    const wo = await WorkOrder.findOne({
      efiWoNumber: wono
    });

    if (!wo) {
      return res.status(404).json({ message: "Work Order not found" });
    }

    const item =
      wo.items?.find(i => i.ean === enNo) || {
        ean: enNo,
        tag_qty: wo.orderQty
      };

    res.json({
      poNo: wo.purchaseOrderNo,
      woNo: wo.efiWoNumber,
      customer: wo.customer,
      description: wo.productName,
      item: wo.Item,
      qty: item.tag_qty,
      ean: item.ean,
      woDate: wo.createdAt
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
// ✅ CHECK QR ALREADY SAVED FOR SAME WO + EAN + STAGE
router.get("/qr-exists/:woNo/:enNo/:stage", authMiddleware, async (req, res) => {
  try {
    const { woNo, enNo, stage } = req.params;

    const exists = await QrScan.exists({
      woNo,
      enNo,
      stage
    });

    res.json({ exists: !!exists });
  } catch (err) {
    console.error("QR EXISTS CHECK ERROR:", err);
    res.status(500).json({ message: "Error checking QR scan" });
  }
});

router.post("/qr-save", authMiddleware, async (req, res) => {
  try {
    const {
      woNo,
      enNo,
      poNo,
      customer,
      description,
      item,
      qty,
      woDate,
      remarks,
      stage
    } = req.body;

    if (!woNo || !enNo || !stage) {
      return res.status(400).json({
        message: "WO No, EAN No and Stage are required"
      });
    }

    // ✅ DB duplicate validation
    const alreadyExists = await QrScan.exists({
      woNo,
      enNo,
      stage
    });

    if (alreadyExists) {
      return res.status(409).json({
        message: `This QR is already saved for ${stage}`
      });
    }

    const userName = req.user.name;

    const newScan = new QrScan({
      woNo,
      enNo,
      poNo,
      customer,
      description,
      item,
      qty,
      woDate,
      remarks,
      stage,
      user: userName
    });

    await newScan.save();

    res.json({ message: "Saved successfully ✅" });
  } catch (err) {
    console.error("QR SAVE ERROR:", err);
    res.status(500).json({ message: "Error saving ❌" });
  }
});


module.exports = router;