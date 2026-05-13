import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import html2pdf from "html2pdf.js";
import Swal from "sweetalert2";
import { jwtDecode } from "jwt-decode";
import BASE_URL from "../config/api";
import "../styles/plannerDashboard.css";

function PlannerDashboard() {

  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
const [destinationFolder, setDestinationFolder] = useState("");
  const [loggedInUser, setLoggedInUser] = useState("");
  const [hiddenOrders, setHiddenOrders] = useState([]);
const [filterUserLocation, setFilterUserLocation] = useState("");
  const [statusFilter, setStatusFilter] = useState("ORDER_RECEIVED");
 const [printingOrders, setPrintingOrders] = useState([]);
  const [orders, setOrders] = useState([]);
  const folders = ["CLS-1", "CLS-2", "CLS-3"];
  const [workOrders, setWorkOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [eanList, setEanList] = useState([]);
const [selectedEan, setSelectedEan] = useState("");
const [plannerOrders, setPlannerOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedCell, setExpandedCell] = useState(null);
  // Filter states
  const [filterWoNo, setFilterWoNo] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const showAlert = (title, text, icon = "warning") => {
  Swal.fire({
    title: title,
    text: text,
    confirmButtonColor: "#3085d6",
    confirmButtonText: "OK",
    width: "350px"
  });
};
 const [materialRows, setMaterialRows] = useState([
  { 
    materialCode: "", 
    materialDescription: "", 
    materialGroupDescription: "", 
    mill: "", 
    gsm: "",
    paperSize: ""      // ✅ add this
  }
]);
const formRef = useRef(null);

  const [workOrderForm, setWorkOrderForm] = useState({
    workorder2:"",
 machines: [],
  materialCode: "",
  materialDescription: "",
  materialGroupDescription: "",   // ⭐ ADD
  mill: "",                     // ⭐ ADD
  gsm: "",   
  paperQty:"",                   // ⭐ ADD
  orderQty: "",
  wasteQty: "",
  totalQty: "",
  jobSize: "",
  paperSize: "",
  UPS: 1,
  totalImp: "",   // ✅ FIXED (comma added)
remarks: "",
});
  const cust = () => {
    
    navigate("/customer-dashboard");
  };

const [userLocations, setUserLocations] = useState([]);

useEffect(() => {
  const token = localStorage.getItem("token");
  if (token) {
    const decoded = jwtDecode(token);
    setLoggedInUser(decoded.name);
    setUserLocations(decoded.locations || []); // ✅ important
  }
}, []);
useEffect(() => {
  fetchPlannerData();
}, []);

useEffect(() => {
  setHiddenOrders([]); 
}, [statusFilter]);

useEffect(() => {
  if (selectedOrder && formRef.current) {
    formRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }
}, [selectedOrder]);
useEffect(() => {
  if (orders.length > 0) {
    const uniqueEans = [...new Set(orders.map(o => o.ean).filter(Boolean))];
    setEanList(uniqueEans);
  }
}, [orders]);

useEffect(() => {
  const qty = Number(workOrderForm.orderQty) || 0;
  const waste = Number(workOrderForm.wasteQty) || 0;
  const ups = workOrderForm.UPS === "" ? 0 : Number(workOrderForm.UPS);

  setWorkOrderForm(prev => ({
    ...prev,
    totalQty: qty + (qty * (waste / 100)),
    totalImp: qty * ups
  }));
}, [workOrderForm.orderQty, workOrderForm.wasteQty, workOrderForm.UPS]);
const formatDispatchDate = (dateStr) => {
  if (!dateStr) return "-";

  const parts = dateStr.split("-"); // DD-M-YYYY

  if (parts.length !== 3) return "-";

  const day = parts[0].padStart(2, "0");
  const month = parts[1].padStart(2, "0");
  const year = parts[2];

  const formatted = `${year}-${month}-${day}`; // YYYY-MM-DD

  const d = new Date(formatted);

  return isNaN(d) ? "-" : d.toLocaleDateString("en-IN");
};
const fetchPlannerData = async () => {
  try {
    const res = await axios.get(
      `${BASE_URL}/api/customer-orders/planner-ready`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      }
    );

    setPlannerOrders(res.data);   // ✅ NOT setOrders

  } catch (err) {
    console.error("Planner fetch error:", err);
  }
};
const fetchWorkOrders = async () => {
  try {
    const res = await axios.get(`${BASE_URL}/api/workorders`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

    const filtered = (res.data || []).filter(
  wo => wo.status === "PLANNED"
);

setWorkOrders(filtered);
  } catch (err) {
    console.error("Error fetching work orders:", err);
  }
};

  // Fetch data
  useEffect(() => {

    const token = localStorage.getItem("token");
if (token) {
  const decoded = jwtDecode(token);
  setLoggedInUser(decoded.name);   // ✅ name comes from login
}


   const fetchData = async () => {
  setLoading(true);
  try {

    // ✅ 1. CUSTOMER ORDERS
   // ✅ CUSTOMER ORDERS
const orderRes = await axios.get(`${BASE_URL}/api/customer-orders`, {
  params: { 
    status: "ORDER_RECEIVED",
    orderType: "Inhouse"
  },
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
});


// ✅ PRINTING ORDERS
const printingRes = await axios.get(`${BASE_URL}/api/printing-instructions`);

// ✅ FILTER ONLY ORDER_RECEIVED
const filteredPrinting = printingRes.data.filter(
  p => p.status === "ORDER_RECEIVED"
);

// ✅ SET BOTH
setOrders(orderRes.data || []);
setPrintingOrders(filteredPrinting || []);


  } catch (err) {
    console.error("FETCH ERROR:", err);
    setOrders([]);
  }

  setLoading(false);
};


    fetchData();
    fetchWorkOrders();
  }, [statusFilter]);

const handleDeleteWorkOrder = async (id) => {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "Do you want to delete this Work Order?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Yes, delete it",
    cancelButtonText: "Cancel"
  });

  if (!result.isConfirmed) return;

  try {
    await axios.delete(`${BASE_URL}/api/workorders/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

    Swal.fire({
      title: "Deleted Successfully ✅",
      icon: "success",
      confirmButtonColor: "#3085d6"
    });

    // refresh list
    const workRes = await axios.get(`${BASE_URL}/api/workorders`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });

    setWorkOrders(workRes.data || []);

  } catch (err) {
    console.error(err);
    Swal.fire({
      title: "Error deleting Work Order",
      icon: "error"
    });
  }
};

// 🔥 ADD THIS FUNCTION HERE
const handleEditWorkOrder = (wo) => {
  setSelectedOrder({
    _id: wo._id,
    // 🔥 ADD THESE (IMPORTANT)
  vendor_name: wo.customer || wo.vendor_name || "-",
  desc: wo.productName || wo.desc || "-",

   qtyInLvs: wo.qtyInLvs,
   orderQty: wo.orderQty,
     slNo: wo.slNo,   
        nNo: wo.enNo || "",
  items: wo.items && wo.items.length > 0
    ? wo.items
    : [{ ean: wo.enNo }],   // fallback
    efiWoNumber: wo.efiWoNumber, // ✅ ADD THIS
      expectedDeliveryDate: wo.expectedDeliveryDate,
    status: "PLANNED"
  });

  setWorkOrderForm({
    colorFront: wo.colorFront,
    colorBack: wo.colorBack,
    materialCode: wo.materialCode,
    materialDescription: wo.materialDescription,
    materialGroupDescription: wo.materialGroupDescription,
    mill: wo.mill,
    gsm: wo.gsm,
    paperSize: wo.paperSize,
    paperQty: wo.paperQty,
    orderQty: wo.orderQty,
    wasteQty: wo.wasteQty,
    totalQty: wo.totalQty,
    jobSize: wo.jobSize,
    
    UPS: wo.UPS,
  
  totalImp: (wo.UPS || 0) * (wo.orderQty || 0),
    inkDetails: wo.inkDetails,
    remarks: wo.remarks,
      expectedDeliveryDate: wo.expectedDeliveryDate
      ? wo.expectedDeliveryDate.split("T")[0]
      : ""
  });

};


const handleSelectOrder = (order) => {

  // ✅ HIDE ROW
 setHiddenOrders(prev => [...prev, ...(order.ids || [])]);

  setSelectedOrder({
    ...order,
  items: order.rows || [],             // ✅ IMPORTANT
  excel_file_name: order.excel_file_name || "",
wono: order.dispatch_order_reference,
    enNo: order.enNo || "",
    qtyInLvs: order.quantity,
     productCode: order.productCode,
    customer: order.customerName,
    productName: order.description,
    productType: order.materialType || order.productType,
    expectedDeliveryDate: order.expectedDeliveryDate || order.deliveryDate,
    isPrinting: order.isPrinting || false,
    colorFront: order.colorFront,
    colorBack: order.colorBack,
    wasteQty: order.wasteQty,
    jobSize: order.jobSize,
    inkDetails: order.inkDetails,
   dispatch_deadline: order.deadline
  });



  setMaterialRows([
    {
      materialCode: "",
      materialDescription: "",
      materialGroupDescription: "",
      mill: "",
      gsm: ""
    }
  ]);

const qty = Number(order.tagqty) || 0;
const waste = Number(order.wasteQty) || 0;

setWorkOrderForm({
  machines: [],
  wasteQty: order.wasteQty || "",
  jobSize: order.jobSize || "",
  orderQty: qty,

  totalQty: qty + (qty * (waste / 100)),  // ✅ FIXED
  UPS: 1,
  totalImp: qty * 1,                      // ✅ FIXED

  remarks: "",
  expectedDeliveryDate: order.expectedDeliveryDate
    ? order.expectedDeliveryDate.split("T")[0]
    : ""   // ✅ FIX
});
}
  const containsSpecialChars = (value) => {
  const regex = /[^a-zA-Z0-9\s.]/; 
  return regex.test(value);
};

 const handleFormChange = (e) => {
  const { name, value } = e.target;

const numberFields = ["orderQty", "wasteQty", "UPS", "paperQty"];

if (numberFields.includes(name)) {
  if (value.includes("-")) {
    showAlert("Invalid Input", "Negative values are not allowed", "warning");
    return;
  }
}

  // 🔴 SPECIAL CHARACTER BLOCK (for text fields)
  const textFields = ["jobSize", "inkDetails", "remarks"];
  if (textFields.includes(name)) {
    if (containsSpecialChars(value)) {
      showAlert("Special characters are not allowed");
      return;
    }
  }

  // 🔵 Waste % → Max 2 digits before decimal
  if (name === "wasteQty") {
    if (!/^\d{0,2}(\.\d{0,2})?$/.test(value)) {
      showAlert("Waste % allows only 2 digits");
      return;
    }
  }

 if (name === "UPS") {
  if (!/^[0-9]{0,2}$/.test(value)) {
    showAlert("UPS must be up to 2 digits only");
    return;
  }
}


  setWorkOrderForm(prev => {
    let updated = { ...prev, [name]: value };
  // ✅ DEFAULT UPS = 1
  if (!updated.UPS || Number(updated.UPS) === 0) {
    updated.UPS = 1;
  }
 if (name === "orderQty" || name === "wasteQty" || name === "UPS" ) {

 // ✅ Correct totalQty calculation (single source)
const qty = Number(updated.orderQty) || 0;
const waste = Number(updated.wasteQty) || 0;

updated.totalQty = qty + (qty * (waste / 100));
}
  // ✅ Allow empty UPS
  if (name === "UPS") {
    updated.UPS = value; // keep as string (important)
  } else {
    updated[name] = value;
  }

  // ✅ Calculations
  const qty = Number(updated.orderQty) || 0;
  const waste = Number(updated.wasteQty) || 0;

  updated.totalQty = qty + (qty * (waste / 100));

  // 🔥 IMPORTANT: UPS fallback only for calculation (not state)
  const ups = updated.UPS === "" ? 0 : Number(updated.UPS);

  updated.totalImp = qty * ups;

  return updated;
});
};

const handleMachineChange = (machineId) => {
  setWorkOrderForm(prev => {
    const exists = prev.machines.includes(machineId);

    return {
      ...prev,
      machines: exists
        ? prev.machines.filter(id => id !== machineId)
        : [...prev.machines, machineId]
    };
  });
};
const handleMoveFile = async () => {
  if (!selectedFile || selectedFile.length === 0) {
    showAlert("Please select files");
    return;
  }

  if (!destinationFolder) {
    showAlert("Please select destination folder");
    return;
  }

  try {
    const formData = new FormData();

    // 🔥 append multiple files
    for (let i = 0; i < selectedFile.length; i++) {
      formData.append("files", selectedFile[i]);
    }

    formData.append("destination", destinationFolder);

    await axios.post(`${BASE_URL}/api/workorders/move-file`, formData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "multipart/form-data"
      }
    });

    showAlert("Success", "Files moved successfully ✅", "success");

    setSelectedFile(null);
    setDestinationFolder("");

  } catch (err) {
    console.error(err);
    showAlert("Error moving files");
  }
};

  const handleSubmitWorkOrder = async (e) => {
  e.preventDefault();
  if (!selectedOrder) return;
  // ===== REQUIRED FIELD VALIDATION =====
const requiredFields = [
  { key: "orderQty", label: "Order Quantity" },
 
];

for (let field of requiredFields) {
  if (
    workOrderForm[field.key] === "" ||
    workOrderForm[field.key] === null ||
    workOrderForm[field.key] === undefined
  ) {
   showAlert(`${field.label} is required`);
    return;
  }
}
const wono = selectedOrder.dispatch_order_reference;

const existingWO = workOrders.find(
  wo =>
    String(wo.efiWoNumber).trim() === String(wono).trim() &&
    wo._id !== selectedOrder._id   // 🔥 IMPORTANT (ignore same record while edit)
);

if (existingWO) {
  showAlert(
    "Duplicate WO ❌",
    `Work Order ${wono} already exists`,
    "error"
  );
  return;
}
 // if (!workOrderForm.machines || workOrderForm.machines.length === 0) {
 //   alert("Please select at least one machine in the main Machines section");
 //   return;
 // }

  try {
  const payload = {
customerOrderIds: selectedOrder.ids,
printingId: selectedOrder.isPrinting ? selectedOrder._id : null,
 items: selectedOrder.items || [],              // ✅ ADD
  excel_file_name: selectedOrder.excel_file_name ,// ✅ ADD
wono: selectedOrder.dispatch_order_reference,
  slNo: selectedOrder.slNo || 0,
  enNo: selectedOrder.enNo || "",
  productCode: selectedOrder.productCode,
workorder2: selectedOrder.workorder2,
Item:selectedOrder.Format,
purchaseOrderNo: selectedOrder.garment_po_number,
   poDate: selectedOrder.poDate,
 customer: selectedOrder.customer || selectedOrder.vendor_name || "Unknown",// ✅ map correct field
  productName: selectedOrder.productName || selectedOrder.desc || "-",
  qtyInLvs: Number(selectedOrder.qtyInLvs) || 0,


  paperQty: Number(workOrderForm.paperQty) || 0,
  orderQty: Number(workOrderForm.orderQty) || 0,
  wasteQty: Number(workOrderForm.wasteQty) || 0,
  totalQty: Number(workOrderForm.totalQty) || 0,
  jobSize: workOrderForm.jobSize,
  UPS: Number(workOrderForm.UPS) || 0,
  totalImp: Number(workOrderForm.totalImp) || 0,
  remarks: workOrderForm.remarks,
};

// ✅ PUT CONSOLE.LOG HERE

console.log("Full Payload:", payload);
if (selectedOrder._id && selectedOrder.status === "PLANNED") {

  // 🔄 UPDATE EXISTING WORK ORDER
 await axios.put(
  `${BASE_URL}/api/workorders/${selectedOrder._id}`,
  payload,
    { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
  );

  showAlert("Work Order Updated Successfully ✅");

} else {

// ➕ CREATE NEW WORK ORDER
await axios.post(
  `${BASE_URL}/api/workorders/create`,
  payload,
  { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
);

// 🔥 UPDATE PRINTING STATUS (separate try)
if (selectedOrder.isPrinting) {
  try {
    await axios.put(
      `${BASE_URL}/api/printing-instructions/${selectedOrder._id}`,
      { status: "PLANNED" }
    );
  } catch (err) {
    console.error("Printing status update failed:", err);
  }
}

showAlert("Success", "Work Order Created Successfully ✅", "success");
}
// ✅ REMOVE FROM TABLE IMMEDIATELY
if (selectedOrder?.ids?.length) {
 setHiddenOrders(prev => [...prev, ...selectedOrder.ids]);
}

setSelectedOrder(null);

      // Refresh data
   const orderRes = await axios.get(`${BASE_URL}/api/customer-orders`, {
  params: { 
    status: "ORDER_RECEIVED",
    orderType: "Inhouse"
  },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setOrders(orderRes.data || []);
      const printingRes = await axios.get(`${BASE_URL}/api/printing-instructions`);

const filteredPrinting = printingRes.data.filter(
  p => p.status === "ORDER_RECEIVED"
);

setPrintingOrders(filteredPrinting || []);

      const workRes = await axios.get(`${BASE_URL}/api/workorders`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setWorkOrders(workRes.data || []);

    } catch (err) {
  console.log("FULL ERROR:", err);
  console.log("BACKEND ERROR:", err.response?.data);
  console.log("FULL ERROR:", err);

  const message =
    err.response?.data?.message ||
    (err.response?.data?.code === 11000
      ? "Work Order already exists ❌"
      : "Something went wrong");

  Swal.fire({
    title: "Error",
    text: message,
    icon: "error",
    confirmButtonColor: "#d33"
  });
}// 👈 THIS LINE IMPORTANT
}

  // Filtered Work Orders
const filteredWorkOrders = workOrders
  .filter(wo => {
    const matchWo =
      filterWoNo === "" ||
      String(wo.efiWoNumber).includes(filterWoNo);
      const matchMachine = true;

    const matchLocation =
      filterUserLocation === "" ||
      wo.userLocations?.includes(filterUserLocation);

    const woDateString = new Date(wo.createdAt).toISOString().split("T")[0];
    const matchFrom = dateFrom === "" || woDateString >= dateFrom;
    const matchTo = dateTo === "" || woDateString <= dateTo;

    return matchWo && matchMachine && matchLocation && matchFrom && matchTo;
  })
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

// ✅ LIMIT ONLY WHEN NO FILTERS
const displayedWorkOrders =
  filterWoNo || dateFrom || dateTo
    ? filteredWorkOrders
    : filteredWorkOrders.slice(0,50);

  // Excel download
const downloadExcel = () => {
  if (!filteredWorkOrders.length) return showAlert("No data to download!");

  const data = filteredWorkOrders.flatMap(wo => {
    const items =
      wo.items && wo.items.length > 0
        ? wo.items
        : [{ ean: wo.enNo || "-", tag_qty: wo.orderQty || 0 }];

    return items.map(item => {
      const qty = Number(item.tag_qty || 0);
      const ups = Number(wo.UPS || 1); // same logic as PDF fallback
      const totalImp = qty * ups; // 🔥 SAME AS PDF LOGIC

      return {
        "SL No": wo.slNo,
        "WO NO": wo.efiWoNumber,
        "EN No": item.ean || "-",
        "PO No": wo.purchaseOrderNo || "-",
        "Customer Name": wo.customer?.name || wo.customer || "-",
        "Job Description": wo.productName || "-",
        "Item": wo.Item || "-",
        "WO Date": wo.createdAt
          ? new Date(wo.createdAt).toLocaleDateString("en-IN")
          : "-",
        "Order Qty": qty,
        "Total Qty": Math.ceil(wo.totalQty ?? 0),
        "Total Impression": totalImp, // ✅ FIXED (PDF MATCH)
        "Remarks": wo.remarks || "-",
        "Planning": wo.planningUser || "-",
        // "User Locations": wo.userLocations?.join(", ") || "-"
      };
    });
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "WorkOrders");

  XLSX.writeFile(workbook, "WorkOrders.xlsx");
};
   

  // PDF download using html2pdf.js
  const downloadPDF = () => {
    const element = document.getElementById("planned-workorders-table");
    if (!element) return showAlert("No table to download!");

    const clonedTable = element.cloneNode(true);
    clonedTable.style.width = "100%";
    clonedTable.style.borderCollapse = "collapse";
    clonedTable.querySelectorAll("th, td").forEach(cell => {
      cell.style.border = "1px solid #000";
      cell.style.padding = "4px";
      cell.style.whiteSpace = "normal";
      cell.style.wordBreak = "break-word";
      cell.style.fontSize = "10px";
    }); 

    const container = document.createElement("div");
    container.appendChild(clonedTable);

    const opt = {
      margin: 0.2,
      filename: "WorkOrders.pdf",
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, scrollY: -window.scrollY },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(container).save();
  };

  const getBase64ImageFromURL = async (url) => {
  const data = await fetch(url);
  const blob = await data.blob();

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      resolve(reader.result);
    };
  });
};
const generateQRBase64 = async (text) => {
  const QRCode = await import("qrcode"); // dynamic import

  return await QRCode.toDataURL(text, {
    width: 100,
    margin: 1
  });
};
// Company Format PDF
const downloadFormattedPDF = async () => {
  try {
    const isFilterApplied =
      filterWoNo || dateFrom || dateTo || filterUserLocation;

    let dataToDownload = [];

    if (isFilterApplied) {
      dataToDownload = filteredWorkOrders;
    } else {
      const res = await axios.get(`${BASE_URL}/api/workorders`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      dataToDownload = res.data || [];
    }

    if (!dataToDownload.length) {
      showAlert("No data to download!");
      return;
    }

    const DOCUMENT_ID = "MPi_RF_QS_PRD_T011_V1.00";
    const doc = new jsPDF("p", "mm", "a4");
    let firstWoNumber = "";

    const plainStyle = {
      theme: "grid",
      styles: {
        fontSize: 9,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
        fillColor: false,
      },
      headStyles: {
        fillColor: false,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
      },
    };

    // ── Build sleeve rows ────────────────────────────────────────────────
const buildSleeveRows = (item) => {
  const totalQty = Number(item.tag_qty || 0);
  const SLEEVE_SIZE = 500;
  let remaining = totalQty;
  let sleeveNo = 1;
  let cumulative = 0;
  const rows = [];
  while (remaining > 0) {
    const currentQty = Math.min(remaining, SLEEVE_SIZE);
    cumulative += currentQty;
const startRange = cumulative - currentQty + 1;
const endRange = cumulative;

const randomNo =
  Math.floor(
    Math.random() * (endRange - startRange + 1)
  ) + startRange;

const sampleTag =
  randomNo;
  rows.push([
  `SLV-${String(sleeveNo).padStart(2, "0")}`,
  currentQty,       // ✅ cumulative instead of currentQty
      sampleTag,
      "", "", "", "", "",
    ]);
    remaining -= currentQty;
    sleeveNo++;
  }
  return rows;
};

    // ── Draw header + 3 tables, returns finalY after Stage table ────────
    const drawFullHeader = (wo, item, qrBase64) => {
      let y = 12;

      doc.setDrawColor(0);
      doc.setLineWidth(0.8);
      doc.rect(5, 5, 200, 287);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text(
        "Manipal Payment and Identity Solutions Limited",
        105, y, { align: "center" }
      );

      y += 6;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text("Internal Document", 14, y);
      y += 5;
      doc.text(`Document ID: ${DOCUMENT_ID}`, 14, y);
      y += 5;
      doc.text(`Request Location: ${wo.location ?? "-"}`, 14, y);
      y += 5;
      doc.text(
        `Printing Location: ${wo.userLocations?.length ? wo.userLocations.join(", ") : "-"}`,
        14, y
      );
      y += 8;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("RFID AUDIT SHEET", 105, y, { align: "center" });

      const pageWidth = doc.internal.pageSize.getWidth();
      doc.addImage(qrBase64, "PNG", pageWidth - 25, 10, 15, 15);

      y += 10;

      // Table 1 — Basic Details
      autoTable(doc, {
        ...plainStyle,
        startY: y,
        body: [
          ["PO NO", wo.purchaseOrderNo ?? "-", "WO NO", wo.efiWoNumber ?? "-"],
          [
            "WO Date",
            wo.createdAt ? new Date(wo.createdAt).toLocaleDateString("en-IN") : "-",
            "Customer",
            { content: wo.customer ?? "-" },
          ],
        ],
      });
      y = doc.lastAutoTable.finalY + 5;

      // Table 2 — EAN Details
      autoTable(doc, {
        ...plainStyle,
        startY: y,
        head: [["EAN", "Description", "Item", "Qty", "Remarks"]],
        body: [[
          item.ean ?? "-",
          wo.productName ?? "-",
          wo.Item ?? "-",
          item.tag_qty ?? "-",
          wo.remarks ?? "-",
        ]],
      });
      y = doc.lastAutoTable.finalY + 5;

      // Table 3 — Stage / Process Audit
      autoTable(doc, {
        ...plainStyle,
        startY: y,
        head: [["Stage", "Date & Time", "Qty", "Status", "Checked By", "Signature"]],
        body: [
          [
            "Data Transfer",
            wo.createdAt ? new Date(wo.createdAt).toLocaleString("en-IN") : "-",
            item.tag_qty, "OK", wo.planningUser ?? "-", "",
          ],
          ["Base Tag issuance",      "", "", "", "", ""],
          ["First Tag QC Completed", "", "", "", "", ""],
          ["Inspection Completed",     "", "", "", "", ""],
          ["Full Fillment Completed",      "", "", "", "", ""],
          ["Dispatch Completed",     "", "", "", "", ""],
        ],
      });

      return doc.lastAutoTable.finalY + 6; // y ready for sleeve table
    };

    const writePageNumber = (num) => {
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(`Page ${num}`, 105, 290, { align: "center" });
    };

    // ════════════════════════════════════════════════════════════════════
    let globalPageIndex = 0;

    for (const wo of dataToDownload) {
      if (!firstWoNumber) firstWoNumber = wo.efiWoNumber;

      const items =
        wo.items && wo.items.length > 0
          ? wo.items
          : [{ ean: "-", tag_qty: wo.orderQty }];

      for (const item of items) {

        if (globalPageIndex !== 0) doc.addPage();
        globalPageIndex++;

        // Pre-generate QR (async) before any sync drawing
        const qrBase64 = await generateQRBase64(
          JSON.stringify({ wono: wo.efiWoNumber, enNo: item.ean })
        );

        // Draw header on first page, get y after Stage table
        const firstPageSleeveStartY = drawFullHeader(wo, item, qrBase64);
        writePageNumber(globalPageIndex);

        const allRows = buildSleeveRows(item);
        if (allRows.length === 0) continue;
        const headerHeight = firstPageSleeveStartY; // e.g. ~145mm

    let isFirstPage = true;
let continuationY = 90; // fixed measured height of continuation header

autoTable(doc, {
  theme: "grid",
  margin: { left: 13, right: 13, top: continuationY, bottom: 12 },

          startY: firstPageSleeveStartY, // first page starts right after header

          tableWidth: 184,

          head: [[
            "Sleeve / Box No", "Total Tags", "Sample Tag No",
            "Inlay Reading", "Barcode Reading",
            "Internal Ref ID", "Status", "Checked By",
          ]],

          body: allRows,

          styles: {
            fontSize: 7,
            cellPadding: 2,
            valign: "middle",
            halign: "center",
            lineWidth: 0.3,
            lineColor: [0, 0, 0],
            textColor: [0, 0, 0],
          },
          headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: "bold",
            halign: "center",
            valign: "middle",
          },
          columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 14 },
            2: { cellWidth: 28 },
            3: { cellWidth: 28 },
            4: { cellWidth: 32 },
            5: { cellWidth: 24 },
            6: { cellWidth: 16 },
            7: { cellWidth: 22 },
          },

          // 🔑 didDrawPage fires for EVERY page autoTable creates
didDrawPage: (data) => {

  // ✅ Skip first page
  if (isFirstPage) {
    isFirstPage = false;
    return;
  }

  globalPageIndex++;

  // ===== PAGE BORDER =====
  doc.setDrawColor(0);
  doc.setLineWidth(0.8);
  doc.rect(5, 5, 200, 287);

  let y = 12;

  // ===== COMPANY HEADER =====
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);

  doc.text(
    "Manipal Payment and Identity Solutions Limited",
    105,
    y,
    { align: "center" }
  );

  y += 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");

  doc.text("Internal Document", 14, y);

  y += 5;
  doc.text(`Document ID: ${DOCUMENT_ID}`, 14, y);

  y += 5;
  doc.text(`Request Location: ${wo.location ?? "-"}`, 14, y);

  y += 5;

  doc.text(
    `Printing Location: ${
      wo.userLocations?.length
        ? wo.userLocations.join(", ")
        : "-"
    }`,
    14,
    y
  );

  y += 8;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");

  doc.text("RFID AUDIT SHEET", 105, y, {
    align: "center",
  });

  // ===== QR =====
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.addImage(
    qrBase64,
    "PNG",
    pageWidth - 25,
    10,
    15,
    15
  );

  y += 10;

  // ===== BASIC DETAILS TABLE =====
  autoTable(doc, {
    ...plainStyle,
    startY: y,
    body: [
      [
        "PO NO",
        wo.purchaseOrderNo ?? "-",
        "WO NO",
        wo.efiWoNumber ?? "-"
      ],
      [
        "WO Date",
        wo.createdAt
          ? new Date(wo.createdAt).toLocaleDateString("en-IN")
          : "-",
        "Customer",
        wo.customer ?? "-"
      ],
    ],
  });

  y = doc.lastAutoTable.finalY + 5;

  // ===== EAN DETAILS TABLE =====
  autoTable(doc, {
    ...plainStyle,
    startY: y,
    head: [["EAN", "Description", "Item", "Qty", "Remarks"]],
    body: [[
      item.ean ?? "-",
      wo.productName ?? "-",
      wo.Item ?? "-",
      item.tag_qty ?? "-",
      wo.remarks ?? "-"
    ]],
  });

writePageNumber(globalPageIndex);
},
        });
      }
    }

    doc.save(`MPI_RFID_AUDITSHEET_${firstWoNumber}.pdf`);

  } catch (error) {
    console.error("PDF generation error:", error);
    showAlert("Error generating PDF");
  }
};
const groupedOrders = Object.values(
  plannerOrders.reduce((acc, order) => {

    const key = order.garment_po_number + "_" + order.excel_file_name;

    if (!acc[key]) {
      acc[key] = {
        garment_po_number: order.garment_po_number,
        Format: order.Format,
        vendor_name: order.vendor_name,
        dispatch_order_reference: order.dispatch_order_reference || "",
        dispatch_pdc: order.dispatch_pdc || "",
        desc: order.desc,
        userLocations: order.userLocations,
        _id: order._id,
        excel_file_name: order.excel_file_name || "",   // ✅ ADD THIS
    ids: order.ids || [],
        rows: [],                                       // ✅ STORE FULL ROWS
        eans: [],
        tagqty: 0,
         deadline: order.deadline || ""
      };
    }
  


    // 🔥 LOOP THROUGH ROWS
    (order.rows || []).forEach(r => {

      // ✅ UNIQUE EAN LIST
      if (r.ean && !acc[key].eans.includes(r.ean)) {
        acc[key].eans.push(r.ean);
      }

      // ✅ TOTAL QTY
      acc[key].tagqty += Number(r.tag_qty || 0);

      // ✅ 🔥 IMPORTANT: STORE FULL ROW DATA
      acc[key].rows.push({
        ean: r.ean || "",
        tag_qty: Number(r.tag_qty || 0)
      });
    });

    return acc;

  }, {})
);
  return (
    <div
  className="container-fluid"
  style={{
    minHeight: "100vh",
    padding: "20px",

    backgroundImage: "url('/plan.png')",  // ✅ put image in public folder
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat"
  }}
>
<div className="dashboard-container"
  style={{
    background: "rgba(255, 255, 255, 0.61)"  // 👈 glass effect
  }}
>
      <h1 className="text-center fw-bold">Scheduling Dashboard</h1>
       <div className="dashboard-actions" style={{ marginBottom: "15px", display: "flex", gap: "10px" ,border: "1px solid #fff5f8" }}>
  
</div>
<div className="d-flex justify-content-between align-items-center mb-3">

  <select
    value={statusFilter}
    onChange={(e) => {
      setStatusFilter(e.target.value);
      setSelectedOrder(null);
    }}
    style={{ padding: "8px", borderRadius: "6px", width: "200px" }}
  >
    <option value="">All</option>
    <option value="ORDER_RECEIVED">Order Received</option>
    <option value="PLANNED">RFID Orders</option>
  </select>

  {/* <button onClick={cust} className="btn btn-primary">
    Purchase Order
  </button> */}
  

</div>

      {(statusFilter === "ORDER_RECEIVED" || statusFilter === "") && orders.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h4 className="text-center fw-semibold">Order Received</h4>
          <div className="table-container">
          <table className="table-modern">
            <thead>
              <tr>
                <th>PO No</th>
                <th>Format</th>
                <th>EAN No</th>
                 <th>Vendor name</th>
                 <th>order reference</th>
                 <th>PDC</th>
                 <th>Total Qty</th>
                 <th>Description</th>
                <th>Action</th>
              </tr>
            </thead>
           <tbody>
  {groupedOrders
.filter(order => {
  if (!Array.isArray(order.ids)) return true;

  return !order.ids.some(id => hiddenOrders.includes(id));
})
  .map(order => (
    <tr key={order.garment_po_number + "_" + order.dispatch_order_reference}>
      <td>{order.garment_po_number ||"-"}</td>
      <td>{order.Format||"-"}</td>

   <td>
  <select
   
    style={{
      padding: "5px",
      borderRadius: "5px",
      backgroundColor: "#f5f5f5",
      
    }}
  >
    {[...new Set(order.eans)].map((ean, index) => (
      <option key={index}>
        {ean} 
      </option>
    ))} 
  </select>
</td>
                     <td>{order.vendor_name ||"-"}</td>
      <td>{order.dispatch_order_reference ||"-"}</td>
      <td>{order.dispatch_pdc ||"-"}</td>
      <td>{order.tagqty ||"-"}</td>
      <td>{order.desc ||"-"}</td>
                  <td>
                {order.userLocations?.some(loc =>
  userLocations.includes(loc)
) && (
  <button
    className="btn btn-sm btn-primary"
    onClick={() => handleSelectOrder(order)}
  >
    Schedule
  </button>
)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div> 
      )}
        {/* {(statusFilter === "ORDER_RECEIVED" || statusFilter === "") && printingOrders.length > 0 && (
  <>
<h4 className="text-center fw-semibold mt-4">Printing Orders Received</h4>

<table className="table-modern table-bordered">
  <thead>
    <tr>
      <th>PO No</th>
      <th>Customer</th>
      <th>Job Description</th>
      <th>Order Quantity</th>
      <th>Location</th>
      <th>Work order</th>
      <th>Status</th>
      <th>Action</th>
    </tr>
  </thead>

  <tbody>
{printingOrders
  .filter(order => !hiddenOrders.includes(order._id))
  .sort((a, b) => {
    const aAllowed = a.userLocations?.some(loc =>
      userLocations.includes(loc)
    ) ? 1 : 0;

    const bAllowed = b.userLocations?.some(loc =>
      userLocations.includes(loc)
    ) ? 1 : 0;

    return bAllowed - aAllowed;
  })
  .map(order => (
      <tr key={order._id}>
        <td>{order.purchaseOrderNo}</td>
        <td>{order.customerName}</td>
        <td>{order.description}</td>
        <td>{order.quantity}</td>
        <td>{order.location}</td>
        <td>{order.workorder2}</td>

        <td style={{ color: "blue", fontWeight: "bold" }}>
          {order.status}
        </td>

        <td>
         {order.userLocations?.some(loc =>
  userLocations.includes(loc)
) && (
  <button
    className="btn btn-sm btn-primary"
    onClick={() =>
      handleSelectOrder({
        ...order,
        isPrinting: true
      })
    }
  >
    Convert to Work Order
  </button>
)}
        </td>
      </tr>
    ))}
  </tbody>
</table>
</>
)} */}
     {selectedOrder && (
  <div
    ref={formRef}
   className="card shadow mt-4 text-center"
style={{
  padding: "20px",
  background:  "rgba(255, 255, 255, 0.4)"
}}
  >
    <h3>{selectedOrder.status === "PLANNED" ? "Edit Work Order" : "Create Work Order"}</h3>
<form onSubmit={handleSubmitWorkOrder} className="container-fluid">

  <div
    className="p-3 rounded"
    style={{ border: "2px solid #000", padding: "15px" }}
  >
  {/* ===== First Row: Customer → Expected Date ===== */}
 <div
  className="card shadow-lg border-0 mb-3"
  style={{ background: "rgba(255,255,255,0.7)", borderRadius: "12px" }}
>
  <div className="card-body">
    <div className="row g-3 text-center">

      <div className="col-md-3">
  <div className="p-2 border border-dark rounded bg-light">
    <small className="text-black"><b>Customer Name:</b></small>
    <h6>{selectedOrder.vendor_name || selectedOrder.vendor_name || "-"}</h6>
  </div>
</div>

      <div className="col-md-4">
        <div className="p-2 border border-dark rounded bg-light">
          <small className="text-black"><b>Job Description:</b></small>
          <h6>{selectedOrder.desc || selectedOrder.desc || "-"}</h6>
        </div>
      </div>
       <div className="col-md-3">
        <div className="p-2 border border-dark rounded bg-light">
          <small className="text-black"><b>Total Qty:</b></small>
          <h6>{workOrderForm.totalQty}</h6>
        </div>
      </div>
<div className="col-md-3">
  <div className="p-2 border border-dark rounded bg-light">
    <small className="text-black"><b>Order Qty:</b></small>

    <input
      type="number"
      name="orderQty"
     value={workOrderForm.orderQty}
      onChange={handleFormChange}
      className="form-control form-control-sm text-center fw-bold"
      style={{
        border: "none",
        background: "transparent",
        outline: "none"
      }}
      min="0"
      onKeyDown={(e) => {
        if (e.key === "-" || e.key === "e" || e.key === "+") {
          e.preventDefault();
          showAlert("Special characters are not allowed");
        }
      }}
      required
    />
  </div>
</div>
   
      <div className="col-md-3">
        <div className="p-2 border border-dark rounded bg-light text-black">
          <small className="text-black"><b>Total Impression:</b></small>
          <h6>{workOrderForm.totalImp}</h6>
        </div>
      </div>
<div className="col-md-3">
  <div className="p-2 border border-dark rounded bg-light">
    <small><b>Expected Date:</b></small>
   <h6>{formatDispatchDate(selectedOrder?.dispatch_deadline)}</h6>
  </div>
</div>
    </div>
  </div>
</div>
 
  <div
  className="card p-3 mb-3"
  style={{ background: "rgba(255,255,255,0.85)" }}
>
  <h5>Move File</h5>

  {/* FROM (FILE PICKER) */}
<input
  type="file"
  multiple   // 🔥 IMPORTANT
  onChange={(e) => setSelectedFile(e.target.files)}
  className="form-control mb-2"
/>

  {/* TO (FOLDER SELECT) */}
<select
  value={destinationFolder}
  onChange={(e) => setDestinationFolder(e.target.value)}
  className="form-control mb-2"
>
  <option value="">Select Folder</option>

  {folders.map((folder, index) => (
    <option key={index} value={folder}>
      {folder}
    </option>
  ))}
</select>

  <button
    className="btn btn-primary"
    onClick={handleMoveFile}
  >
    Move File
  </button>
</div>
</div>

            <div style={{ marginTop: "10px" }}>
              <div className="form-actions" style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
  <button type="submit" className="btn btn-success">Save Work Order</button>
<button
  type="button"
  onClick={() => {
    if (selectedOrder?.ids?.length) {
      setHiddenOrders(prev =>
        prev.filter(id => !selectedOrder.ids.includes(id))
      );
    }

    setSelectedOrder(null);
  
  }}
  className="btn btn-secondary"
>
  Cancel
</button>
</div>
            </div>
          </form>
        </div>
      )}

      {(statusFilter === "PLANNED" || statusFilter === "") && workOrders.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h4 className="text-center fw-semibold mb-3">RFID Orders</h4>
<div className="premium-toolbar" style={{ border: "1px solid #000", borderRadius: "8px", padding: "10px", marginBottom: "15px" }}>

<div className="toolbar-row">

  {/* LEFT: ACTION BUTTONS */}
  <div className="toolbar-actions">
    <button className="btn btn-success" onClick={downloadExcel}>📊 Download Excel</button>
    <button className="btn btn-secondary" onClick={downloadFormattedPDF}>🏢 Download PDF</button>
  </div>

  {/* RIGHT: FILTERS */}
  <div className="toolbar-filters">
    <div className="input-group">
      <input
        type="text"
        placeholder="🔍 WO Number"
        value={filterWoNo}
        onChange={(e) => setFilterWoNo(e.target.value)}
      />
    </div>


    <select
  value={filterUserLocation}
  onChange={(e) => setFilterUserLocation(e.target.value)}
  className="premium-select border-dark"
>
  <option value="">User Locations</option>

  {[...new Set(workOrders.flatMap(wo => wo.userLocations || []))].map(loc => (
    <option key={loc} value={loc}>{loc}</option>
  ))}
</select>

    <input
      type="date"
      value={dateFrom}
      onChange={(e) => setDateFrom(e.target.value)}
      className="premium-date border-dark"
    />

    <input
      type="date"
      value={dateTo}
      onChange={(e) => setDateTo(e.target.value)}
      className="premium-date border-dark"
    />

    <button
      className="clear-btn"
      onClick={() => {
        setFilterWoNo("");
        setFilterUserLocation("");
        setDateFrom("");
        setDateTo("");
      }}
    >
      Clear
    </button>
  </div>
</div>
</div>

                 <div className="scrollable-table-container">
  <table className="planned-workorders-table" id="planned-workorders-table">
            <thead>
              <tr>
                <th>SL No</th>
                <th>WO NO</th>
                <th>EN No</th> 
                <th>PO No</th>
                <th>Customer Name</th>
                <th>Job Description</th>
                <th>Item</th>
                <th>WO Date</th>
                <th>Order Qty</th>
                <th>Total Impression</th>
                <th>Remarks</th>
                <th>Planning</th>
                <th>User Locations</th>
                <th>Edit</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedWorkOrders.map(wo => (
                <tr key={wo._id}>
                  <td>{wo.slNo}</td>
                  <td>{wo.efiWoNumber}</td>
              <td>
  <select
    style={{
      padding: "5px",
      borderRadius: "5px",
      backgroundColor: "#f5f5f5",
    }}
  >
    {[...new Set((wo.items || []).map(item => item.ean))].map((ean, index) => (
      <option key={index}>
  {ean || wo.enNo}
</option>
    ))}
  </select>
</td>  
                  <td>{wo.purchaseOrderNo || "--"}</td>
                  <td>{wo.customer?.name || wo.customer}</td>
                  <td
  className={expandedCell === wo._id + "job" ? "expanded" : "truncate"}
  onClick={() =>
    setExpandedCell(
      expandedCell === wo._id + "job" ? null : wo._id + "job"
    )
  }
>
 {wo.productName || "-"}
</td>
<td>{wo.Item || "-"}</td>
                  <td>{new Date(wo.createdAt).toLocaleDateString("en-IN")}</td>
                  <td>{wo.orderQty}</td>
                  <td>{wo.totalImp}</td>
  

<td
  className={expandedCell === wo._id + "remarks" ? "expanded" : "truncate"}
  onClick={() =>
    setExpandedCell(expandedCell === wo._id + "remarks" ? null : wo._id + "remarks")
  }
>
  {wo.remarks || "-"}
</td>
<td
  className={expandedCell === wo._id + "planning" ? "expanded" : "truncate"}
  onClick={() =>
    setExpandedCell(
      expandedCell === wo._id + "planning" ? null : wo._id + "planning"
    )
  }
>
  {wo.planningUser
    ? `${wo.planningUser} - ${new Date(wo.createdAt).toLocaleString("en-IN")}`
    : "-"
  }
</td>
<td>
  {wo.userLocations && wo.userLocations.length > 0
    ? wo.userLocations.join(", ")
    : "-"}
</td>
<td>
  {loggedInUser &&
   wo.planningUser &&
   wo.planningUser.trim() === loggedInUser.trim() ? (
    <button
      className="btn btn-primary"
      onClick={() => handleEditWorkOrder(wo)}
    >
      Edit
    </button>
  ) : (
    "-"
  )}
</td>
   


   <td>
  {loggedInUser &&
   wo.planningUser &&
   wo.planningUser.trim() === loggedInUser.trim() ? (
    <button
      className="btn btn-danger"
      onClick={() => handleDeleteWorkOrder(wo._id)}
    >
      Delete
    </button>
  ) : (
    "-"
  )}
</td>

                </tr>
              ))}
            </tbody>
            
          </table>
          </div>
        </div>
      )}
      </div> 
    </div> 
  );
}

export default PlannerDashboard;