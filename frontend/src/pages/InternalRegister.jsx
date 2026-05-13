import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";

import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import BASE_URL from "../config/api";

const S = `

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.p {
  --white:      #ffffff;
  --page:       #f0f7fe;
  --card:       #ffffff;
  --sky-50:     #f0f9ff;
  --sky-100:    #e0f2fe;
  --sky-200:    #bae6fd;
  --sky-300:    #7dd3fc;
  --sky-400:    #38bdf8;
  --sky-500:    #0ea5e9;
  --sky-600:    #0284c7;
  --sky-700:    #0369a1;
  --sky-800:    #075985;
  --navy:       #0c2340;
  --ink:        #000000;
  --ink2:       #000000;
  --ink3:       #000000;
  --ink4:       #333333;
  --line:       #dbeef9;
  --line2:      #eaf5fd;
  --red:        #ef4444;
  --red-lt:     #fef2f2;
  --green:      #22c55e;
  --green-lt:   #f0fdf4;
  --amber:      #f59e0b;
  --purple:     #8b5cf6;
  --teal:       #14b8a6;
  font-family: 'Inter', sans-serif;
  background: var(--page);
  min-height: 100vh;
  color: #000000;
}

/* ── Topbar ── */
.p-topbar {
  background: var(--white);
  border-bottom: 1px solid var(--line);
  padding: 0 40px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 0 var(--line), 0 4px 16px rgba(14,165,233,0.04);
}
.p-topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.p-topbar-icon {
  width: 36px; height: 36px;
  background: linear-gradient(135deg, var(--sky-500), var(--sky-700));
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1rem;
  box-shadow: 0 2px 8px rgba(14,165,233,0.35);
}
.p-topbar-title {
  font-family: 'Manrope', sans-serif;
  font-size: 1.05rem;
  font-weight: 800;
  color: #000000;
  letter-spacing: -0.3px;
}
.p-topbar-sub {
  font-size: 0.75rem;
  color: #000000;
  margin-top: 1px;
}
.p-topbar-pills {
  display: flex;
  gap: 10px;
}
.p-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--sky-50);
  border: 1px solid var(--sky-200);
  border-radius: 20px;
  padding: 5px 14px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #000000;
}
.p-pill-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--sky-400);
}

/* ── Page body ── */
.p-body {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px 60px;
}

/* ── Section label ── */
.p-section-label {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}
.p-section-label-bar {
  width: 3px; height: 20px;
  background: linear-gradient(180deg, var(--sky-400), var(--sky-600));
  border-radius: 2px;
  flex-shrink: 0;
}
.p-section-label h3 {
  font-family: 'Manrope', sans-serif;
  font-size: 0.95rem;
  font-weight: 800;
  color: #000000;
  letter-spacing: -0.2px;
}
.p-section-label span {
  font-size: 0.75rem;
  color: #000000;
  font-weight: 500;
}

/* ── Card ── */
.p-card {
  background: var(--white);
  border-radius: 20px;
  border: 1px solid var(--line);
  box-shadow: 0 2px 12px rgba(14,165,233,0.06), 0 1px 3px rgba(14,165,233,0.04);
  margin-bottom: 28px;
  overflow: hidden;
}

/* ── Alerts ── */
.p-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.84rem;
  font-weight: 500;
  margin-bottom: 22px;
  animation: fadeSlide 0.2s ease;
}
@keyframes fadeSlide {
  from { opacity:0; transform: translateY(-5px); }
  to   { opacity:1; transform: translateY(0); }
}
.p-alert-icon { font-size: 1rem; flex-shrink: 0; }
.p-alert-err  { background:#fef2f2; border:1px solid #fecaca; color:#000000; }
.p-alert-ok   { background:#f0fdf4; border:1px solid #bbf7d0; color:#000000; }

/* ── Form ── */
.p-form { padding: 28px 32px 32px; }
.p-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px 24px;
}
@media(max-width:640px){ .p-form-grid { grid-template-columns:1fr; } }
.p-full { grid-column: 1/-1; }

.p-field { display: flex; flex-direction: column; gap: 7px; }
.p-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: #000000;
}

.p-input-box {
  position: relative;
  display: flex;
  align-items: center;
}
.p-input-icon {
  position: absolute;
  left: 13px;
  color: #000000;
  font-size: 0.95rem;
  pointer-events: none;
  line-height: 1;
}
.p-input, .p-select {
  width: 100%;
  height: 44px;
  background: var(--sky-50);
  border: 1.5px solid var(--line);
  border-radius: 11px;
  font-family: 'Inter', sans-serif;
  font-size: 0.88rem;
  font-weight: 500;
  color: #000000;
  padding: 0 14px 0 38px;
  outline: none;
  transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
  -webkit-appearance: none;
}
.p-input::placeholder { color: #555555; font-weight: 400; }
.p-input:hover, .p-select:hover { border-color: var(--sky-300); background: #fff; }
.p-input:focus, .p-select:focus {
  border-color: var(--sky-500);
  background: #fff;
  box-shadow: 0 0 0 3px rgba(14,165,233,0.12);
}
.p-input-pw { padding-right: 42px; }
.p-pw-toggle {
  position: absolute;
  right: 13px;
  cursor: pointer;
  color: #000000;
  font-size: 0.9rem;
  user-select: none;
  transition: color 0.15s;
  line-height: 1;
}
.p-pw-toggle:hover { color: var(--sky-600); }

.p-select-box { position: relative; }
.p-select-box::after {
  content: '';
  position: absolute;
  right: 14px; top: 50%;
  transform: translateY(-50%);
  width: 0; height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid #000000;
  pointer-events: none;
}
.p-select-box .p-select { padding-left: 38px; padding-right: 36px; cursor: pointer; }
.p-select option { font-family: 'Inter', sans-serif; background: #fff; color: #000000; }

/* ── Chips ── */
.p-chips-wrap { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 2px; }
.p-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  border-radius: 22px;
  font-size: 0.79rem;
  font-weight: 600;
  cursor: pointer;
  border: 1.5px solid var(--line);
  background: var(--sky-50);
  color: #000000;
  transition: all 0.16s;
  user-select: none;
}
.p-chip:hover { border-color: var(--sky-400); color: #000000; background: var(--sky-100); }
.p-chip.on {
  background: var(--sky-600);
  border-color: var(--sky-600);
  color: #fff;
  box-shadow: 0 2px 8px rgba(2,132,199,0.28);
}
.p-chip input { display: none; }
.p-chip-tick { font-size: 0.68rem; opacity: 0.9; }

/* ── Divider ── */
.p-hr {
  border: none;
  border-top: 1px solid var(--line2);
  margin: 0;
}

/* ── Submit ── */
.p-submit-row { padding: 20px 32px 28px; display: flex; align-items: center; gap: 14px; background: var(--sky-50); border-top: 1px solid var(--line2); }
.p-submit {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 28px;
  background: linear-gradient(135deg, var(--sky-500) 0%, var(--sky-700) 100%);
  color: #fff;
  border: none;
  border-radius: 11px;
  font-family: 'Manrope', sans-serif;
  font-size: 0.88rem;
  font-weight: 800;
  cursor: pointer;
  letter-spacing: 0.01em;
  transition: all 0.18s;
  box-shadow: 0 3px 12px rgba(2,132,199,0.32);
}
.p-submit:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(2,132,199,0.4); }
.p-submit:active { transform: translateY(0); }
.p-submit-hint { font-size: 0.77rem; color: #000000; }

/* ── Table ── */
.p-tbl-outer { overflow-x: auto; }
.p-tbl {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.855rem;
  min-width: 720px;
}
.p-tbl thead th {
  background: var(--sky-50);
  color: #000000;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  padding: 12px 20px;
  text-align: left;
  border-bottom: 2px solid var(--sky-100);
  white-space: nowrap;
}
.p-tbl tbody tr {
  border-bottom: 1px solid var(--line2);
  transition: background 0.12s;
}
.p-tbl tbody tr:last-child { border-bottom: none; }
.p-tbl tbody tr:hover { background: var(--sky-50); }
.p-tbl tbody tr.editing { background: #fffdf0; }
.p-tbl td { padding: 14px 20px; vertical-align: middle; color: #000000; }

/* ── Avatar ── */
.p-av {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.72rem; font-weight: 800;
  flex-shrink: 0;
  border: 2px solid #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  background: linear-gradient(135deg,#bae6fd,#7dd3fc);
  color: #000000;
}
.p-user-cell { display: flex; align-items: center; gap: 10px; }
.p-user-info { display: flex; flex-direction: column; gap: 1px; }
.p-user-name { font-weight: 600; color: #000000; font-size: 0.86rem; line-height: 1.2; }

/* ── Badges ── */
.p-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
  color: #000000 !important;
}
.p-badge::before {
  content: '';
  width: 5px; height: 5px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}
.b-admin { background:#eff6ff; border:1px solid #bfdbfe; }
.b-plan  { background:#f0fdf4; border:1px solid #bbf7d0; }
.b-sup   { background:#fffbeb; border:1px solid #fde68a; }
.b-prod  { background:#faf5ff; border:1px solid #ddd6fe; }
.b-po    { background:#fff1f2; border:1px solid #fecdd3; }
.b-disp  { background:#f0fdfa; border:1px solid #99f6e4; }

/* ── Location tags ── */
.p-tags { display:flex; flex-wrap:wrap; gap:4px; }
.p-tag {
  display: inline-block;
  padding: 3px 9px;
  background: var(--sky-100);
  color: #000000;
  border: 1px solid var(--sky-200);
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
}

/* ── Inline table inputs ── */
.p-ti, .p-ts {
  height: 36px;
  background: #fff;
  border: 1.5px solid var(--line);
  border-radius: 8px;
  color: #000000;
  font-size: 0.84rem;
  padding: 0 10px;
  outline: none;
  width: 100%;
  font-family: 'Inter', sans-serif;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.p-ti:focus, .p-ts:focus {
  border-color: var(--sky-400);
  box-shadow: 0 0 0 3px rgba(14,165,233,0.1);
}
.p-ts { -webkit-appearance:none; cursor:pointer; padding-right: 28px; }

/* ── Action buttons ── */
.p-actions { display:flex; gap:7px; justify-content:center; }
.p-ab {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 13px;
  border-radius: 8px;
  font-size: 0.76rem;
  font-weight: 700;
  cursor: pointer;
  border: 1.5px solid transparent;
  font-family: 'Inter', sans-serif;
  transition: all 0.15s;
  white-space: nowrap;
  color: #000000;
}
.p-ab:hover { transform: translateY(-1px); }
.p-ab-edit   { background:#fefce8; border-color:#fde68a; }
.p-ab-edit:hover   { background:#fef9c3; box-shadow:0 3px 8px rgba(245,158,11,0.2); }
.p-ab-del    { background:#fff1f2; border-color:#fecdd3; }
.p-ab-del:hover    { background:#ffe4e6; box-shadow:0 3px 8px rgba(239,68,68,0.2); }
.p-ab-save   { background:#f0fdf4; border-color:#86efac; }
.p-ab-save:hover   { background:#dcfce7; box-shadow:0 3px 8px rgba(34,197,94,0.2); }
.p-ab-cancel { background:#f8fafc; border-color:#e2e8f0; }
.p-ab-cancel:hover { background:#f1f5f9; }

/* ── Empty ── */
.p-empty { padding: 56px 0; text-align:center; }
.p-empty-circle {
  width: 64px; height: 64px;
  border-radius: 50%;
  background: var(--sky-100);
  display: flex; align-items:center; justify-content:center;
  font-size: 1.6rem;
  margin: 0 auto 14px;
}
.p-empty h4 { font-size:0.92rem; font-weight:600; color:#000000; margin-bottom:4px; }
.p-empty p  { font-size:0.8rem; color:#000000; }

/* ── PW dots ── */
.p-dots { letter-spacing:3px; color:#000000; font-size:0.7rem; }

/* ── Table header row ── */
.p-tbl-header {
  padding: 20px 24px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--line2);
}
.p-tbl-header-left { display:flex; align-items:center; gap:10px; }
.p-tbl-header-icon {
  width:34px; height:34px; border-radius:9px;
  background: var(--sky-100);
  display:flex; align-items:center; justify-content:center;
  font-size:0.95rem;
}
.p-tbl-header-title {
  font-family:'Manrope',sans-serif; font-size:0.92rem;
  font-weight:800; color:#000000; letter-spacing:-0.2px;
}
.p-tbl-header-sub { font-size:0.73rem; color:#000000; margin-top:1px; }
.p-count-badge {
  background: var(--sky-600);
  color: #fff;
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 0.74rem;
  font-weight: 700;
}

@media(max-width:640px){
  .p-topbar { padding: 0 18px; }
  .p-topbar-pills { display:none; }
  .p-body { padding: 20px 14px 48px; }
  .p-form { padding: 20px 18px 24px; }
  .p-submit-row { padding: 16px 18px 22px; }
  .p-tbl-header { padding: 16px 18px 14px; }
}
`;

