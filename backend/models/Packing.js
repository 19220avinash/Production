const mongoose = require("mongoose");

const innerPackingSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,

  },


}, { timestamps: true });

module.exports = mongoose.model("InnerPacking", innerPackingSchema);