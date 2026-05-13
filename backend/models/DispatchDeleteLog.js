const mongoose = require("mongoose");

const dispatchDeleteLogSchema = new mongoose.Schema({

  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DispatchOrder"
  },

  // 🔥 LINK FIELD (IMPORTANT)
  order_reference: String,

  // useful info
  vendor_name: String,
  excel_file_name: String,

  // 🔥 REQUIRED
  reason: String,

  deletedBy: String,
  userLocations: [String],

  deletedAt: {
    type: Date,
    default: Date.now
  }

}, { timestamps: true });

module.exports = mongoose.model("DispatchDeleteLog", dispatchDeleteLogSchema);