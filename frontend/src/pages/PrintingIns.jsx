import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Select from "react-select";
import axios from "axios";
import BASE_URL from "../config/api";

function PrintingIns() {

  const [errors, setErrors] = useState({});
  const [locations, setLocations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderMode, setOrderMode] = useState("MASTER");
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [innerPackingList, setInnerPackingList] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState("");
  const [transportList, setTransportList] = useState([]);
  const [woList, setWoList] = useState([]);
  const [expandedCell, setExpandedCell] = useState(null);
const [selectedWO, setSelectedWO] = useState(null);
const [baseRemaining, setBaseRemaining] = useState(0);
const [liveRemaining, setLiveRemaining] = useState(0);
const [freightChargeList, setFreightChargeList] = useState([]);
const [freightTypeList, setFreightTypeList] = useState([]);
const [filters, setFilters] = useState({
  wo: "",
    subWo: "",   
  customer: "",
  productCode: ""
});
const [form, setForm] = useState({
  productCode: "",
  materialType: "",
  description: "",
  customerName: "",
workorder2: "",
  colorFront: "",
  colorBack: "",
  wasteQty: 0,
  jobSize: "",
  inkDetails: "",

  materialCode: "",
materialDescription: "",
materialGsm: "",
materialMill: "",
paperSize: "",
innerPackingType: "",
leavesPerInner: "",
innerPack: "",
outerPack: "",
innerPerOuter: "",
 deliveryDate: "",
freightChargeType: "",
modeOfTransport: "",
freightType: "",
address: "",
prefix: "",
accountNumber: "",
nonMicrDigits: "",
  quantity: "",
  location: "",
  specialInstruction: "",
planningInstruction: "",
billingType: "",
quotationRefNo: "",

purchaseOrderNo: "",
poDate: "",

ratePerUnit: "",
totalBillableAmount: "",
accountCode: "",
sortCode: "",
transactionCode: "",
billSend: "",
kam: "",
kamBranch: "",
paymentTerms: "",
advancePayment: "",
taxType: "",
chequeFrom: "",
chequeTo: "",
  orderType: "Inhouse",
  remarks: "",
  numberingRemarks: "",
packingRemarks: "",
dispatchRemarks: "",
billingRemarks: "",
instructionRemarks: "",
});
  // ✅ Get logged user
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      setLoggedInUser(decoded.name || decoded.username);
    }
  }, []);

 useEffect(() => {
  fetchLocations();
  fetchOrders();
  fetchInnerPacking();

  // ✅ NEW
  fetchTransport();
  fetchFreightMasters();

}, []);