function InternalRegister() {
  const navigate = useNavigate();

  const [error, setError]               = useState("");
  const [success, setSuccess]           = useState("");
  const [users, setUsers]               = useState([]);
  const [locations, setLocations]       = useState([]);
  const [editUserId, setEditUserId]     = useState(null);
  const [editData, setEditData]         = useState({ name:"", role:"", password:"" });
  const [editLocations, setEditLocations] = useState([]);
  const [showPw, setShowPw]             = useState(false);
  const [showCpw, setShowCpw]           = useState(false);
  const [selectedLocations, setSelectedLocations] = useState([]);

  const [form, setForm] = useState({
    name:"", email:"", password:"", confirmPassword:"", role:"ADMIN"
  });

  const fetchUsers = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${BASE_URL}/api/auth/internal/users`, {
      headers:{ Authorization:`Bearer ${token}` }
    });
    setUsers(res.data);
  };
  const fetchLocations = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${BASE_URL}/api/master/locations`, {
      headers:{ Authorization:`Bearer ${token}` }
    });
    setLocations(res.data);
  };
  useEffect(()=>{ fetchUsers(); fetchLocations(); }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value.trim() });

  const validateForm = () => {
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/.test(form.email))
      return "Please enter a valid email address";
    if (form.password !== form.confirmPassword) return "Passwords do not match";
    return null;
  };

  const toggleLoc  = name => setSelectedLocations(p => p.includes(name) ? p.filter(l=>l!==name) : [...p,name]);
  const toggleELoc = name => setEditLocations(p => p.includes(name) ? p.filter(l=>l!==name) : [...p,name]);

  const handleSubmit = async e => {
    e.preventDefault();
    setError(""); setSuccess("");
    const err = validateForm();
    if (err) { setError(err); return; }
    if (users.some(u => u.email.toLowerCase() === form.email.toLowerCase())) {
      setError("A user with this email already exists"); return;
    }
    try {
      await axios.post(`${BASE_URL}/api/auth/internal/register`, { ...form, locations: selectedLocations });
      setSelectedLocations([]);
      setSuccess("User created successfully!");
      setTimeout(()=>setSuccess(""), 2500);
      setForm({ name:"", email:"", password:"", confirmPassword:"", role:"ADMIN" });
      fetchUsers();
    } catch(err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    }
  };

  const deleteUser = async id => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    const token = localStorage.getItem("token");
    await axios.delete(`${BASE_URL}/api/auth/internal/user/${id}`, {
      headers:{ Authorization:`Bearer ${token}` }
    });
    fetchUsers();
  };

  const startEdit = user => {
    setEditUserId(user._id);
    setEditData({ name:user.name, role:user.role, password:"" });
    setEditLocations(user.locations || []);
  };

  const saveEdit = async id => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `${BASE_URL}/api/auth/internal/user/${id}`,
        { ...editData, locations: editLocations },
        { headers:{ Authorization:`Bearer ${token}` } }
      );
      setEditUserId(null);
      fetchUsers();
    } catch(err) {
      setError(err.response?.data?.message || "Failed to update user");
    }
  };

  const roleBadge = r => ({
    "ADMIN":"b-admin","PLANNER":"b-plan","SUPERVISOR":"b-sup",
    "PRODUCTION":"b-prod","PURCHASE ORDER":"b-po","DISPATCH":"b-disp"
  }[r] || "b-admin");

  const initials = n => n ? n.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase() : "?";

  const adminCount   = users.filter(u=>u.role==="ADMIN").length;
  const roleOptions  = ["ADMIN","PLANNER","SUPERVISOR","PRODUCTION","PURCHASE ORDER","DISPATCH"];

  const avGrad = n => {
    const grads = [
      ["#bae6fd","#7dd3fc","#000000"],
      ["#bbf7d0","#6ee7b7","#000000"],
      ["#ddd6fe","#c4b5fd","#000000"],
      ["#fecdd3","#fda4af","#000000"],
      ["#fed7aa","#fdba74","#000000"],
    ];
    const i = (n?.charCodeAt(0) || 0) % grads.length;
    return { background:`linear-gradient(135deg,${grads[i][0]},${grads[i][1]})`, color:grads[i][2] };
  };

  return (
    <>
      <style>{S}</style>
      <div className="p">

        <div className="p-topbar">
          <div className="p-topbar-left">
            <div className="p-topbar-icon">👤</div>
            <div>
              <div className="p-topbar-title">User Management</div>
              <div className="p-topbar-sub">Internal access control</div>
            </div>
          </div>
          <div className="p-topbar-pills">
            <div className="p-pill">
              <div className="p-pill-dot"></div>
              {users.length} Users
            </div>
            <div className="p-pill">
              <div className="p-pill-dot" style={{background:"#22c55e"}}></div>
              {locations.length} Locations
            </div>
          </div>
        </div>

        <div className="p-body">

          <div className="p-section-label">
            <div className="p-section-label-bar"></div>
            <h3>Add New User</h3>
            <span>Create an internal account and assign access</span>
          </div>

          <div className="p-card border-black">
            <div className="p-form">

              {error   && <div className="p-alert p-alert-err"><span className="p-alert-icon">⚠️</span>{error}</div>}
              {success && <div className="p-alert p-alert-ok"><span className="p-alert-icon">✅</span>{success}</div>}

              <form onSubmit={handleSubmit}>
                <div className="p-form-grid">

                  <div className="p-field">
                    <label className="p-label">Full Name</label>
                    <div className="p-input-box">
                      <span className="p-input-icon">👤</span>
                      <input name="name" value={form.name} className="p-input"
                        placeholder="Name" onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="p-field">
                    <label className="p-label">Email Address</label>
                    <div className="p-input-box">
                      <span className="p-input-icon">✉️</span>
                      <input name="email" type="email" value={form.email} className="p-input"
                        placeholder="Email" onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="p-field">
                    <label className="p-label">Password</label>
                    <div className="p-input-box">
                      <span className="p-input-icon">🔒</span>
                      <input name="password" type={showPw?"text":"password"}
                        value={form.password} className="p-input p-input-pw"
                        placeholder="Create a strong password" onChange={handleChange} required />
                      <span className="p-pw-toggle" onClick={()=>setShowPw(!showPw)}>
                        {showPw?"🙈":"👁️"}
                      </span>
                    </div>
                  </div>

                  <div className="p-field">
                    <label className="p-label">Confirm Password</label>
                    <div className="p-input-box">
                      <span className="p-input-icon">🔒</span>
                      <input name="confirmPassword" type={showCpw?"text":"password"}
                        value={form.confirmPassword} className="p-input p-input-pw"
                        placeholder="Repeat password" onChange={handleChange} required />
                      <span className="p-pw-toggle" onClick={()=>setShowCpw(!showCpw)}>
                        {showCpw?"🙈":"👁️"}
                      </span>
                    </div>
                  </div>

                  <div className="p-field">
                    <label className="p-label">Role</label>
                    <div className="p-input-box p-select-box">
                      <span className="p-input-icon">🛡️</span>
                      <select name="role" value={form.role} className="p-select" onChange={handleChange}>
                        {roleOptions.map(r=><option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="p-field p-full">
                    <label className="p-label">Assign Locations</label>
                    <div className="p-chips-wrap">
                      {locations.map(loc=>(
                        <label key={loc._id} className={`p-chip ${selectedLocations.includes(loc.locationName)?"on":""}`}>
                          <input type="checkbox" checked={selectedLocations.includes(loc.locationName)}
                            onChange={()=>toggleLoc(loc.locationName)} />
                          {selectedLocations.includes(loc.locationName) && <span className="p-chip-tick">✓</span>}
                          {loc.locationName}
                        </label>
                      ))}
                      {!locations.length && <span style={{color:"#000000",fontSize:"0.82rem"}}>No locations configured</span>}
                    </div>
                  </div>

                </div>
              </form>
            </div>

            <hr className="p-hr" />

            <div className="p-submit-row">
              <button className="p-submit" onClick={handleSubmit}>
                <span style={{fontSize:"1.1rem"}}>+</span> Create User
              </button>
              {/* <span className="p-submit-hint">All fields are required except locations</span> */}
            </div>
          </div>

          <div className="p-section-label" style={{marginTop:8}}>
            <div className="p-section-label-bar" style={{background:"linear-gradient(180deg,#22c55e,#16a34a)"}}></div>
            <h3>All Users</h3>
            <span>Manage, edit or remove accounts</span>
          </div>

          <div className="p-card border-black">
            <div className="p-tbl-header">
              <div className="p-tbl-header-left">
                <div className="p-tbl-header-icon">📋</div>
                <div>
                  <div className="p-tbl-header-title">Registered Accounts</div>
                  <div className="p-tbl-header-sub">{adminCount} admin{adminCount!==1?"s":""} · {users.length - adminCount} other roles</div>
                </div>
              </div>
              <div className="p-count-badge">{users.length} total</div>
            </div>

            <div className="p-tbl-outer ">
              <table className="p-tbl ">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Locations</th>
                    <th>Password</th>
                    <th style={{textAlign:"center"}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!users.length && (
                    <tr><td colSpan="6">
                      <div className="p-empty">
                        <div className="p-empty-circle">👥</div>
                        <h4>No users yet</h4>
                        <p>Add your first user using the form above</p>
                      </div>
                    </td></tr>
                  )}

                  {users.map(user=>{
                    const isEditing = editUserId === user._id;
                    return (
                      <tr key={user._id} className={isEditing?"editing":""}>

                        <td>
                          {isEditing ? (
                            <input className="p-ti" value={editData.name}
                              onChange={e=>setEditData({...editData, name:e.target.value})} />
                          ) : (
                            <div className="p-user-cell">
                              <div className="p-av" style={avGrad(user.name)}>{initials(user.name)}</div>
                              <div className="p-user-info">
                                <span className="p-user-name">{user.name}</span>
                              </div>
                            </div>
                          )}
                        </td>

                        <td style={{color:"#000000", fontSize:"0.82rem"}}>{user.email}</td>

                        <td>
                          {isEditing ? (
                            <select className="p-ts" value={editData.role}
                              onChange={e=>setEditData({...editData, role:e.target.value})}>
                              {roleOptions.map(r=><option key={r}>{r}</option>)}
                            </select>
                          ) : (
                            <span className={`p-badge ${roleBadge(user.role)}`}>{user.role}</span>
                          )}
                        </td>

                        <td>
                          {isEditing ? (
                            <div className="p-chips-wrap" style={{gap:5}}>
                              {locations.map(loc=>(
                                <label key={loc._id}
                                  className={`p-chip ${editLocations.includes(loc.locationName)?"on":""}`}
                                  style={{padding:"4px 10px",fontSize:"0.72rem"}}>
                                  <input type="checkbox"
                                    checked={editLocations.includes(loc.locationName)}
                                    onChange={()=>toggleELoc(loc.locationName)} />
                                  {editLocations.includes(loc.locationName) && <span className="p-chip-tick">✓</span>}
                                  {loc.locationName}
                                </label>
                              ))}
                            </div>
                          ) : (
                            <div className="p-tags">
                              {user.locations?.length
                                ? user.locations.map((l,i)=><span key={i} className="p-tag">{l}</span>)
                                : <span style={{color:"#000000",fontSize:"0.8rem"}}>—</span>}
                            </div>
                          )}
                        </td>

                        <td>
                          {isEditing ? (
                            <input type="password" className="p-ti" placeholder="Leave blank to keep"
                              onChange={e=>setEditData({...editData, password:e.target.value})} />
                          ) : (
                            <span className="p-dots">••••••••</span>
                          )}
                        </td>

                        <td>
                          <div className="p-actions">
                            {isEditing ? (
                              <>
                                <button className="p-ab p-ab-save" onClick={()=>saveEdit(user._id)}>✓ Save</button>
                                <button className="p-ab p-ab-cancel" onClick={()=>setEditUserId(null)}>✕</button>
                              </>
                            ) : (
                              <>
                                <button className="p-ab p-ab-edit" onClick={()=>startEdit(user)}>✏ Edit</button>
                                <button className="p-ab p-ab-del"  onClick={()=>deleteUser(user._id)}>🗑 Delete</button>
                              </>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default InternalRegister;