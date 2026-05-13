const mongoose = require("mongoose");
const XLSX = require("xlsx");

mongoose.connect("mongodb://127.0.0.1:27017/RFID");

const ItemSchema = new mongoose.Schema({
  itemCode: String,
  customerName: String,
  description: String,
  materialType: String,
  wasteQty: Number,
  jobSize: String,
});

const Item = mongoose.model("Item", ItemSchema);

const workbook = XLSX.readFile("SFG Codes - Master list Manipal.xlsx");
const sheet = workbook.Sheets["console Master"];

const data = XLSX.utils.sheet_to_json(sheet);

async function importData() {
  await Item.deleteMany();

  const formatted = data.map(row => ({
    itemCode: String(row["SFG Code"]),
    customerName: row["Customer Name"],
    description: row["Description"],
    materialType: row["Material Type"],
    wasteQty: row["Waste Qty"],
    jobSize: row["Job Size"],
  }));

  await Item.insertMany(formatted);

  console.log("✅ Excel Imported Successfully");
  process.exit();
}

importData();