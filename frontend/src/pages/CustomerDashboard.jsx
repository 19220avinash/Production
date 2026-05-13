import { useState, useEffect, useRef } from "react";
  import { useNavigate } from "react-router-dom";
  import { jwtDecode } from "jwt-decode";
  import Swal from "sweetalert2";
  import * as XLSX from "xlsx";
  import { saveAs } from "file-saver";
  import axios from "axios";
  import BASE_URL from "../config/api";
  import {
  FaHashtag,
  FaFileAlt,
  FaBarcode,
  FaCalendarAlt,
  FaBoxes,
  FaMapMarkerAlt,
  FaStickyNote,
  FaSave,
  FaFilter,
  FaSearch,
  FaFileExcel
} from "react-icons/fa";

import { MdDescription } from "react-icons/md";
import { BsBoxSeam } from "react-icons/bs";
import { IoMdPricetag } from "react-icons/io";

  function CustomerDashboard() {

    const navigate = useNavigate();
    const [editingDispatchId, setEditingDispatchId] = useState(null);
const [editDispatchForm, setEditDispatchForm] = useState({ total_quantity: "", color_code: "" });
    const [orderCategory, setOrderCategory] = useState("Stationary");
    const [errors, setErrors] = useState({});
    const [showToast, setShowToast] = useState(false);
    const [locations, setLocations] = useState([]);
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [poSearch, setPoSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [expandedCell, setExpandedCell] = useState(null);
  const [customerFilter, setCustomerFilter] = useState("");
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loginLocation, setLoginLocation] = useState("");
  const [dispatchOrders, setDispatchOrders] = useState([]);
  const [dispatchFile, setDispatchFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [productCodeSearch, setProductCodeSearch] = useState("");
  const [attachment, setAttachment] = useState(null);

    const poDateRef = useRef();
    const productCodeRef = useRef();
    const quantityRef = useRef();
    const locationRef = useRef();
    const fileRef = useRef(); 
    const [loggedInUser, setLoggedInUser] = useState("");
    const token = localStorage.getItem("token");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      setLoginLocation(decoded.location);

      console.log("Decoded User:", decoded); // debug

      setLoggedInUser(decoded.name || decoded.username);
    }
  }, []);


  const [form, setForm] = useState({
    purchaseOrderNo: "",
      wono: "",
       enNo: "", 
    poDate: "",
    expectedDeliveryDate :"",
    productCode: "",
    materialType: "",
    description: "",
    customerName: "",
    colorFront: "",
    colorBack: "",
    wasteQty: "",
    jobSize: "",
    inkDetails: "",
    quantity: "",
    location: "",
    orderType: "Inhouse",
    remarks: "",
    remarks2: "", 
  });
const dispatchedCount = dispatchOrders.filter(
  d => d.pdc === "Dispatched"
).length;

