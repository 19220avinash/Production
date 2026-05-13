import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import BASE_URL from "../config/api";
export default function DashboardLayout() {

  const [loggedInUser, setLoggedInUser] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
const [showChangePassword, setShowChangePassword] = useState(false);
const [cpForm, setCpForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
const [cpErrors, setCpErrors] = useState({});
const [showCurrent, setShowCurrent] = useState(false);
const [showNew, setShowNew] = useState(false);
const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setCollapsed(true);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      setLoggedInUser((decoded.role || "user").toLowerCase());
    }

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleChangePassword = async () => {
  const newErrors = {};
  if (!cpForm.currentPassword) newErrors.currentPassword = "Required";
  if (!cpForm.newPassword) newErrors.newPassword = "Required";
  else if (cpForm.newPassword.length < 12) newErrors.newPassword = "Min 12 characters";
  if (!cpForm.confirmPassword) newErrors.confirmPassword = "Required";
  else if (cpForm.newPassword !== cpForm.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
  setCpErrors(newErrors);
  if (Object.keys(newErrors).length > 0) return;

  try {
    const token = localStorage.getItem("token");
    await axios.put(
      `${BASE_URL}/api/auth/change-password`,
      { currentPassword: cpForm.currentPassword, newPassword: cpForm.newPassword },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    alert("Password changed successfully!");
    setCpForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setCpErrors({});
    setShowChangePassword(false);
  } catch (err) {
    alert(err.response?.data?.message || "Failed to change password");
  }
};
  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // 🔥 Reduced sidebar width
  const sidebarWidth = collapsed ? "70px" : "200px";

  const menuItems = [
    { to: "/admin", icon: "bi-grid", label: "Masters", roles: ["admin"] },
    { to: "/internal/register", icon: "bi-person-plus", label: "User Register", roles: ["admin"] },
    { to: "/customer-dashboard", icon: "bi-card-list", label: "Order system", roles: ["admin","planner","purchase order"] },
    { to: "/planner", icon: "bi-calendar-check", label: "Scheduling", roles: ["admin","planner"] },
    { to: "/production-real", icon: "bi-gear-fill", label: "Production Entry", roles: ["admin","production"] },
    { to: "/production-report", icon:"bi-bar-chart", label:"Production Report", roles:["admin","production"] },
    { to: "/dispatch", icon: "bi-truck", label: "Dispatch Management", roles: ["admin","dispatch"] },
    { to: "/scan-qr", icon: "bi-upc-scan", label: "QR Scanner", roles: ["admin"] },
  ];

  const filteredMenu = menuItems.filter((item) =>
    item.roles.includes(loggedInUser)
  );

  const getDashboardTitle = () => {
    return "RFID TRACKER";
  };

  return (
    <div className="d-flex" style={{ overflowX: "hidden", background: "#eaf6fb" }}>

      {/* SIDEBAR */}
      <aside
        className="position-fixed d-flex flex-column"
        style={{
          width: sidebarWidth,
          transition: "all 0.3s ease",
          zIndex: 1050,
          left: isMobile ? (collapsed ? "-240px" : "0") : "0",
          top: 0,
          height: "100vh",
          background: "#104ca1",
          color: "#fff"
        }}>


        {/* MENU */}
        <nav className="nav flex-column p-3 gap-4 flex-grow-1">
          {filteredMenu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => isMobile && setCollapsed(true)}
              style={({ isActive }) => ({
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px",
                borderRadius: "6px",
                textDecoration: "none",
                background: isActive ? "#e0e3e5" : "transparent",
                color: isActive ? "#0f172a" : "#ffffff",
                fontSize: "14px",
                transition: "0.2s"
              })}
              onMouseEnter={(e) => {
                if (!e.currentTarget.classList.contains("active"))
                  e.currentTarget.style.background = "#38bdf8";
              }}
              onMouseLeave={(e) => {
                if (!e.currentTarget.classList.contains("active"))
                  e.currentTarget.style.background = "transparent";
              }}
            >
              <i className={`bi ${item.icon}`}></i>
              {!collapsed && item.label}
            </NavLink>
          ))}
        </nav>

        {/* FOOTER */}
       {/* FOOTER */}
<div className="p-2 text-center border-top">

  {!collapsed && (
    <>
      <div style={{ fontSize: "12px", opacity: 0.8 }}>Logged in as</div>
      <div className="fw-semibold text-capitalize">
        {loggedInUser}
      </div>
    </>
  )}

  <button
    onClick={logout}
    className="btn mt-2 d-flex align-items-center justify-content-center"
    style={{
      width: collapsed ? "40px" : "100%",
      margin: "0 auto",
      background: "#ffffff",
      color: "#0ea5e9",
      fontWeight: "600",
      padding: collapsed ? "8px" : "8px 12px"
    }}>
    <i className="bi bi-box-arrow-right"></i>
    {!collapsed && <span className="ms-2">Logout</span>}
  </button>
</div>

 </aside>
      {/* MAIN AREA */}
      <div
        className="flex-grow-1"
        style={{
          marginLeft: isMobile ? "0" : sidebarWidth,
          transition: "margin-left 0.3s ease",
          width: "100%",
          minHeight: "100vh"
        }}>

        {/* 🔥 FIXED TOPBAR */}
        <div
          className="px-3 px-md-4 py-2 position-fixed d-flex align-items-center"
          style={{
            background: "#104ca1",
            color: "#fff",
            height: "70px",
            top: 0,
            left: isMobile ? "0" : sidebarWidth,
            width: isMobile ? "100%" : `calc(100% - ${sidebarWidth})`,
            zIndex: 1000
          }}
        >

          {/* LEFT */}
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-light"
              onClick={() => setCollapsed(!collapsed)}
            >
              <i className="bi bi-list"></i>
            </button>
          </div>
<img
  src="/Logo.png"
  alt="logo"
  style={{
    height: "45px",
    position: "absolute",
    left: "10%",
    transform: "translateX(-10%)"
  }}
/>
          {/* CENTER TITLE */}
          <h4
            className="m-0 fw-bold text-uppercase"
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              letterSpacing: "1.5px",
              fontSize: "22px"
            }}
          >
            {getDashboardTitle()}
          </h4>

          {/* RIGHT */}
          <div className="ms-auto dropdown">
            <button
              className="btn btn-light dropdown-toggle"
              data-bs-toggle="dropdown"
            >
              <i className="bi bi-person-circle"></i>
            </button>

     <ul
  className="dropdown-menu dropdown-menu-end text-center"
  style={{
    minWidth: "150px",
    borderRadius: "12px",
    padding: "10px",
    border: "1px solid #dbeafe",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
  }}
