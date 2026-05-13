const mongoose = require("mongoose");

const workOrderSchema = new mongoose.Schema(
  {
    slNo: { type: Number, required: true },
    efiWoNumber: { type: String, required: true, unique :true},
    workorder2: {
  type: String
},
productCode: {
  type: Number,   // or String (depends on your system)
  required: false
},
Item: { type: String },
    customer: {
      type: String,
      required: true,
    },
purchaseOrderNo: {
  type: String,
},
 enNo: {
  type: String,
  default: ""
},
  poDate: {        // ⭐ ADD THIS
  type: Date
},
items: [
  {
    ean: String,
    tag_qty: Number
  }
],
excel_file_name: String,
    productName: { type: String, required: true },
    location: { type: String } , // optional


    woDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expectedDeliveryDate: {
  type: Date
},

    qtyInLvs: { type: Number, required: true },

   // activities: [
 // {
  //  activityId: { type: mongoose.Schema.Types.ObjectId, ref: "ActivityMaster" },

 // }
//],

    machines: [
  {
    activityId: { type: mongoose.Schema.Types.ObjectId, ref: "ActivityMaster", required: true },
    machineId: { type: mongoose.Schema.Types.ObjectId, ref: "MachineMaster", required: true }
  }
],

      paperQty:{type:Number, required:true},
    orderQty: { type: Number, required: true },
  
    totalQty: { type: Number, required: true },
    
    totalImp: { type: Number, required: true },

    remarks: { type: String},

    planningUser: {
      type: String,
      required: true,
    },
userLocations: [
  {
    type: String,
    trim: true
  }
],
printingId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "PrintingInstruction"
},
    status: {
      type: String,
      enum: ["Order Received", "PLANNED", "IN PRODUCTION", "COMPLETED"],
      required: true,
      default: "Order Received",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WorkOrder", workOrderSchema);