const express = require("express");
const router = express.Router();
const ProductionReal = require("../models/ProductionReal");
const User = require("../models/User"); 
const authMiddleware = require("../middleware/authMiddleware");


router.post("/", authMiddleware, async (req, res) => {
  try {
   
    const userId = req.user.id;


    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

   
    const newEntry = new ProductionReal({
      ...req.body,
      enteredBy: user.name,
      userLocations: user.locations || [], // store locations from user
       
        enNos: req.body.enNos || [],
  productionQty: Number(req.body.productionQty) || 0,
  wastageQty: Number(req.body.wastageQty) || 0,
  blankWastage: Number(req.body.blankWastage) || 0,
  wastePercent: Number(req.body.wastePercent) || 0,

  enteredBy: user.name,
  userLocations: user.locations || [],
    });

    await newEntry.save();
    res.status(201).json({ message: "Production saved successfully" });
  } catch (error) {
    console.error("Error saving Production:", error);
    res.status(500).json({ message: "Error saving production", error });
  }
});

// GET ALL Production Real with populated references
router.get("/", authMiddleware, async (req, res) => {
  try {
    const data = await ProductionReal.find()
      .populate("machiness.activityId")
      .populate("machiness.machineId");

    res.json(data);
  } catch (error) {
    console.error("Error fetching Production Real:", error);
    res.status(500).json({ message: "Error fetching data" });
  }
});

// UPDATE Production Real and keep user locations
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const updated = await ProductionReal.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
            enNos: req.body.enNos || [],
        userLocations: user.locations || [],
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Record not found" });

    res.json({ message: "Production updated successfully", updated });
  } catch (error) {
    console.error("Error updating Production:", error);
    res.status(500).json({ message: "Error updating production", error });
  }
});

// DELETE Production Real
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deleted = await ProductionReal.findByIdAndDelete(req.params.id);

    if (!deleted) return res.status(404).json({ message: "Record not found" });

    res.json({ message: "Production deleted successfully" });
  } catch (error) {
    console.error("Error deleting Production:", error);
    res.status(500).json({ message: "Error deleting production", error });
  }
});

module.exports = router;