const notDispatchedCount = dispatchOrders.filter(
  d => d.pdc !== "Dispatched"
).length;
  // const getMinExpectedDate = () => {
  //   if (!form.poDate) return "";

  //   const date = new Date(form.poDate);
  //   date.setDate(date.getDate() + 14);

  //   return date.toISOString().split("T")[0];
  // };


    // ✅ Fetch Locations + Orders
  useEffect(() => {
  fetchLocations();
  fetchOrders();
  fetchDispatchOrders();   // ✅ ADD THIS
}, []);

    const fetchLocations = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/master/locations`);
        setLocations(res.data);
      } catch {
        setLocations([]);
      }
    };
const fetchDispatchOrders = async () => {
  try {
    const res = await axios.get(
      `${BASE_URL}/api/dispatch-orders`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    setDispatchOrders(res.data);

  } catch (err) {
    console.error("Dispatch fetch error:", err);
    setDispatchOrders([]);
  }
};
    const fetchOrders = async () => {
      try {
       const res = await axios.get(
  `${BASE_URL}/api/customer-orders`,
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);
        setOrders(res.data);
      } catch {
        setOrders([]);
      }
    };
    useEffect(() => {
    const uniqueCustomers = [...new Set(orders.map(o => o.customerName))];
    setCustomers(uniqueCustomers);
  }, [orders]);

    useEffect(() => {
  let filtered = [...orders];

  // PO Number Search
  if (poSearch) {
    filtered = filtered.filter(order =>
      order.purchaseOrderNo?.toString().includes(poSearch)
    );
  }

  // Product Code Search
  if (productCodeSearch) {
    filtered = filtered.filter(order =>
      order.productCode?.toString().includes(productCodeSearch)
    );
  }

  // Date Filter
  if (dateFilter) {
    filtered = filtered.filter(order =>
      order.poDate?.slice(0,10) === dateFilter
    );
  }

  // Customer Filter
  if (customerFilter) {
    filtered = filtered.filter(order =>
      order.customerName?.toLowerCase().includes(customerFilter.toLowerCase())
    );
  }

  setFilteredOrders(filtered);

}, [poSearch, productCodeSearch, dateFilter, customerFilter, orders]);

    const onlyAlphaNumeric = (value) =>
      value.replace(/[^a-zA-Z0-9]/g, "");

    // ✅ Fetch Product Details
    const fetchProductDetails = async (code) => {
      if (!code) return;

      try {
        const res = await axios.get(`${BASE_URL}/api/master/items/${code}`);

      setForm(prev => ({
    ...prev,
    materialType: res.data.materialType,
    description: res.data.description,
    customerName: res.data.customerName,

    colorFront: res.data.colorFront,
    colorBack: res.data.colorBack,
    wasteQty: res.data.wasteQty,
    jobSize: res.data.jobSize,
    inkDetails: res.data.inkDetails
  }));
      } catch {
        setForm(prev => ({
          ...prev,
          materialType: "",
          description: "",
          customerName: ""
        }));
      }
    };
const handleDispatchEdit = (d) => {
  setEditingDispatchId(d._id);
  setEditDispatchForm({ total_quantity: d.total_quantity, color_code: d.color_code ,order_reference: d.order_reference});
};

const handleDispatchSave = async (id) => {
  try {
    await axios.put(
      `${BASE_URL}/api/dispatch-orders/${id}`,
      editDispatchForm,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    Swal.fire({ icon: "success", title: "Updated!", width: "350px", confirmButtonColor: "#3085d6" });
    setEditingDispatchId(null);
    fetchDispatchOrders();
  } catch (err) {
    Swal.fire("Error", "Update failed", "error");
  }
};
    const handleChange = (e) => {
      const { name, value } = e.target;
      let newValue = value;

      if (name === "purchaseOrderNo") {
        let numbersOnly = value.replace(/\D/g, "");

        if (numbersOnly.length > 10) {
          setErrors(prev => ({
            ...prev,
            purchaseOrderNo: "PO Number cannot exceed 10 digits"
          }));
        } else {
          setErrors(prev => ({ ...prev, purchaseOrderNo: "" }));
        }

        newValue = numbersOnly.slice(0, 10);
      }
      if (name === "remarks2") {
  newValue = value.replace(/[^a-zA-Z0-9 ]/g, "");
}

      if (name === "productCode") {
        newValue = onlyAlphaNumeric(value);
        fetchProductDetails(newValue);
      }
      if (name === "remarks") {
    // allow only letters, numbers and spaces
    newValue = value.replace(/[^a-zA-Z0-9 ]/g, "");
  }

      if (name === "quantity" && value < 0) return;
      setErrors(prev => ({
    ...prev,
    [name]: ""
  }));

      setForm(prev => ({
        ...prev,
        [name]: newValue
      }));
    };

    const validateForm = () => {
      let newErrors = {};

  if (orderCategory === "Stationary") {
  if (!form.purchaseOrderNo)
  newErrors.purchaseOrderNo = "Required";


  if (!form.expectedDeliveryDate)
  newErrors.expectedDeliveryDate = "Required";


      if (!form.productCode) newErrors.productCode = "Required";
      if (!form.quantity) newErrors.quantity = "Required";
      if (!form.location) newErrors.location = "Required";
      if (!form.orderType) newErrors.orderType = "Required";
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
  }
  const handleSubmit = async (e) => {
  
    if (!validateForm())
      return;
    
  try {

    let res;

    if (editingId) {

  const formData = new FormData();

  formData.append("productCode", form.productCode);
  formData.append("wono", form.wono);
  formData.append("enNo", form.enNo);
  formData.append("materialType", form.materialType);
  formData.append("description", form.description);
  formData.append("customerName", form.customerName);
  formData.append("colorFront", form.colorFront);
  formData.append("colorBack", form.colorBack);
  formData.append("wasteQty", form.wasteQty);
  formData.append("jobSize", form.jobSize);
  formData.append("inkDetails", form.inkDetails);
  formData.append("quantity", form.quantity);
  formData.append("location", form.location);
  formData.append("orderType", form.orderType);
  formData.append("remarks", form.remarks);
  formData.append("remarks2", form.remarks2);
  formData.append("user", loggedInUser);


  if (attachment) {
    formData.append("attachment", attachment);
  }

  if (orderCategory === "Stationary") {
    formData.append("purchaseOrderNo", form.purchaseOrderNo);
    formData.append("poDate", form.poDate);
    formData.append("expectedDeliveryDate", form.expectedDeliveryDate);
  }

  res = await axios.put(
  `${BASE_URL}/api/customer-orders/${editingId}`,
  formData,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data"
    }
  }
);
  } else {

  const formData = new FormData();

  formData.append("productCode", form.productCode);
  formData.append("wono", form.wono);
  formData.append("enNo", form.enNo);
  formData.append("materialType", form.materialType);
  formData.append("description", form.description);
  formData.append("customerName", form.customerName);
  formData.append("colorFront", form.colorFront);
  formData.append("colorBack", form.colorBack);
  formData.append("wasteQty", form.wasteQty);
  formData.append("jobSize", form.jobSize);
  formData.append("inkDetails", form.inkDetails);
  formData.append("quantity", form.quantity);
  formData.append("location", form.location);
  formData.append("orderType", form.orderType);
  formData.append("remarks", form.remarks);
  formData.append("remarks2", form.remarks2);
  formData.append("user", loggedInUser);


  if (attachment) {
    formData.append("attachment", attachment);
  }

  if (orderCategory === "Stationary") {
    formData.append("purchaseOrderNo", form.purchaseOrderNo);
    formData.append("poDate", form.poDate);
    formData.append("expectedDeliveryDate", form.expectedDeliveryDate);
  }

  res = await axios.post(
  `${BASE_URL}/api/customer-orders`,
  formData,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data"
    }
  }
);

}

    // ✅ success check
    if (res.status === 200 || res.status === 201) {

 Swal.fire({
  icon: "success",
  title: "Success",
  text: editingId
    ? "Order Updated Successfully"
    : "Order Saved Successfully",
  width: "350px",        // 👈 reduce box width
  confirmButtonColor: "#3085d6"
});

      fetchOrders();

      setForm({
        purchaseOrderNo: "",
        wono: "",
        enNo:"",
        poDate: "",
        expectedDeliveryDate: "",
        productCode: "",
        materialType: "",
        description: "",
        customerName: "",
        colorFront: "",
        colorBack: "",
        wasteQty: "",
        jobSize: "",
        inkDetails: "",
        quantity: "",
        location: "",
       orderType: orderCategory === "Security" ? "Inhouse" : "",
        remarks: "",
        remarks2: "" 
      });
       setAttachment(null);   // ✅ ADD THIS

if (fileRef.current) {
  fileRef.current.value = "";   // ✅ reset file input
}

      setEditingId(null);
      setErrors({});
    }

  } catch (err) {

    console.error("Save Error:", err);

   Swal.fire({
  icon: "error",
  title: "Error",
  text: err.response?.data?.message || "Server error while saving order",
  confirmButtonColor: "#d33"
});

  }
  };
  const handleEdit = (order) => {

  setEditingId(order._id);

  // 🔹 Detect category based on PO number
  if (!order.purchaseOrderNo) {
    setOrderCategory("Security");
  } else {
    setOrderCategory("Stationary");
  }

  setForm({
    purchaseOrderNo: order.purchaseOrderNo || "",
    wono: order.wono || "",
    enNo: order.enNo || "",
    poDate: order.poDate?.slice(0,10) || "",
    expectedDeliveryDate: order.expectedDeliveryDate?.slice(0,10) || "",

    productCode: order.productCode,
    materialType: order.materialType,
    description: order.description,
    customerName: order.customerName,

    colorFront: order.colorFront,
    colorBack: order.colorBack,
    wasteQty: order.wasteQty,
    jobSize: order.jobSize,
    inkDetails: order.inkDetails,

    quantity: order.quantity,
    location: order.location?._id,
    orderType: order.orderType || "",
    remarks: order.remarks || "",
    remarks2: order.remarks2 || ""
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
};
  const handleDelete = async (id) => {

  const result = await Swal.fire({
    title: "Delete Order",
    text: "Enter reason for deleting:",
    input: "textarea",   // 🔥 input box
    inputPlaceholder: "Type reason here...",
    inputAttributes: {
      maxlength: 200
    },
    showCancelButton: true,
    confirmButtonText: "Delete",
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    width: "350px",

    // 🔥 validation
    preConfirm: (value) => {
      if (!value) {
        Swal.showValidationMessage("Reason is required!");
      }
      return value;
    }
  });

  if (!result.isConfirmed) return;

  const reason = result.value; // 🔥 get reason

  try {

    await axios.delete(`${BASE_URL}/api/dispatch-orders/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: { reason }   // 🔥 send reason
    });

    Swal.fire({
      icon: "success",
      title: "Deleted!",
      text: "Order deleted successfully",
      width: "350px"
    });

    fetchDispatchOrders();

  } catch (err) {
    Swal.fire("Error", "Delete failed", "error");
  }
};
const handleExcelUpload = async (e) => {
  e.preventDefault();

  if (!attachment) {
    Swal.fire("Error", "Please upload Excel file", "error");
    return;
  }

  const reader = new FileReader();

  reader.onload = async (evt) => {
    const data = new Uint8Array(evt.target.result);
    const workbook = XLSX.read(data, { type: "array" });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(sheet);

const jsonData = rawData.map(row => {
  const cleanRow = {};

  // 🔥 normalize keys (remove spaces + lowercase)
  Object.keys(row).forEach(key => {
    cleanRow[key.trim().toLowerCase()] = row[key];
  });

  return {
    Format: cleanRow["format"],
    garment_po_number: cleanRow["garment po number"],
    supplier_id: cleanRow["supplier id"],
    vendor_name: cleanRow["vendor name"],
    style_code: cleanRow["style code"],
    color: cleanRow["color"],
    size: cleanRow["size"],
    metsize: cleanRow["metsize"],
    label_type: cleanRow["label type"],
    desc: cleanRow["desc"],
    yrmonth: cleanRow["yrmonth"],
    mrp: Number(cleanRow["mrp"]) || 0,
    ean: cleanRow["ean"],
    article_number: cleanRow["article number"],
    tag_qty: Number(cleanRow["tag qty"]) || 0,
    segment: cleanRow["segment"],
    family: cleanRow["family"],
    class: cleanRow["class"],
    fashion_grade: cleanRow["fashion grade"],
    fashion_grade_desc: cleanRow["fashion grade desc"],
    brand_description: cleanRow["brand description"],
    tag_type: cleanRow["tagtype"],
    tag_size: cleanRow["tagsize"],
    manufacture_address: cleanRow["manufactureaddress"],
    country_of_origin: cleanRow["countryoforigin"],
    usp: cleanRow["usp"]
  };
});

    try {
await axios.post(
  `${BASE_URL}/api/customer-orders/excel-upload`,
  {
    data: jsonData,
    fileName: attachment.name   // ⭐ IMPORTANT
  },
  {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);

      Swal.fire("Success", "Excel Uploaded Successfully", "success");
      fetchOrders();

    } catch (err) {
      Swal.fire("Error", "Upload failed", "error");
    }
  };

  reader.readAsArrayBuffer(attachment);
};

const handleDispatchUpload = async () => {

  if (!dispatchFile) {
    Swal.fire("Error", "Please upload dispatch file", "error");
    return;
  }

  const reader = new FileReader();

  reader.onload = async (evt) => {
    const data = new Uint8Array(evt.target.result);
    const workbook = XLSX.read(data, { type: "array" });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
   const rawData = XLSX.utils.sheet_to_json(sheet, {
  range: 1   // 👈 skip first row (title row)
});
    

    const fileName = dispatchFile.name;
const normalize = (str) =>
  str?.toString().toLowerCase().replace(/[^a-z0-9]/g, "");

const getValue = (obj, searchKey) => {
  const normalizedSearch = normalize(searchKey);

  const foundKey = Object.keys(obj).find(k =>
    normalize(k).includes(normalizedSearch)
  );

  return foundKey ? obj[foundKey] : "";
};

const formatDate = (value) => {
  if (!value) return "";

  // Excel numeric date
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    return `${date.d}-${date.m}-${date.y}`;
  }

  return value.toString().trim();
};

const jsonData = rawData.map(row => {
  const cleanRow = {};

  Object.keys(row).forEach(key => {
    cleanRow[key.trim().toLowerCase()] = row[key];
  });

  return {
    vendor_name: getValue(cleanRow, "vendor name"),
    brand: getValue(cleanRow, "brand"),
    sub_brand: getValue(cleanRow, "sub brand"),
    order_reference: getValue(cleanRow, "order reference"),
    order_date: formatDate(getValue(cleanRow, "order date")),
    total_quantity: Number(getValue(cleanRow, "total quantity")) || 0,
    remarks: getValue(cleanRow, "remarks"),
    color_code: getValue(cleanRow, "color code"),
    order_status: getValue(cleanRow, "order status"),
    pdc: formatDate(getValue(cleanRow, "pdc")),
    deadline: formatDate(getValue(cleanRow, "deadline")),
    excel_file_name: fileName
  };
});

    try {
      await axios.post(`${BASE_URL}/api/dispatch-orders/upload`, jsonData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Swal.fire("Success", "Dispatch Uploaded", "success");
      fetchDispatchOrders();

    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Upload failed", "error");
    }
  };

  reader.readAsArrayBuffer(dispatchFile);
};

  const truncateText = (text, length = 25) => {
  if (!text) return "-";
  return text.length > length ? text.substring(0, length) + "..." : text;
};

const fileSummary = Object.values(
  filteredOrders.reduce((acc, order) => {
    const file = order.excel_file_name || "Unknown File";

    if (!acc[file]) {
      acc[file] = {
        fileName: file,
        totalTagQty: 0
      };
    }

    acc[file].totalTagQty += Number(order.tag_qty) || 0;

    return acc;
  }, {})
);
const approvedQty = dispatchOrders
  .filter(d => d.pdc === "Dispatched")
  .reduce((sum, d) => sum + Number(d.total_quantity || 0), 0);

const pendingQty = dispatchOrders
  .filter(d => d.pdc !== "Dispatched")
  .reduce((sum, d) => sum + Number(d.total_quantity || 0), 0);

const totalQty = approvedQty + pendingQty;
return (
  <div
    className="d-flex justify-content-center align-items-start py-4"
    style={{
      minHeight: "100vh",
      background: "linear-gradient(rgba(255, 255, 255, 0.61), rgba(255, 255, 255, 0.41)), url('/cust.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundAttachment:"fixed"
    }}
  >
    <div
  className="container p-3 rounded"
  style={{
    maxWidth: "1200px",
    background: "transparent",   // ✅ FULLY TRANSPARENT
    backdropFilter: "none"       // ❌ remove blur if you want pure transparent
  }}
>

        {/* Toast */}
        <div
    className={`position-fixed top-0 start-50 translate-middle-x mt-3 ${
      showToast ? "show" : "d-none"
    }`}
    style={{ zIndex: 9999 }}
  >
    <div className="toast show">
      <div className="toast-body bg-success text-white rounded shadow text-center px-4">
        Saved Successfully
      </div>
    </div>
  </div>

<div
  className="card shadow-sm rounded-3"
  style={{
    background:  "rgba(255, 255, 255, 0.53)",   // ✅ no white layer
    border: "2px solid #000",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)"
  }}
>
          <div className="card-body p-3">

     <div
  className="text-center py-4 mb-4 rounded-3"
  style={{
    background:  "rgba(255, 255, 255, 0.42)",// light white
    border: "2px solid #000000",
    boxShadow: "0 4px 8px rgba(255, 255, 255, 0)" // soft shadow
  }}
>
<div className="d-flex justify-content-center align-items-center gap-2">
  <i className="bi bi-box-seam fs-3 text-dark"></i>
<h4 className="fw-bold m-0">RFID Order Entry</h4>
</div>
</div>

        <form
  onSubmit={async (e) => {
    e.preventDefault();

    if (!attachment && !dispatchFile) {
      Swal.fire("Error", "Please upload at least one file", "error");
      return;
    }

    try {
    
      if (dispatchFile) {
        await handleDispatchUpload();
      }
     
      if (attachment) {
        await handleExcelUpload(e);
      }

      Swal.fire("Success", "Upload Completed", "success");

    } catch (err) {
      Swal.fire("Error", "Upload failed", "error");
    }
  }}>
  <div className="text-center p-4">
 <h4 className="mt-3">Upload Approved Orders Excel</h4>
    {/* Excel File */}
    <input
      type="file"
      accept=".xlsx,.xls"
      onChange={(e) => setAttachment(e.target.files[0])}
      className="form-control w-25 mx-auto border-dark"
    />

    {/* Dispatch File */}
    <h4 className="mt-3">Upload OrderList Excel</h4>
    <input
      type="file"
      accept=".xlsx,.xls"
      onChange={(e) => setDispatchFile(e.target.files[0])}
      className="form-control w-25 mx-auto border-dark"
    />

    <button className="btn btn-success mt-3">
      Upload Files
    </button>

  </div>
</form>
          </div>
        </div>
   <div style={{
  display: "flex",
  justifyContent: "center",
  marginBottom: "15px"
}}>
  <div style={{
    background: "rgba(255, 255, 255, 0.92)",
    backdropFilter: "blur(8px)",
    padding: "6px 18px",
    borderRadius: "30px",
    border: "1px solid rgba(255,255,255,0.3)",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
  }}>
    <h5 style={{
      margin: 0,
      fontWeight: "600",
      color: "#111"
    }}>
      📦 PDC Summary
    </h5>
  </div>
</div>

<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "22px",
    marginBottom: "25px"
  }}
