const mongoose = require("mongoose");

const dispatchOrderSchema = new mongoose.Schema({
  vendor_name: String,
  brand: String,
  sub_brand: String,
  order_reference: String,
  order_date: String,
  total_quantity: Number,
  remarks: String,
  color_code: String,
  order_status: String,
  pdc: String,          // IMPORTANT FIELD
  deadline:{type: String},
deletedRemark: String,
  excel_file_name: String,   // 🔥 VERY IMPORTANT
emails: [String] ,
  user: String,
  userLocations: [String]
}, { timestamps: true });

module.exports = mongoose.model("DispatchOrder", dispatchOrderSchema);