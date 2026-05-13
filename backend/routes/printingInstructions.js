const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer();

const PrintingInstruction = require("../models/Print");
const Item = require("../models/Item");
const Material = require("../models/Material");
const WorkOrder = require("../models/WorkOrder");

// CREATE
router.post("/", upload.none(), async (req, res) => {
  try {

    let remainingQty = 0;

    const productCode = Number(req.body.productCode);
    const woNumber = String(req.body.workorder2 || "").trim();

    // =========================
    // 🔥 MASTER ENTRY
    // =========================
    if (req.body.orderMode === "MASTER") {

      remainingQty = Number(req.body.quantity);

    } else {

      // =========================
      // 🔥 PERSOW ENTRY (NEW LOGIC)
      // =========================

      // STEP 1: find last saved entry (IMPORTANT: DO NOT SUM ALL)
      // =========================
// 🔥 PERSOW ENTRY (FIXED)
// =========================

// STEP 1: get latest PERSOW entry for this WO
const lastEntry = await PrintingInstruction.findOne({
  productCode,
  workorder2: woNumber
}).sort({ createdAt: -1 });

let previousRemaining;

// STEP 2: if exists → use it
if (lastEntry) {
  previousRemaining = lastEntry.remainingQty;
} else {

  // STEP 3: fallback → latest MASTER remaining (NOT FIRST)
  const lastMaster = await PrintingInstruction.findOne({
    productCode,
    workorder2: ""
  }).sort({ createdAt: -1 });   // ✅ FIX HERE

  previousRemaining = lastMaster
    ? lastMaster.remainingQty   // ✅ USE remainingQty (NOT quantity)
    : 0;
}

// STEP 4: calculate
remainingQty = previousRemaining - Number(req.body.quantity);

// safety
if (remainingQty < 0) remainingQty = 0;
    }

    // =========================
    // CREATE DOCUMENT
    // =========================
    const newData = new PrintingInstruction({

      productCode,

      workorder2:
        req.body.orderMode === "MASTER"
          ? ""
          : woNumber,

      materialType: req.body.materialType,
      description: req.body.description,
      customerName: req.body.customerName,

      colorFront: String(req.body.colorFront || ""),
      colorBack: String(req.body.colorBack || ""),
      wasteQty: Number(req.body.wasteQty || 0),
      jobSize: String(req.body.jobSize || ""),
      inkDetails: String(req.body.inkDetails || ""),

      quantity: Number(req.body.quantity),
      location: req.body.location,

      materialCode: req.body.materialCode,
      materialDescription: req.body.materialDescription,
      materialGsm: req.body.materialGsm,
      materialMill: req.body.materialMill,
      paperSize: req.body.paperSize,

      prefix: req.body.prefix || "",
      accountNumber: req.body.accountNumber || "",
      nonMicrDigits: req.body.nonMicrDigits || "",

      innerPackingType: req.body.innerPackingType,
      leavesPerInner: Number(req.body.leavesPerInner),
      innerPack: Number(req.body.innerPack),
      outerPack: Number(req.body.outerPack),
      innerPerOuter: Number(req.body.innerPerOuter),

      deliveryDate: req.body.deliveryDate || null,
      freightChargeType: req.body.freightChargeType || "",
      modeOfTransport: req.body.modeOfTransport || "",
      freightType: req.body.freightType || "",
      address: req.body.address || "",

      specialInstruction: req.body.specialInstruction || "",
      planningInstruction: req.body.planningInstruction || "",

      quotationRefNo: req.body.quotationRefNo || "",
      purchaseOrderNo: req.body.purchaseOrderNo || "",
      poDate: req.body.poDate || null,

      ratePerUnit: Number(req.body.ratePerUnit || 0),
      totalBillableAmount: Number(req.body.totalBillableAmount || 0),

      orderType: req.body.orderType,

      accountCode: req.body.accountCode || "",
      sortCode: req.body.sortCode || "",
      transactionCode: req.body.transactionCode || "",

      billSend: req.body.billSend || "",
      kam: req.body.kam || "",
      kamBranch: req.body.kamBranch || "",
      paymentTerms: req.body.paymentTerms || "",
      advancePayment: req.body.advancePayment || "",
      taxType: req.body.taxType || "",

      remarks: req.body.remarks || "",
      chequeFrom: req.body.chequeFrom || "",
      chequeTo: req.body.chequeTo || "",

      // 🔥 FINAL STORED VALUE
      remainingQty,
numberingRemarks: req.body.numberingRemarks || "",
packingRemarks: req.body.packingRemarks || "",
dispatchRemarks: req.body.dispatchRemarks || "",
billingRemarks: req.body.billingRemarks || "",
instructionRemarks: req.body.instructionRemarks || "",
billingType: req.body.billingType || "",
      user: req.body.user,
      userLocations: req.body.userLocations || [],
      status: "ORDER_RECEIVED",
    });

    await newData.save();

    res.status(201).json(newData);

  } catch (err) {
    console.error("SAVE ERROR FULL:", err);
    res.status(500).json({ message: err.message });
  }
});
router.get("/workorders/:productCode", async (req, res) => {
  try {
    const productCode = Number(req.params.productCode);

    const masters = await PrintingInstruction.find({ productCode });

    if (!masters.length) return res.json([]);

    const ids = masters.map(m => m._id);

    const workOrders = await WorkOrder.find({
      printingId: { $in: ids }
    }).sort({ createdAt: -1 }); // latest first

    // ✅ UNIQUE FILTER (IMPORTANT)
   const uniqueMap = new Map();

for (let wo of workOrders) {
  const key = String(wo.workorder2 || wo.efiWoNumber).trim();

  if (!uniqueMap.has(key)) {
    uniqueMap.set(key, wo);
  }
}

const uniqueWO = Array.from(uniqueMap.values());

    res.json(uniqueWO);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// 🔥 UPDATE
router.put("/:id", upload.none(), async (req, res) => {
  try {

    const updated = await PrintingInstruction.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    );

    res.json(updated);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// 🔥 AUTO-FILL API
router.get("/items/:code", async (req, res) => {
  try {

    const item = await Item.findOne({
      productCode: req.params.code
    });

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json(item);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🔥 GET ALL
router.get("/", async (req, res) => {
  try {
    const data = await PrintingInstruction.find().sort({ createdAt: -1 });

    const result = await Promise.all(
      data.map(async (item) => {
        const workOrders = await WorkOrder.find({
          printingId: item._id
        }).select("efiWoNumber workorder2");

        return {
          ...item._doc,
          workOrders
        };
      })
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.get("/remaining-by-wo/:woId", async (req, res) => {
  try {

    const wo = await WorkOrder.findById(req.params.woId);
    if (!wo) return res.json({ remainingQty: 0 });

    const master = await PrintingInstruction.findById(wo.printingId);
    if (!master) return res.json({ remainingQty: 0 });

    const woNumber = String(wo.workorder2 || wo.efiWoNumber).trim();

    // 🔥 JUST GET LAST STORED VALUE (NO CALCULATION)
    const lastEntry = await PrintingInstruction.findOne({
      productCode: master.productCode,
      workorder2: woNumber
    }).sort({ createdAt: -1 });

    const remainingQty =
      lastEntry?.remainingQty ?? master.quantity;

    res.json({ remainingQty });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// 🔥 MATERIAL FETCH (ADD THIS BACK)
router.get("/materials/:code", async (req, res) => {
  try {
    const material = await Material.findOne({
      code: req.params.code
    });

    if (!material) {
      return res.status(404).json({ message: "Material not found" });
    }

    res.json(material);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;