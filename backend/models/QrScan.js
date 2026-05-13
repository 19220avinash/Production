const mongoose = require("mongoose");

const qrScanSchema = new mongoose.Schema({
  woNo: String,
  enNo: String,
  poNo: String,
  customer: String,
  description: String,
  item: String,
  qty: Number,
  woDate: Date,

  remarks: String,
  user: String,
  stage: {
    type: String,
    enum: ["PRINTING", "BINDING", "DISPATCH"],
  },

  scannedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("QrScan", qrScanSchema);