>

  {/* ✅ DISPATCHED */}
  <div
    style={{
      background: "rgba(255,255,255,0.65)",
      backdropFilter: "blur(10px)",
      borderRadius: "16px",
      padding: "18px",
      borderLeft: "14px solid #28a745",
      boxShadow: "0 6px 18px rgba(10, 10, 10, 0.98)",
      transition: "all 0.3s ease",
      cursor: "pointer"
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-5px)";
      e.currentTarget.style.boxShadow = "0 12px 25px rgba(0,0,0,0.25)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.15)";
    }}
  >
    <div  style={{ fontSize: "14px", color: "#000" }}>
      Approved Orders
    </div>

    <h2 style={{ marginTop: "10px", fontWeight: "bold" }}>
      {dispatchedCount}
    </h2>
  </div>


  {/* ❌ NOT DISPATCHED */}
  <div
    style={{
      background: "rgba(255,255,255,0.65)",
      backdropFilter: "blur(10px)",
      borderRadius: "16px",
      padding: "18px",
      borderLeft: "14px solid #dc3545",
      boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
      transition: "all 0.3s ease",
      cursor: "pointer"
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-5px)";
      e.currentTarget.style.boxShadow = "0 12px 25px rgba(0,0,0,0.25)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.15)";
    }}
  >
    <div  style={{ fontSize: "14px", color: "#000" }}>
      Pending Orders
    </div>

    <h2 style={{ marginTop: "10px", fontWeight: "bold" }}>
      {notDispatchedCount}
    </h2>
  </div>


  {/* 📦 TOTAL */}
  <div
    style={{
      background: "rgba(255,255,255,0.65)",
      backdropFilter: "blur(10px)",
      borderRadius: "16px",
      padding: "18px",
      borderLeft: "14px solid #090a0a",
      boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
      transition: "all 0.3s ease",
      cursor: "pointer"
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-5px)";
      e.currentTarget.style.boxShadow = "0 12px 25px rgba(0,0,0,0.25)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.15)";
    }}
  >
   <div style={{ fontSize: "14px", color: "#000" }}>
  Total Orders