const truncateText = (text, maxLength = 20) => {
  if (!text) return "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};
const thStyle = {
  padding: "10px",
  fontFamily: "bold 14px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  fontWeight: "600",
  fontSize: "13px",
  color: "#030303",
  whiteSpace: "nowrap",
  borderBottom: "2px solid #dee2e6",
  background: "linear-gradient(to right, #acaaaad2, #aba8a8cb)"
};

useEffect(() => {
  const filtered = orders.filter((order) => {
    const woMatch = filters.wo
  ? order.workOrders?.some((wo) => {

      let woValue = "";

      if (!wo.workorder2 || wo.workorder2 === "") {
        woValue = wo.efiWoNumber;
      } else if (Number(wo.workorder2) < Number(wo.efiWoNumber)) {
        woValue = wo.workorder2;
      } else {
        woValue = wo.efiWoNumber;
      }

      return woValue
        ?.toString()
        .toLowerCase()
        .includes(filters.wo.toLowerCase());
    })
  : true;

const subWoMatch = filters.subWo
  ? order.workOrders?.some((wo) => {

      let subWoValue = "";

      // ✅ SAME LOGIC AS TABLE
      if (!wo.workorder2 || wo.workorder2 === "") {
        subWoValue = ""; // master case → no sub wo
      } else if (Number(wo.workorder2) < Number(wo.efiWoNumber)) {
        subWoValue = wo.efiWoNumber;
      } else {
        subWoValue = wo.workorder2;
      }

      return subWoValue
        ?.toString()
        .toLowerCase()
        .includes(filters.subWo.toLowerCase());
    })
  : true;

    const customerMatch = filters.customer
  ? order.customerName === filters.customer
  : true;

    const productMatch = order.productCode
      ?.toString()
      .toLowerCase()
      .includes(filters.productCode.toLowerCase());

    return woMatch && subWoMatch && customerMatch && productMatch;
  });

  setFilteredOrders(filtered);
}, [filters, orders]);

const customerOptions = [
  ...new Set(orders.map(o => o.customerName).filter(Boolean))
];

  const fetchLocations = async () => {
    const res = await axios.get(`${BASE_URL}/api/master/locations`);
    setLocations(res.data);
  };
  const fetchInnerPacking = async () => {
  try {
    const res = await axios.get(
      `${BASE_URL}/api/master/inner-packing`
    );
    setInnerPackingList(res.data);
  } catch (err) {
    console.log("Error fetching inner packing");
  }
};
const fetchTransport = async () => {
  const res = await axios.get(`${BASE_URL}/api/master/transportations`);
  setTransportList(res.data);
};

const fetchFreightMasters = async () => {
  const [charge, type] = await Promise.all([
    axios.get(`${BASE_URL}/api/master/freight-charge-types`),
    axios.get(`${BASE_URL}/api/master/freight-types`)
  ]);

  setFreightChargeList(charge.data);
  setFreightTypeList(type.data);
};

  const fetchMaterialDetails = async (code) => {
  if (!code) return;

  try {
    const res = await axios.get(
      `${BASE_URL}/api/printing-instructions/materials/${code}`
    );

    setForm(prev => ({
      ...prev,
      materialCode: res.data.code || "",
      materialDescription: res.data.description || "",
      materialGsm: res.data.gsm || "",
      materialMill: res.data.mill || "",
      paperSize: res.data.paperSize || ""
    }));

  } catch (err) {
    console.log("Material not found");
  }
};
// useEffect(() => {
//   if (!form.productCode) return;

//   fetchRemainingQty(form.productCode);

//   if (orderMode === "PERSOW") {
//     fetchWOList(form.productCode);
//   }

// }, [form.productCode, orderMode]);   // ✅ FIX

useEffect(() => {
  if (!showBankDetails) {
    setForm(prev => ({
      ...prev,
      prefix: "",
      accountNumber: "",
      nonMicrDigits: "",
      accountCode: "",
      sortCode: "",
      transactionCode: ""
    }));
  }
}, [showBankDetails]);

useEffect(() => {
  if (orderMode === "MASTER") {
   setSelectedWO(null);
    setLiveRemaining(0);

    setForm(prev => ({
  ...prev,
  workorder2: ""
}));

setLiveRemaining(0);
  }
}, [orderMode]);


const fetchWOList = async (code) => {
  try {
    const res = await axios.get(
      `${BASE_URL}/api/printing-instructions/workorders/${code}`
    );

    const data = res.data;
    setWoList(data);

   if (!data || data.length === 0) {
  // ✅ DO NOT TOUCH remaining
  return;
}
  } catch (err) {
    console.log("WO fetch error", err);
  }
};

  const fetchOrders = async () => {
    const res = await axios.get(`${BASE_URL}/api/printing-instructions`);
    setOrders(res.data);
    setFilteredOrders(res.data);
  };

  const fetchInnerPackingDetails = async (type) => {
  if (!type) return;

  try {
    const res = await axios.get(
      `${BASE_URL}/api/master/inner-packing/${type}`
    );

    setForm(prev => ({
      ...prev,
      innerPackingType: res.data.type,
    }));

  } catch {
    console.log("Not found");
  }
};
const fetchRemainingQty = async (code) => {
  if (!code) return;

  try {
    const res = await axios.get(
      `${BASE_URL}/api/printing-instructions/remaining/${code}`
    );

    const remaining = Number(res.data.remainingQty || 0);
    setBaseRemaining(remaining);   // ✅ ADD
setLiveRemaining(remaining);   // keep
  } catch (err) {
    console.log("Remaining fetch error");
  }
};

  // 🔥 AUTO-FETCH PRODUCT DETAILS
  const fetchProductDetails = async (code) => {
    if (!code) return;

    try {
      const res = await axios.get(
        `${BASE_URL}/api/master/items/${code}`
      );

     setForm(prev => ({
  ...prev,
  materialType: res.data.materialType || "",
  description: res.data.description || "",
  customerName: res.data.customerName || "",


  // ✅ FORCE STRING
  colorFront: String(res.data.colorFront || ""),
  colorBack: String(res.data.colorBack || ""),
  wasteQty: Number(res.data.wasteQty || 0),
  jobSize: res.data.jobSize || "",
  inkDetails: res.data.inkDetails || ""
}));

    } catch (err) {
      setForm(prev => ({
        ...prev,
        materialType: "",
        description: "",
        customerName: ""
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setErrors(prev => ({ ...prev, [name]: "" }));

    setForm(prev => ({
      ...prev,
      [name]: value
    }));
if (name === "innerPackingType") {
  fetchInnerPackingDetails(value);
}

if (name === "quantity" && orderMode === "PERSOW") {

  // 🔥 HANDLE BACKSPACE
  if (value === "") {
    setForm(prev => ({
      ...prev,
      quantity: ""
    }));

    setLiveRemaining(baseRemaining);
    return;
  }

  const enteredQty = Number(value);
  const originalRemaining = Number(baseRemaining || 0);  // ✅ FIX

  if (enteredQty > originalRemaining) {
    Swal.fire("Error", "Qty cannot be greater than remaining", "error");
    return;
  }

  const updatedRemaining = originalRemaining - enteredQty;

  setForm(prev => ({
    ...prev,
    quantity: value
  }));

  setLiveRemaining(updatedRemaining);

  return;
}

// ✅ LEAVES
if (name === "leavesPerInner") {
  const qty = form.quantity;
  const leaves = value;

  let inner = "";

  if (qty && leaves && Number(leaves) !== 0) {
    inner = Math.ceil(Number(qty) / Number(leaves));
  }

  setForm(prev => ({
    ...prev,
    leavesPerInner: value,
    innerPack: inner
  }));

  return;
}

// ✅ PRODUCT CODE
if (name === "productCode") {

  // 🔥 RESET OLD DATA
  setSelectedWO(null); 
  setLiveRemaining(0);  

  setForm(prev => ({
    ...prev,
    productCode: value,
    workorder2: "",
    colorFront: "",
    colorBack: ""
  }));
  fetchProductDetails(value);

  fetchRemainingQty(value);

// ✅ ADD THESE 2 LINES (ONLY FIX)
if (orderMode === "PERSOW") {
  fetchWOList(value);
}

  return;
}
// ✅ MATERIAL
if (name === "materialCode") {
  fetchMaterialDetails(value);
}
  };

  const validateForm = () => {
    let newErrors = {};

    if (!form.productCode) newErrors.productCode = "Required";
    if (!form.quantity) newErrors.quantity = "Required";
  
    if (!form.location) newErrors.location = "Required";
    if (!form.orderType) newErrors.orderType = "Required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  if (saving) {
    console.log("Blocked duplicate click");
    return;
  }
 if (orderMode === "PERSOW") {
  if (!selectedWO) {
    Swal.fire("Error", "Please select WO", "error");
    setSaving(false);
    return;
  }

  if (Number(form.quantity) > Number(baseRemaining))  {
    Swal.fire("Error", "Quantity exceeds remaining qty", "error");
    setSaving(false);
    return;
  }
}

  setSaving(true); // move this BEFORE validation

  if (!validateForm()) {
    setSaving(false);
    return;
  }

  try {
      if (orderMode === "MASTER") {
    form.workorder2 = "";
  }
const token = localStorage.getItem("token");
const decoded = jwtDecode(token);   
const data = {
  ...form,
  orderMode,
  user: loggedInUser,
    userLocations: decoded.locations || [],
  workorder2: orderMode === "MASTER" ? "" : (form.workorder2 || "")
};

    if (editingId) {
      await axios.put(`${BASE_URL}/api/printing-instructions/${editingId}`, data);
    } else {
      await axios.post(`${BASE_URL}/api/printing-instructions`, data);
    }

    Swal.fire("Success", "Saved Successfully", "success");

// ✅ SAFE REFRESH (SEPARATE TRY)
try {
  await fetchRemainingQty(form.productCode);

  if (selectedWO) {
    const res = await axios.get(
      `${BASE_URL}/api/printing-instructions/remaining-by-wo/${selectedWO.value}`
    );

    const remaining = Number(res.data.remainingQty || 0);

    setBaseRemaining(remaining);
    setLiveRemaining(remaining);
  }

} catch (refreshErr) {
  console.log("Refresh error ignored", refreshErr);
}
    fetchOrders();
    // reset form
    setForm({
      productCode: "",
      materialType: "",
      description: "",
      customerName: "",
      colorFront: "",
      colorBack: "",
      wasteQty: 0,
      jobSize: "",
      inkDetails: "",
      materialCode: "",
      materialDescription: "",
      materialGsm: "",
      materialMill: "",
      paperSize: "",
      innerPackingType: "",
      leavesPerInner: "",
      innerPack: "",
      outerPack: "",
      innerPerOuter: "",
      prefix: "",
      accountNumber: "",
      nonMicrDigits: "",
      quantity: "",
      location: "",
      deliveryDate: "",
      freightType: "",
      address: "",
      specialInstruction: "",
      planningInstruction: "",
      quotationRefNo: "",
      purchaseOrderNo: "",
      poDate: "",
      ratePerUnit: "",
      totalBillableAmount: "",
      freightChargeType: "",
      modeOfTransport: "",
      accountCode: "",
sortCode: "",
transactionCode: "",
billSend: "",
kam: "",
kamBranch: "",
paymentTerms: "",
advancePayment: "",
taxType: "",
chequeFrom: "",
chequeTo: "",
billingType: "",
numberingRemarks:"",
packingRemarks:"",
billingRemarks:"",
instructionRemarks:"",
dispatchRemarks:"",
      orderType: "Inhouse",
      remarks: ""
    });

    setEditingId(null);

  } catch (err) {
    Swal.fire("Error", "Save failed", "error");
  } finally {
    setSaving(false); // 🔓 unlock
  }
};


  const handleEdit = (order) => {
    setEditingId(order._id);

    setForm({
      productCode: order.productCode,
      materialType: order.materialType || "",
      description: order.description || "",
      customerName: order.customerName || "",
      jobSize: order.jobSize || "",
      quantity: order.quantity,
      materialCode: order.materialCode || "",
materialDescription: order.materialDescription || "",
materialGsm: order.materialGsm || "",
materialMill: order.materialMill || "",
paperSize: order.paperSize || "",
      prefix: order.prefix || "",
      accountNumber: order.accountNumber || "",
      nonMicrDigits: order.nonMicrDigits || "",
      colorFront: order.colorFront || "",
      colorBack: order.colorBack || "",
specialInstruction: order.specialInstruction || "",
planningInstruction: order.planningInstruction || "",
quotationRefNo: order.quotationRefNo || "",
purchaseOrderNo: order.purchaseOrderNo || "",
poDate: order.poDate?.substring(0,10) || "",
ratePerUnit: order.ratePerUnit || "",
totalBillableAmount: order.totalBillableAmount || "",
deliveryDate: order.deliveryDate?.substring(0,10) || "",
address: order.address || "",
freightChargeType: order.freightChargeType || "",
modeOfTransport: order.modeOfTransport || "",
freightType: order.freightType || "",
innerPackingType: order.innerPackingType || "",
leavesPerInner: order.leavesPerInner || "",
innerPack: order.innerPack || "",
outerPack: order.outerPack || "",
innerPerOuter: order.innerPerOuter || "",
      location: order.location,
      orderType: order.orderType,
      accountCode: order.accountCode || "",
sortCode: order.sortCode || "",
transactionCode: order.transactionCode || "",
billSend: order.billSend || "",
kam: order.kam || "",
kamBranch: order.kamBranch || "",
paymentTerms: order.paymentTerms || "",
advancePayment: order.advancePayment || "",
taxType: order.taxType || "",
chequeFrom: order.chequeFrom || "",
chequeTo: order.chequeTo || "",
billingType: order.billingType || "",
      remarks: order.remarks
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    await axios.delete(`${BASE_URL}/api/printing-instructions/${id}`);
    fetchOrders();
  };

  const exportToExcel = () => {
    const data = filteredOrders.map(order => ({
      "Product Code": order.productCode,
      "Material": order.materialType,
      "Description": order.description,
      "Customer": order.customerName,
      "Color Front": order.colorFront,
      "Color Back": order.colorBack,
        "Material Code": order.materialCode,
"Material Desc": order.materialDescription,
"Material GSM": order.materialGsm,
"Material Mill": order.materialMill,
"Paper Size": order.paperSize,
"Order Type": order.orderType,
"Location": order.location,
"Quantity": order.quantity,
"Job Size": order.jobSize,
"Prefix": order.prefix,
"Account Number": order.accountNumber,
"Non MICR Digits": order.nonMicrDigits,
"Transport Mode": order.modeOfTransport,
"Freight Charge Type": order.freightChargeType,
"Freight Type": order.freightType,
"Address": order.address,
"Special Instruction": order.specialInstruction,
"Bill To": order.planningInstruction,
"Bill Send": order.billSend,
"Quotation Ref No": order.quotationRefNo,
      "Remarks": order.remarks,
      "User": order.user
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Printing Instructions");

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer]), "PrintingInstructions.xlsx");
  };

const viewPDF = () => {
  const doc = new jsPDF("p", "mm", "a4");

  // 🔥 Use filtered data OR fallback to all
  const data = filteredOrders.length ? filteredOrders : orders;

  data.forEach((order, index) => {

    if (index !== 0) doc.addPage(); // one page per record

    const PAGE_HEIGHT = 280;
    let y = 12;

   const compactStyle = {
  theme: "grid",
  styles: {
    fontSize: 8,
    cellPadding: 1.2,
    overflow: "linebreak",

    // ✅ ADD THESE
    lineColor: [0, 0, 0],   // black borders
    lineWidth: 0.2          // thickness
  },
  headStyles: {
    fillColor: false,
    textColor: [0, 0, 0],
    fontStyle: "bold",

    // ✅ header border
    lineColor: [0, 0, 0],
    lineWidth: 0.3
  }
};

    doc.setFontSize(12);
    doc.text("MPI", 105, 5, { align: "center" });
    y+=4;
    doc.text("Printing Instruction", 105, 10, { align: "center" });

    const addSection = (title, dataRows) => {
      if (y > PAGE_HEIGHT - 20) return;

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(title, 10, y);

      y += 2;

      autoTable(doc, {
        ...compactStyle,
        startY: y,
        body: dataRows,
        margin: { left: 10, right: 10 }
      });

      y = doc.lastAutoTable.finalY + 2;
    };

    // 🔥 SAME layout you already built
    addSection("PRODUCT", [
      ["Code", order.productCode, "Customer", order.customerName],
      ["Desc", order.description, "Qty", order.quantity],
      ["Job Size", order.jobSize, "Color", `${order.colorFront}/${order.colorBack}`]
    ]);
    y += 4;
    addSection("MATERIAL", [
      ["Code", order.materialCode, "GSM", order.materialGsm],
      ["Desc", order.materialDescription, "Mill", order.materialMill],
      ["Paper", order.paperSize, "", ""]
    ]);
    y += 4;
    addSection("PACKING", [
      ["Inner", order.innerPackingType, "Leaves", order.leavesPerInner],
      ["Inner Pack", order.innerPack, "Outer", order.outerPack],
      ["Inner/Outer", order.innerPerOuter, "", ""],
       ["Remarks", order.packingRemarks || "", "", ""]
    ]);
  y += 4;
    addSection("DISPATCH", [
      ["Date", order.deliveryDate?.substring(0,10), "Transport", order.modeOfTransport],
      ["Freight", order.freightChargeType, "Type", order.freightType],
      ["Address", order.address, "", ""],
      ["Remarks", order.dispatchRemarks || "", "", ""]
    ]);
    y += 4;
    addSection("BILLING", [
      ["Quotation", order.quotationRefNo, "PO", order.purchaseOrderNo],
      ["PO Date", order.poDate?.substring(0,10), "Rate", order.ratePerUnit],
      ["Total", order.totalBillableAmount, "Bill To", order.planningInstruction],
      ["Bill Send", order.billSend, "", ""],
      ["Remarks", order.billingRemarks || "", "", ""]
    ]);
 y += 4;
  if (order.accountNumber) {
  addSection("BANK", [
    ["Prefix", order.prefix, "Account", order.accountNumber],
    ["MICR", order.sortCode, "Code", order.accountCode],
    ["Txn", order.transactionCode, "Non MICR", order.nonMicrDigits],

    // ✅ FIXED (separate fields)
    ["Cheque From", order.chequeFrom, "Cheque To", order.chequeTo],
     ["Remarks", order.numberingRemarks || "", "", ""]
  ]);
}
 y += 4;
  addSection("INSTRUCTIONS", [
  ["KAM", order.kam, "Branch", order.kamBranch],
  ["Payment", order.paymentTerms, "Advance", order.advancePayment],
  ["Tax", order.taxType, "", ""],
  ["Special", order.specialInstruction, "", ""],
  ["Remarks", order.instructionRemarks || "", "", ""]
]);

    doc.setFontSize(7);
    doc.text(`Generated by: ${order.user}`, 10, 285);
  });

  doc.save(`Printing.pdf`);
};
  return (
    <div className="container mt-4">

<h3 className="fw-bold text-primary text-center mb-4">
  <i className="bi bi-printer-fill me-2"></i>
  Printing Instruction Entry
</h3>
      <form onSubmit={handleSubmit}>
<div className="d-flex justify-content-center mb-3">
  <div className="form-check me-4">
    <input
      type="radio"
      className="form-check-input border-dark"
      name="orderMode"
      value="MASTER"
      checked={orderMode === "MASTER"}
      onChange={(e) => setOrderMode(e.target.value)}
    />
    <label className="form-check-label fw-bold">Master</label>
  </div>

  <div className="form-check">
    <input
      type="radio"
      className="form-check-input border-dark"
      name="orderMode"
      value="PERSOW"
      checked={orderMode === "PERSOW"}
      onChange={(e) => setOrderMode(e.target.value)}
    />
    <label className="form-check-label fw-bold">Persow</label>
  </div>
</div>
        <div className="card shadow-lg border-0 mb-4">
      <div className="row g-3">

  {/* Product Code */}
  <div className="col-md-2">
    <label className="fw-semibold text-black">
      <i className="bi bi-upc-scan me-1 text-primary"></i> Product Code
    </label>
    <input
      type="number"
      name="productCode"
      className="form-control border-dark"
      value={form.productCode}
      onChange={handleChange}
    />
  </div>

  {/* Material */}
  <div className="col-md-2">
    <label className="fw-semibold text-black">
      <i className="bi bi-box-seam me-1 text-primary"></i> Material
    </label>
    <input
      className="form-control bg-light border-dark"
      value={form.materialType}
      readOnly
    />
  </div>

  {/* Description */}
  <div className="col-md-3">
    <label className="fw-semibold text-black">
      <i className="bi bi-card-text me-1 text-primary"></i> Description
    </label>
    <input
      className="form-control bg-light border-dark"
      value={form.description}
      readOnly
    />
  </div>

  {/* Customer */}
  <div className="col-md-2">
    <label className="fw-semibold text-black">
      <i className="bi bi-person me-1 text-primary"></i> Customer
    </label>
    <input
      className="form-control bg-light border-dark"
      value={form.customerName}
      readOnly
    />
  </div>

  {/* Job Size */}
  <div className="col-md-2">
    <label className="fw-semibold text-black">
      <i className="bi bi-aspect-ratio me-1 text-primary"></i> Job Size
    </label>
    <input
      name="jobSize"
      className="form-control bg-light border-dark"
      value={form.jobSize}
      readOnly
    />
  </div>

  {/* Color Front */}
  <div className="col-md-2">
    <label className="fw-semibold text-black">
      <i className="bi bi-palette me-1 text-primary"></i> Color Front
    </label>
    <input className="form-control bg-light border-dark" value={form.colorFront} readOnly />
  </div>

  {/* Color Back */}
  <div className="col-md-2">
    <label className="fw-semibold text-black">
      <i className="bi bi-palette-fill me-1 text-primary"></i> Color Back
    </label>
    <input className="form-control bg-light border-dark" value={form.colorBack} readOnly />
  </div>

  {/* Material Code */}
 {orderMode === "MASTER" && (
  <>
    {/* Material Code */}
    <div className="col-md-2">
      <label className="fw-semibold text-black">Material Code</label>
      <input
        name="materialCode"
        className="form-control border-dark"
        value={form.materialCode}
        onChange={handleChange}
      />
    </div>

    {/* Material Desc */}
    <div className="col-md-3">
      <label className="fw-semibold text-black">Material Desc</label>
      <input
        className="form-control bg-light border-dark"
        value={form.materialDescription}
        readOnly
      />
    </div>

    {/* GSM */}
    <div className="col-md-2">
      <label className="fw-semibold text-black">GSM</label>
      <input
        className="form-control bg-light border-dark"
        value={form.materialGsm}
        readOnly
      />
    </div>

    {/* Mill */}
    <div className="col-md-2">
      <label className="fw-semibold text-black">Mill</label>
      <input
        className="form-control bg-light border-dark"
        value={form.materialMill}
        readOnly
      />
    </div>

    {/* Paper Size */}
    <div className="col-md-2">
      <label className="fw-semibold text-black">Paper Size</label>
      <input
        className="form-control bg-light border-dark"
        value={form.paperSize}
        readOnly
      />
    </div>
  </>
)}
  {/* Order Type */}
  <div className="col-md-2">
    <label className="fw-semibold text-black">
      <i className="bi bi-tag me-1 text-primary"></i> Order Type
    </label>
    <input className="form-control bg-light border-dark" value="Inhouse" readOnly />
  </div>

  {/* Quantity */}
  <div className="col-md-2">
    <label className="fw-semibold text-black">
      <i className="bi bi-123 me-1 text-primary"></i> Quantity
    </label>
    <input
      type="number"
      name="quantity"
      className="form-control border-dark"
       disabled={orderMode === "PERSOW" && !selectedWO}
      value={form.quantity}
      onChange={handleChange}
    />
  </div>
  {orderMode === "PERSOW" && (
  <div className="col-md-2">
    <label className="fw-semibold text-black">
      Remaining Qty
    </label>
    <input
      className="form-control bg-light border-dark"
   value={liveRemaining}
      readOnly
    />
  </div>
)}
{orderMode === "PERSOW" && (
  <div className="col-md-3">
    <label className="fw-semibold text-black">Select WO</label>

  <Select
  value={selectedWO}   // ✅ ADD THIS LINE
  options={woList.map(wo => ({
    value: wo._id,
    label: `WO: ${wo.workorder2 || wo.efiWoNumber}`
  }))}
onChange={async (selected) => {
  if (!selected) return;

  const selectedData = woList.find(w => w._id === selected.value);

  const exactOption = woList.map(wo => ({
    value: wo._id,
    label: `WO: ${wo.workorder2 || wo.efiWoNumber}`
  })).find(opt => opt.value === selected.value);

  setSelectedWO(exactOption);

  setForm(prev => ({
    ...prev,
    workorder2: selectedData.workorder2 || selectedData.efiWoNumber
  }));

  const res = await axios.get(
    `${BASE_URL}/api/printing-instructions/remaining-by-wo/${selected.value}`
  );

  const remaining = Number(res.data.remainingQty || 0);

  setBaseRemaining(remaining);
  setLiveRemaining(remaining);
}}
/>
  </div>
)}

  {/* Location */}
  <div className="col-md-2">
    <label className="fw-semibold text-black">
      <i className="bi bi-geo-alt me-1 text-primary"></i> Location
    </label>
    <select
      name="location"
      className="form-control border-dark"
      value={form.location}
      onChange={handleChange}
    >
      <option value="">Select</option>
      {locations.map(loc => (
        <option key={loc._id} value={loc.locationName}>
          {loc.locationName}
        </option>
      ))}
    </select>
  </div>

  {/* Remarks */}
  <div className="col-md-4">
    <label className="fw-semibold text-black">
      <i className="bi bi-chat-left-text me-1 text-primary"></i> Remarks
    </label>
    <textarea
      name="remarks"
      className="form-control border-dark"
      value={form.remarks}
      onChange={handleChange}
    />
  </div>
</div>
</div>


       <div className="col-12 mt-5">
  <h5 className="fw-bold text-primary text-center mb-3">
    <i className="bi bi-hash me-2 "></i>
    Numbering Details
  </h5>
</div>
 
<div className="col-md-3 d-flex align-items-center mt-2">
  <input
    type="checkbox"
    checked={showBankDetails}
    onChange={(e) => setShowBankDetails(e.target.checked)}
    className="form-check-input me-2 border-dark"
  />
  <label className="form-check-label fw-semibold text-black">
    Show Details
  </label>
</div>


{showBankDetails && (
  <>
    <div className="card shadow-lg border-0 mb-4">
       <div className="row g-3">
    <div className="col-md-2">
      <label className="fw-semibold text-black">
        <i className="bi bi-type me-1 text-primary"></i> Prefix
      </label>
      <input
        name="prefix"
        className="form-control border-dark"
        value={form.prefix}
        onChange={handleChange}
      />
    </div>

    <div className="col-md-2">
      <label className="fw-semibold text-black">
        <i className="bi bi-credit-card me-1 text-primary"></i> Account Number
      </label>
      <input
        name="accountNumber"
        className="form-control border-dark"
        value={form.accountNumber}
        onChange={handleChange}
      />
    </div>

    <div className="col-md-2">
      <label className="fw-semibold text-black">
        <i className="bi bi-123 me-1 text-primary"></i> Cheque From
      </label>
      <input
        type="text"
        name="chequeFrom"
        className="form-control border-dark"
        value={form.chequeFrom}
        onChange={handleChange}
      />
    </div>

    <div className="col-md-2">
      <label className="fw-semibold text-black">
        <i className="bi bi-123 me-1 text-primary"></i> Cheque To
      </label>
      <input
        type="text"
        name="chequeTo"
        className="form-control border-dark"
        value={form.chequeTo}
        onChange={handleChange}
      />
    </div>

    <div className="col-md-2">
      <label className="fw-semibold text-black">
        <i className="bi bi-upc me-1 text-primary"></i> Non MICR Digits
      </label>
      <input
        name="nonMicrDigits"
        className="form-control border-dark"
        value={form.nonMicrDigits}
        onChange={handleChange}
      />
    </div>

    <div className="col-md-2">
      <label className="fw-semibold text-black">
        <i className="bi bi-code me-1 text-primary"></i> Account Code
      </label>
      <input
        name="accountCode"
        className="form-control border-dark"
        value={form.accountCode}
        onChange={handleChange}
      />
    </div>

    <div className="col-md-2">
      <label className="fw-semibold text-black">
        <i className="bi bi-qr-code me-1 text-primary"></i> Sort Code / MICR
      </label>
      <input
        name="sortCode"
        className="form-control border-dark"
        value={form.sortCode}
        onChange={handleChange}
      />
    </div>

    <div className="col-md-2">
      <label className="fw-semibold text-black">
        <i className="bi bi-arrow-left-right me-1 text-primary"></i> Transition Code
      </label>
      <input
        name="transactionCode"
        className="form-control border-dark"
        value={form.transactionCode}
        onChange={handleChange}
      />
    </div>
    <div className="col-md-4">
  <label className="fw-semibold text-black">Remarks</label>
  <textarea
    name="numberingRemarks"
    className="form-control border-dark"
    value={form.numberingRemarks}
    onChange={handleChange}
  />
</div>
    </div>
    </div>
  </>
  
)}

<div className="col-12 mt-5">
  <h5 className="fw-bold text-primary text-center mb-3">
      <i className="bi bi-boxes me-2 text-primary"></i>
    Packing Standard
  </h5>
</div>
 <div className="card shadow-lg border-0 mb-4">
<div className="row g-1">
<div className="col-md-2">
  <label className="fw-semibold text-black">
    <i className="bi bi-box-seam me-1 text-primary"></i> Type of Inner Packing
  </label>
  <select
    name="innerPackingType"
    className="form-control border-dark"
    value={form.innerPackingType}
    onChange={handleChange}
  >
    <option value="">Select</option>
    {innerPackingList.map(item => (
      <option key={item._id} value={item.type}>
        {item.type}
      </option>
    ))}
  </select>
</div>

<div className="col-md-2">
  <label className="fw-semibold text-black">
    <i className="bi bi-layers me-1 text-primary"></i> No.of Leaves per Inner Pack
  </label>
  <input
    type="number"
    name="leavesPerInner"
    className="form-control bg-light border-dark"
    value={form.leavesPerInner}
    onChange={handleChange}
  />
</div>

<div className="col-md-2">
  <label className="fw-semibold text-black">
    <i className="bi bi-box me-1 text-primary"></i> No. of Inner Pack
  </label>
  <input
    className="form-control bg-light border-dark"
    value={form.innerPack}
    readOnly
  />
</div>

<div className="col-md-2">
  <label className="fw-semibold text-black">
    <i className="bi bi-archive me-1 text-primary"></i> No. of Outer Pack
  </label>
  <input
    type="number"
    name="outerPack"
    className="form-control bg-light border-dark"
    value={form.outerPack}
    onChange={handleChange}
  />
</div>

<div className="col-md-3">
  <label className="fw-semibold text-black">
    <i className="bi bi-diagram-3 me-1 text-primary"></i> No. of Inner Pack per Outer Pack
  </label>
  <input
    type="number"
    name="innerPerOuter"
    className="form-control bg-light border-dark"
    value={form.innerPerOuter}
    onChange={handleChange}
  />
</div>
<div className="col-md-4">
  <label className="fw-semibold text-black">Remarks</label>
  <textarea
    name="packingRemarks"
    className="form-control border-dark"
    value={form.packingRemarks}
    onChange={handleChange}
  />
</div>
</div>
</div>

<div className="col-12 mt-5">
  <h5 className="fw-bold text-primary text-center mb-3">
    <i className="bi bi-truck me-2"></i>
    Dispatch Details
  </h5>
</div>
 <div className="card shadow-lg border-0 mb-4">
 <div className="row g-3">
<div className="col-md-2">
  <label className="fw-semibold text-black">
    <i className="bi bi-calendar-event me-1 text-primary"></i> Delivery Date
  </label>
  <input
    type="date"
    name="deliveryDate"
    className="form-control border-dark"
    value={form.deliveryDate}
    onChange={handleChange}
  />
</div>

<div className="col-md-2">
  <label className="fw-semibold text-black">
    <i className="bi bi-truck-front me-1 text-primary"></i> Mode of Transport
  </label>
  <select
    name="modeOfTransport"
    className="form-control border-dark"
    value={form.modeOfTransport}
    onChange={handleChange}
  >
    <option value="">Select</option>
    {transportList.map(t => (
      <option key={t._id} value={t.name}>{t.name}</option>
    ))}
  </select>
</div>

<div className="col-md-2">
  <label className="fw-semibold text-black">
    <i className="bi bi-cash-stack me-1 text-primary"></i> Freight Charge Type
  </label>
  <select
    name="freightChargeType"
    className="form-control border-dark"
    value={form.freightChargeType}
    onChange={handleChange}
  >
    <option value="">Select</option>
    {freightChargeList.map(f => (
      <option key={f._id} value={f.name}>{f.name}</option>
    ))}
  </select>
</div>

<div className="col-md-2">
  <label className="fw-semibold text-black">
    <i className="bi bi-box-arrow-right me-1 text-primary"></i> Freight Type
  </label>
  <select
    name="freightType"
    className="form-control border-dark"
    value={form.freightType}
    onChange={handleChange}
  >
    <option value="">Select</option>
    {freightTypeList.map(f => (
      <option key={f._id} value={f.name}>{f.name}</option>
    ))}
  </select>
</div>

<div className="col-md-3">
  <label className="fw-semibold text-black">
    <i className="bi bi-geo-alt me-1 text-primary"></i> Dispatch Address
  </label>
  <textarea
    name="address"
    className="form-control border-dark"
    value={form.address}
    onChange={handleChange}
  />
</div>
<div className="col-md-4">
  <label className="fw-semibold text-black">Remarks</label>
  <textarea
    name="dispatchRemarks"
    className="form-control border-dark"
    value={form.dispatchRemarks}
    onChange={handleChange}
  />
</div>
</div>
</div>

<div className="col-12 mt-5">
  <h5 className="fw-bold text-primary text-center mb-3">
    <i className="bi bi-receipt-cutoff me-2"></i>
    Billing Instructions
  </h5>
</div>
<div className="card shadow-lg border-0 mb-4">
<div className="row g-3">
<div className="col-md-2">
  <label className="fw-semibold text-black" >
    <i className="bi bi-file-earmark-text me-1 text-primary"></i> Quotation/Contract Ref No
  </label>
  <input
    name="quotationRefNo"
    className="form-control border-dark"
    value={form.quotationRefNo}
    onChange={handleChange}
  />
</div>

<div className="col-md-2">
  <label className="fw-semibold text-black">
    <i className="bi bi-receipt me-1 text-primary"></i> PO Number
  </label>
  <input
    name="purchaseOrderNo"
    className="form-control border-dark"
    value={form.purchaseOrderNo}
    onChange={handleChange}
  />
</div>

<div className="col-md-2">
  <label className="fw-semibold text-black">
    <i className="bi bi-calendar-date me-1 text-primary"></i> PO Date
  </label>
  <input
    type="date"
    name="poDate"
    className="form-control border-dark"
    value={form.poDate}
    onChange={handleChange}
  />
</div>

<div className="col-md-2">
  <label className="fw-semibold text-black">
    <i className="bi bi-currency-rupee me-1 text-primary"></i> Rate / Unit
  </label>
  <input
    type="number"
    name="ratePerUnit"
    className="form-control border-dark"
    value={form.ratePerUnit}
    onChange={handleChange}
  />
</div>

<div className="col-md-2">
  <label className="fw-semibold text-black">
    <i className="bi bi-calculator me-1 text-primary"></i> Total Billable Amount
  </label>
  <input
    type="number"
    name="totalBillableAmount"
    className="form-control border-dark"
    value={form.totalBillableAmount}
    onChange={handleChange}
  />
</div>
<div className="col-md-3">
  <label className="fw-semibold text-black">
    <i className="bi bi-person-lines-fill me-1 text-primary"></i> Bill To:
  </label>
  <textarea
    name="planningInstruction"
    className="form-control border-dark"
    value={form.planningInstruction}
    onChange={handleChange}
  />
</div>

<div className="col-md-3">
  <label className="fw-semibold text-black">
    <i className="bi bi-send me-1 text-primary"></i> Bill Send
  </label>
  <textarea
    name="billSend"
    className="form-control border-dark"
    value={form.billSend}
    onChange={handleChange}
  />
</div>

<div className="col-md-4">
  <label className="fw-semibold text-black">Remarks</label>
  <textarea
    name="billingRemarks"
    className="form-control border-dark"
    value={form.billingRemarks}
    onChange={handleChange}
  />
</div>
<div className="col-md-2">
  <label className="fw-semibold text-black">
    Billing Type
  </label>
  <select
    name="billingType"
    className="form-control border-dark"
    value={form.billingType}
    onChange={handleChange}
  >
    <option value="">Select</option>
    <option value="INTERNAL">INTERNAL</option>
    <option value="EXTERNAL">EXTERNAL</option>
  </select>
</div>
</div>
</div>

<div className="col-12 mt-5">
  <h5 className="fw-bold text-primary text-center mb-3">
    <i className="bi bi-clipboard-check me-2 text-primary"></i>
    Instructions
  </h5>
</div>
<div className="card shadow-lg border-0 mb-4">
<div className="row g-3">
<div className="col-md-2">
  <label className="fw-semibold text-black">
    <i className="bi bi-person-badge me-1 text-primary"></i> KAM
  </label>
  <input
    name="kam"
    className="form-control border-dark"
    value={form.kam}
    onChange={handleChange}
  />
</div>

<div className="col-md-2">
  <label className="fw-semibold text-black">
    <i className="bi bi-diagram-2 me-1 text-primary"></i> KAM Branch
  </label>
  <input
    name="kamBranch"
    className="form-control border-dark"
    value={form.kamBranch}
    onChange={handleChange}
  />
</div>

<div className="col-md-2">
  <label className="fw-semibold text-black">
    <i className="bi bi-file-earmark-text me-1 text-primary"></i> Payment Terms
  </label>
  <input
    name="paymentTerms"
    className="form-control border-dark"
    value={form.paymentTerms}
    onChange={handleChange}
  />
</div>

<div className="col-md-2">
  <label className="fw-semibold text-black">
    <i className="bi bi-cash-coin me-1 text-primary"></i> Advance Payment
  </label>
  <select
    name="advancePayment"
    className="form-control border-dark"
    value={form.advancePayment}
    onChange={handleChange}
  >
    <option value="">Select</option>
    <option value="YES">YES</option>
    <option value="NO">NO</option>
  </select>
</div>

<div className="col-md-2">
  <label className="fw-semibold text-black">
    <i className="bi bi-percent me-1 text-primary"></i> Tax Type
  </label>
  <select
    name="taxType"
    className="form-control border-dark"
    value={form.taxType}
    onChange={handleChange}
  >
    <option value="">Select</option>
    <option value="TAX INCLUSIVE">TAX INCLUSIVE</option>
    <option value="TAX EXCLUSIVE">TAX EXCLUSIVE</option>
  </select>
</div>
<div className="col-md-3">
  <label className="fw-semibold text-black">
    <i className="bi bi-exclamation-circle me-1 text-primary"></i> Special Instruction
  </label>
  <textarea
    name="specialInstruction"
    className="form-control border-dark"
    value={form.specialInstruction}
    onChange={handleChange}
  />
</div>
<div className="col-md-4">
  <label className="fw-semibold text-black">Remarks</label>
  <textarea
    name="instructionRemarks"
    className="form-control border-dark"
    value={form.instructionRemarks}
    onChange={handleChange}
  />
</div>
</div>
</div>

<div className="d-flex justify-content-center mt-3">
  <button 
    type="submit"
    className="btn btn-primary px-4"
    disabled={saving}
    onClick={(e) => {
      if (saving) e.preventDefault();
    }}
  >
    Save
  </button>
</div>
      </form>

      <hr />
   <div className="d-flex flex-nowrap align-items-center gap-4 mb-3">

  <input
    type="text"
    placeholder="WO Number"
    className="form-control border-dark"
    style={{ width: "180px" }}
    value={filters.wo}
    onChange={(e) =>
      setFilters({ ...filters, wo: e.target.value })
    }
  />
  <input
  type="text"
  placeholder="Sub WO"
  className="form-control border-dark"
  style={{ width: "180px" }}
  value={filters.subWo}
  onChange={(e) =>
    setFilters({ ...filters, subWo: e.target.value })
  }
/>

  <select
    className="form-control border-dark"
    style={{ width: "180px" }}
    value={filters.customer}
    onChange={(e) =>
      setFilters({ ...filters, customer: e.target.value })
    }
  >
    <option value="">All Customers</option>
    {customerOptions.map((cust, i) => (
      <option key={i} value={cust}>
        {cust}
      </option>
    ))}
  </select>

  <input
    type="text"
    placeholder="Product Code"
    className="form-control border-dark"
    style={{ width: "180px" }}
    value={filters.productCode}
    onChange={(e) =>
      setFilters({ ...filters, productCode: e.target.value })
    }
  />

  <button
    className="btn btn-secondary"
    onClick={() =>
      setFilters({ wo: "", customer: "", productCode: "",subWo:"" })
    }
  >
    Clear
  </button>

  <button className="btn btn-success" onClick={exportToExcel}>
    Export Excel
  </button>

  <button className="btn btn-danger" onClick={viewPDF}>
    PDF
  </button>
</div>
    {/* TABLE */}
<div style={{ overflowX: "auto", maxHeight: "400px" }}>
  <table className="table table-bordered table-lg align-middle" >

    <thead
      style={{ position: "sticky",top: 0,zIndex: 10,background: "#ffffff",boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
      <tr className="text-center">  
        <th style={thStyle}>Work order</th>
          <th style={thStyle}>Sub work order</th>
        <th style={thStyle}>Product</th>
        <th style={thStyle}>Material</th>
        <th style={thStyle}>Description</th>
        <th style={thStyle}>Customer</th>

        <th style={thStyle}>Color Front</th>
        <th style={thStyle}>Color Back</th>
        <th style={thStyle}>Waste Qty</th>
        <th style={thStyle}>Job Size</th>
        <th style={thStyle}>Ink</th>

        <th style={thStyle}>Qty</th>
        <th style={thStyle}>Remaining Qty</th>
        <th style={thStyle}>Location</th>

        <th style={thStyle}>Material Code</th>
        <th style={thStyle}>Material Desc</th>
        <th style={thStyle}>GSM</th>
        <th style={thStyle}>Mill</th>
        <th style={thStyle}>Paper Size</th>

        <th style={thStyle}>Inner Type</th>
        <th style={thStyle}>Leaves</th>
        <th style={thStyle}>Inner Pack</th>
        <th style={thStyle}>Outer Pack</th>
        <th style={thStyle}>Inner/Outer</th>

        <th style={thStyle}>Delivery</th>
        <th style={thStyle}>Transport</th>
        <th style={thStyle}>Freight Charge</th>
        <th style={thStyle}>Freight Type</th>
        <th style={thStyle}>Address</th>

        <th style={thStyle}>Quotation</th>
        <th style={thStyle}>PO No</th>
        <th style={thStyle}>PO Date</th>
        <th style={thStyle}>Rate</th>
        <th style={thStyle}>Total</th>

        <th style={thStyle}>Prefix</th>
        <th style={thStyle}>Non MICR Digit</th>
        <th style={thStyle}>Account No</th>
        <th style={thStyle}>MICR</th>
        <th style={thStyle}>Account Code</th>
        <th style={thStyle}>Transiton Code</th>
        
        <th style={thStyle}>Cheque From</th>
        <th style={thStyle}>Cheque To</th>

        <th style={thStyle}>Bill Send</th>
        <th style={thStyle}>KAM</th>
        <th style={thStyle}>KAM Branch</th>
        <th style={thStyle}>Payment</th>
        <th style={thStyle}>Advance</th>
        <th style={thStyle}>Tax</th>
        <th style={thStyle}>Billing Type</th>

        <th style={thStyle}>Special</th>
        <th style={thStyle}>Planning</th>

        <th style={thStyle}>Type</th>
        <th style={thStyle}>Remarks</th>
        <th style={thStyle}>User Locations</th>
        <th style={thStyle}>User</th>
        <th style={thStyle}>Action</th>
      </tr>
    </thead>

    <tbody>
      {filteredOrders.map(order => (
        <tr key={order._id}>
          <td>
  {order.workOrders?.map((wo, i) => {
    // ✅ MASTER CASE
    if (!wo.workorder2 || wo.workorder2 === "") {
      return <div key={i}>{wo.efiWoNumber}</div>;
    }

    // ✅ REVERSED DATA (your persow case)
    if (Number(wo.workorder2) < Number(wo.efiWoNumber)) {
      return <div key={i}>{wo.workorder2}</div>;
    }

    // ✅ NORMAL CASE
    return <div key={i}>{wo.efiWoNumber}</div>;
  })}
</td>

<td>
  {order.workOrders?.map((wo, i) => {
    // ✅ MASTER CASE
    if (!wo.workorder2 || wo.workorder2 === "") {
      return <div key={i}>-</div>;
    }

    // ✅ REVERSED DATA
    if (Number(wo.workorder2) < Number(wo.efiWoNumber)) {
      return <div key={i}>{wo.efiWoNumber}</div>;
    }

    // ✅ NORMAL CASE
    return <div key={i}>{wo.workorder2}</div>;
  })}
</td>

          <td>{order.productCode}</td>
          <td>{order.materialType}</td>
          <td
  style={{
    cursor: "pointer",
    maxWidth: "200px",
    whiteSpace:
      expandedCell === `desc-${order._id}` ? "normal" : "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  }}
  onClick={() =>
    setExpandedCell(
      expandedCell === `desc-${order._id}` ? null : `desc-${order._id}`
    )
  }
>
  {expandedCell === `desc-${order._id}`
    ? order.description
    : truncateText(order.description)}
</td>
         <td
  style={{
    cursor: "pointer",
    maxWidth: "200px",
    whiteSpace:
      expandedCell === `customer-${order._id}` ? "normal" : "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  }}
  onClick={() =>
    setExpandedCell(
      expandedCell === `customer-${order._id}` ? null : `customer-${order._id}`
    )
  }
>
  {expandedCell === `customer-${order._id}`
    ? order.customerName
    : truncateText(order.customerName)}
</td>

          <td>{order.colorFront}</td>
          <td>{order.colorBack}</td>
          <td>{order.wasteQty}</td>
          <td>{order.jobSize}</td>
          <td
  style={{
    cursor: "pointer",
    maxWidth: "200px",
    whiteSpace:
      expandedCell === `ink-${order._id}` ? "normal" : "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  }}
  onClick={() =>
    setExpandedCell(
      expandedCell === `ink-${order._id}` ? null : `ink-${order._id}`
    )
  }
>
  {expandedCell === `ink-${order._id}`
    ? order.inkDetails
    : truncateText(order.inkDetails)}
</td>

          <td>{order.quantity}</td>
          <td>{order.remainingQty}</td>
          <td>{order.location}</td>

          <td>{order.materialCode}</td>
          <td
  style={{
    cursor: "pointer",
    maxWidth: "200px",
    whiteSpace:
      expandedCell === `matdesc-${order._id}` ? "normal" : "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  }}
  onClick={() =>
    setExpandedCell(
      expandedCell === `matdesc-${order._id}` ? null : `matdesc-${order._id}`
    )
  }
>
  {expandedCell === `matdesc-${order._id}`
    ? order.materialDescription
    : truncateText(order.materialDescription)}
</td>
          <td>{order.materialGsm}</td>
          <td>{order.materialMill}</td>
          <td>{order.paperSize}</td>

          <td>{order.innerPackingType}</td>
          <td>{order.leavesPerInner}</td>
          <td>{order.innerPack}</td>
          <td>{order.outerPack}</td>
          <td>{order.innerPerOuter}</td>

          <td>{order.deliveryDate?.substring(0,10)}</td>
          <td>{order.modeOfTransport}</td>
          <td>{order.freightChargeType}</td>
          <td>{order.freightType}</td>
          <td>{order.address}</td>

          <td>{order.quotationRefNo}</td>
          <td>{order.purchaseOrderNo}</td>
          <td>{order.poDate?.substring(0,10)}</td>
          <td>{order.ratePerUnit}</td>
          <td>{order.totalBillableAmount}</td>

          <td>{order.prefix || "--"}</td>
          <td>{order.nonMicrDigits || "--"}</td>
          <td>{order.accountNumber || "--"}</td>
          <td>{order.sortCode || "--"}</td>
          <td>{order.accountCode || "--"}</td>
          <td>{order.transactionCode || "--"}</td>

          <td>{order.chequeFrom || "--"}</td>
          <td>{order.chequeTo || "--"}</td>

          <td>{order.billSend}</td>
          <td>{order.kam}</td>
          <td>{order.kamBranch}</td>
          <td>{order.paymentTerms}</td>
          <td>{order.advancePayment}</td>
          <td>{order.taxType}</td>
          <td>{order.billingType}</td>

          <td>{order.specialInstruction}</td>
          <td>{order.planningInstruction}</td>

          <td>{order.orderType}</td>
          <td>{order.remarks}</td>
          <td>
  {order.userLocations?.join(", ") || "--"}
</td>
<td>{order.user}</td>

          <td>
            <button onClick={() => handleEdit(order)}>Edit</button>
            <button onClick={() => handleDelete(order._id)}>Delete</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
    </div>
  );
}
export default PrintingIns;