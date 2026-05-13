const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  itemCode: { type: String, unique: true },
  customerName: String,
  description: String,
  materialType: String,
  wasteQty: Number,
  jobSize: String,
});

module.exports = mongoose.model("Item", itemSchema);