</div>
    <h2 style={{ marginTop: "10px", fontWeight: "bold" }}>
      {dispatchedCount + notDispatchedCount}
    </h2>

  </div>

</div>
<div style={{
  display: "flex",
  justifyContent: "center",
  marginBottom: "15px"
}}>
  <div style={{
    background: "rgba(255, 255, 255, 0.94)",
    backdropFilter: "blur(8px)",
    padding: "6px 18px",
    borderRadius: "30px",
    border: "1px solid rgba(255,255,255,0.3)",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
  }}>
    <h5 style={{
      margin: 0,
      fontWeight: "600",
      color: "#111",
      letterSpacing: "0.5px"
    }}>
      📊 Order Quantity Summary
    </h5>
  </div>
</div>

<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "22px",
    marginBottom: "30px"
  }}
>

  {/* ✅ APPROVED */}
  <div
    style={{
      background: "rgba(255, 255, 255, 0.65)",
      backdropFilter: "blur(10px)",
      borderRadius: "16px",
      padding: "18px",
      borderLeft: "14px solid #28a745",
      boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
      transition: "all 0.3s ease",
      cursor: "pointer"
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-5px)";
      e.currentTarget.style.boxShadow = "0 12px 25px rgba(0,0,0,0.25)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.15)";
    }}
  >
    <div  style={{ fontSize: "14px", color: "#000" }}>
      Approved Quantity
    </div>

    <h2 style={{ marginTop: "10px", fontWeight: "bold" }}>
      {approvedQty.toLocaleString("en-IN")}
    </h2>
  </div>


  {/* ❌ PENDING */}
  <div
    style={{
      background: "rgba(255,255,255,0.65)",
      backdropFilter: "blur(10px)",
      borderRadius: "16px",
      padding: "18px",
      borderLeft: "14px solid #dc3545",
      boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
      transition: "all 0.3s ease",
      cursor: "pointer"
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-5px)";
      e.currentTarget.style.boxShadow = "0 12px 25px rgba(0,0,0,0.25)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.15)";
    }}
  >
    <div  style={{ fontSize: "14px", color: "#000" }}>
      Pending Quantity
    </div>

    <h2 style={{ marginTop: "10px", fontWeight: "bold" }}>
      {pendingQty.toLocaleString("en-IN")}
    </h2>

  
  </div>


  {/* 📦 TOTAL */}
  <div
    style={{
      background: "rgba(255,255,255,0.65)",
      backdropFilter: "blur(10px)",
      borderRadius: "16px",
      padding: "18px",
      borderLeft: "14px solid #000102",
      boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
      transition: "all 0.3s ease",
      cursor: "pointer"
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-5px)";
      e.currentTarget.style.boxShadow = "0 12px 25px rgba(0,0,0,0.25)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.15)";
    }}
  >
    <div  style={{ fontSize: "14px", color: "#000" }}>
      Total Quantity
    </div>

    <h2 style={{ marginTop: "10px", fontWeight: "bold" }}>
      {totalQty.toLocaleString("en-IN")}
    </h2>
  </div>