>
  <li
    className="dropdown-item-text text-capitalize fw-bold"
    style={{
      color: "#104ca1",
      fontSize: "16px"
    }}
  >
    <i className="bi bi-person-circle me-2"></i>
    {loggedInUser}
  </li>

  <li>
    <hr className="dropdown-divider" />
  </li>

  <li className="d-flex justify-content-center">
    <button
      className="dropdown-item text-center rounded"
      style={{
        width: "100%"
      }}
      onClick={() => setShowChangePassword(true)}
    >
      🔐Change Password
    </button>
  </li>

  <li className="d-flex justify-content-center mt-2">
    <button
      className="dropdown-item text-danger text-center rounded"
      style={{
        width: "90%"
      }}
      onClick={logout}
    >
      <i className="bi bi-box-arrow-right me-2"></i>
      Logout
    </button>
  </li>
</ul>

{/* CHANGE PASSWORD MODAL */}
{showChangePassword && (
  <>
    <div
      onClick={() => setShowChangePassword(false)}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1050 }}
    />
    <div style={{
      position: "fixed", top: "50%", left: "50%",
      transform: "translate(-50%, -50%)", zIndex: 1055,
      width: "100%", maxWidth: "420px",
      background: "rgba(255,255,255,0.95)",
      backdropFilter: "blur(12px)", borderRadius: "16px",
      border: "2px solid #000",
      boxShadow: "0 8px 24px rgba(0,0,0,0.3)", padding: "30px"
    }}>
      <h5 className="text-center fw-bold mb-4">🔐 Change Password</h5>

      {/* Current Password */}
      <div className="mb-3">
        <label className="form-label fw-semibold">Current Password</label>
        <div className="input-group">
          <input
            type={showCurrent ? "text" : "password"}
            className={`form-control border-dark ${cpErrors.currentPassword ? "is-invalid" : ""}`}
            value={cpForm.currentPassword}
            onChange={(e) => setCpForm(p => ({ ...p, currentPassword: e.target.value }))}
            placeholder="Enter current password"
          />
          <button type="button" className="btn btn-outline-secondary"
            onClick={() => setShowCurrent(p => !p)}>
            {showCurrent ? "👁️" : "🙈"}
          </button>
          {cpErrors.currentPassword && <div className="invalid-feedback">{cpErrors.currentPassword}</div>}
        </div>
      </div>

      {/* New Password */}
      <div className="mb-3">
        <label className="form-label fw-semibold">New Password</label>
        <div className="input-group">
          <input
            type={showNew ? "text" : "password"}
            className={`form-control border-dark ${cpErrors.newPassword ? "is-invalid" : ""}`}
            value={cpForm.newPassword}
            onChange={(e) => setCpForm(p => ({ ...p, newPassword: e.target.value }))}
            placeholder="Min 12 characters"
          />
          <button type="button" className="btn btn-outline-secondary"
            onClick={() => setShowNew(p => !p)}>
            {showNew ? "👁️" : "🙈"}
          </button>
          {cpErrors.newPassword && <div className="invalid-feedback">{cpErrors.newPassword}</div>}
        </div>
      </div>

      {/* Confirm Password */}
      <div className="mb-4">
        <label className="form-label fw-semibold">Confirm New Password</label>
        <div className="input-group">
          <input
            type={showConfirm ? "text" : "password"}
            className={`form-control border-dark ${cpErrors.confirmPassword ? "is-invalid" : ""}`}
            value={cpForm.confirmPassword}
            onChange={(e) => setCpForm(p => ({ ...p, confirmPassword: e.target.value }))}
            placeholder="Re-enter new password"
          />
          <button type="button" className="btn btn-outline-secondary"
            onClick={() => setShowConfirm(p => !p)}>
            {showConfirm ? "👁️" : "🙈"}
          </button>
          {cpErrors.confirmPassword && <div className="invalid-feedback">{cpErrors.confirmPassword}</div>}
        </div>
      </div>
      <div className="d-flex gap-2">
        <button className="btn btn-primary w-100" onClick={handleChangePassword}>
          Update Password
        </button>
        <button className="btn btn-secondary w-100" onClick={() => setShowChangePassword(false)}>
          Cancel
        </button>
      </div>
    </div>
  </>
)}
          </div>

        </div>

        {/* 🔥 CONTENT (SHIFTED DOWN) */}
        <div
          className="p-3 p-md-4"
          style={{ marginTop: "70px" }}
        >
          <Outlet />
        </div>

      </div>

    </div>
  );
}