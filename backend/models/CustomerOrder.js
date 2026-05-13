const mongoose = require("mongoose");

const customerOrderSchema = new mongoose.Schema(
{
  // 🔥 EXCEL FIELDS
  Format: String,
  garment_po_number: String,
  supplier_id: String,
  vendor_name: String,
  style_code: String,
  color: String,
  size: String,
  metsize: String,
  label_type: String,
  desc: String,
  yrmonth: String,
  mrp: Number,
  ean: String,
  article_number: String,
  tag_qty: Number,
  segment: String,
  family: String,
  class: String,
  fashion_grade: String,
  fashion_grade_desc: String,
  brand_description: String,
  tag_type: String,
  tag_size: String,
  manufacture_address: String,
  country_of_origin: String,
  usp: String,
  upload_batch: Number,   // ✅ ADD THIS

  // ✅ KEEP USER TRACKING
  user: {
    type: String,
    default: ""
  },
  excel_file_name: String,

  userLocations: [
    {
      type: String,
      trim: true
    }
  ],
 status: {
    type: String,
    enum: ["ORDER_RECEIVED", "PLANNED", "DISPATCHED"],
    default: "ORDER_RECEIVED"
  },
},
{ timestamps: true }
);

module.exports = mongoose.model("CustomerOrder", customerOrderSchema);