</div>
      {/* SAVED ORDERS TABLE */}
<div
  className="card mt-4 p-4 rounded-4"
  style={{
    background: "#ffffff61",               // light white background
    boxShadow: "0 4px 12px rgba(236, 229, 236, 0.15)", // subtle shadow
   border: "2px solid #000",                // remove any border if desired
  }}
>
 
  <div className="card-body text-center">
    <h5 className="fw-semibold mb-3">Approved Orders</h5>

    <div
      className="table-responsive"
      style={{ maxHeight: "400px", overflowY: "auto" }}
    >
      <table className="table border-black table-bordered table-hover align-middle text-center bg-white">
        <thead className="table-dark sticky-top">
  <tr>
   
 <th>Format</th>
  <th>Garment PO</th>
  <th>Supplier ID</th>
  <th>Vendor</th>
  <th>Style Code</th>
  <th>Color</th>
  <th>Size</th>
  <th>Metsize</th>
  <th>Label Type</th>
  <th>Desc</th>
  <th>YrMonth</th>
  <th>MRP</th>
  <th>EAN</th>
  <th>Article No</th>
  <th>Tag Qty</th>
  <th>Segment</th>
  <th>Family</th>
  <th>Class</th>
  <th>Fashion Grade</th>
  <th>Fashion Grade Desc</th>
  <th>Brand Desc</th>
  <th>Tag Type</th>
  <th>Tag Size</th>
  <th>Manufacture Address</th>
  <th>Country</th>
  <th>USP</th>

  {/* LAST */}
  <th>User</th>
  <th>Excel File</th>
  <th>User Location</th>
  </tr>
</thead>
        <tbody>
  {filteredOrders.length === 0 ? (
    <tr>
      <td colSpan="14">No Orders Found</td>
    </tr>
  ) : (
    filteredOrders.slice(0, 50).map((order) => (
      <tr key={order._id}>
      
       <td>{order.Format || "-"}</td>
  <td>{order.garment_po_number || "-"}</td>
  <td>{order.supplier_id || "-"}</td>
  <td>{order.vendor_name || "-"}</td>
  <td>{order.style_code || "-"}</td>
  <td>{order.color || "-"}</td>
  <td>{order.size || "-"}</td>
  <td>{order.metsize || "-"}</td>
  <td>{order.label_type || "-"}</td>
  <td>{order.desc || "-"}</td>
  <td>{order.yrmonth || "-"}</td>
  <td>{order.mrp || "-"}</td>
  <td>{order.ean || "-"}</td>
  <td>{order.article_number || "-"}</td>
  <td>{order.tag_qty || "-"}</td>
  <td>{order.segment || "-"}</td>
  <td>{order.family || "-"}</td>
  <td>{order.class || "-"}</td>
  <td>{order.fashion_grade || "-"}</td>
  <td>{order.fashion_grade_desc || "-"}</td>
  <td>{order.brand_description || "-"}</td>
  <td>{order.tag_type || "-"}</td>
  <td>{order.tag_size || "-"}</td>
  <td>{order.manufacture_address || "-"}</td>
  <td>{order.country_of_origin || "-"}</td>
  <td>{order.usp || "-"}</td>

  {/* LAST */}
  <td>{order.user || "-"}</td>
  <td>{order.excel_file_name || "-"}</td>
  <td>{order.userLocations?.join(", ") || "-"}</td>

      </tr>
    ))
  )}
</tbody>
      </table>
    </div>
  </div>
</div>
{/* DISPATCH TABLE */}
 <div
  className="card mt-4 p-4 rounded-4"
  style={{
    background: "#ffffff61",               // light white background
    boxShadow: "0 4px 12px rgba(236, 229, 236, 0.15)", // subtle shadow
   border: "2px solid #000",                // remove any border if desired
  }}
>
  <div className="card-body text-center">
    <h5 className="fw-semibold mb-3 text-black"> OrdersList</h5>

    <div
      className="table-responsive"
      style={{ maxHeight: "400px", overflowY: "auto" }}
    >
       <table className="table border-black table-bordered table-hover align-middle text-center bg-white">
        <thead className="table-dark sticky-top">
          <tr>
            <th>Vendor</th>
            <th>Brand</th>
            <th>Sub Brand</th>
            <th>Order Ref</th>
            <th>Order Date</th>
            <th>Total Qty</th>
            <th>Remarks</th>
            <th>Color</th>
            <th>Status</th>
            <th>PDC</th>
            <th>Deadline</th>
            <th>File</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
  {dispatchOrders.length === 0 ? (
    <tr>
      <td colSpan="13">No Data</td>
    </tr>
  ) : (
    dispatchOrders.slice(0, 70).map((d) => (
      <tr key={d._id}>
        <td>{d.vendor_name || "-"}</td>
        <td>{d.brand || "-"}</td>
        <td>{d.sub_brand || "-"}</td>
<td>
  {editingDispatchId === d._id ? (
    <input
      type="text"
      className="form-control form-control-sm"
      style={{ width: "110px", margin: "auto" }}
      value={editDispatchForm.order_reference}
      onChange={(e) => setEditDispatchForm(p => ({ ...p, order_reference: e.target.value }))}
    />
  ) : (
    d.order_reference || "-"
  )}
</td>
        <td>{d.order_date || "-"}</td>

        {/* Total Qty — editable */}
        <td>
          {editingDispatchId === d._id ? (
            <input
              type="number"
              className="form-control form-control-sm"
              style={{ width: "90px", margin: "auto" }}
              value={editDispatchForm.total_quantity}
              onChange={(e) => setEditDispatchForm(p => ({ ...p, total_quantity: e.target.value }))}
            />
          ) : (
            d.total_quantity || "-"
          )}
        </td>

        <td>{d.remarks || "-"}</td>

        {/* Color — editable */}
        <td>
          {editingDispatchId === d._id ? (
            <input
              type="text"
              className="form-control form-control-sm"
              style={{ width: "90px", margin: "auto" }}
              value={editDispatchForm.color_code}
              onChange={(e) => setEditDispatchForm(p => ({ ...p, color_code: e.target.value }))}
            />
          ) : (
            d.color_code || "-"
          )}
        </td>

        <td>{d.order_status || "-"}</td>
        <td>{d.pdc || "-"}</td>
        <td>{d.deadline || "-"}</td>
        <td>{d.excel_file_name || "-"}</td>

        <td>
          <div className="d-flex gap-1 justify-content-center flex-wrap">
            {d.user === loggedInUser && (
              editingDispatchId === d._id ? (
                <>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handleDispatchSave(d._id)}
                  >
                    Save
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => setEditingDispatchId(null)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-sm btn-warning"
                  onClick={() => handleDispatchEdit(d)}
                >
                  Edit
                </button>
              )
            )}
            <button
              className="btn btn-sm btn-danger"
              onClick={() => handleDelete(d._id)}
            >
              Delete
            </button>
          </div>
        </td>
      </tr>
    ))
  )}
</tbody>
      </table>
    </div>
  </div>
</div>
      </div>
      </div>
    );
  }

  export default CustomerDashboard;