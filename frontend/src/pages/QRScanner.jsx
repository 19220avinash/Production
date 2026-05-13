import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import axios from "axios";
import BASE_URL from "../config/api";

function QRScanner() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [remarks, setRemarks] = useState("");
  const [scanInput, setScanInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanList, setScanList] = useState([]);
  const [stage, setStage] = useState("");

  const stageRef = useRef(stage);
  const scanListRef = useRef([]);
  const isProcessingRef = useRef(false);
  const inputRef = useRef(null);

  const playBeep = () => {
    const audio = new Audio("https://www.soundjay.com/buttons/sounds/beep-07.mp3");
    audio.play();
  };

  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    scanListRef.current = scanList;
  }, [scanList]);

  const processScan = async (text) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      const currentStage = stageRef.current;

      if (!currentStage) {
        setError("Please select stage before scanning ❌");
        setScanSuccess(false);
        return;
      }

      const parsed = JSON.parse(text);

      const res = await axios.get(
        `${BASE_URL}/api/workorders/qr/${parsed.wono}/${parsed.enNo}`
      );

      const newData = res.data;

      const alreadyInList = scanListRef.current.some(
        (item) =>
          item.woNo === newData.woNo &&
          item.ean === newData.ean &&
          item.stage === currentStage
      );

      if (alreadyInList) {
        setError(`This QR is already scanned for ${currentStage} ⚠️`);
        setScanSuccess(false);
        return;
      }

      const existsRes = await axios.get(
        `${BASE_URL}/api/workorders/qr-exists/${newData.woNo}/${newData.ean}/${currentStage}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (existsRes.data.exists) {
        setError(`This QR already exists for ${currentStage} ⚠️`);
        setScanSuccess(false);
        return;
      }

      setData(newData);
      setRemarks(newData.remarks || "");
      setError("");

      setScanList((prev) => [
        ...prev,
        {
          ...newData,
          remarks: "",
          stage: currentStage,
        },
      ]);

      setScanSuccess(true);
      playBeep();
      setTimeout(() => setScanSuccess(false), 500);
    } catch (err) {
      setError("Invalid QR or data not found ❌");
      setScanSuccess(false);
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
        inputRef.current?.focus();
      }, 800);
    }
  };

  const handleRemarkChange = (index, value) => {
    setScanList((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, remarks: value } : item
      )
    );
  };

  useEffect(() => {
    if (!isScanning) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: 250 },
      false
    );

    scanner.render(
      (decodedText) => {
        processScan(decodedText);
      },
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [isScanning]);

  const handleStartScanning = () => {
    if (!stage) {
      setError("Please select stage before scanning ❌");
      return;
    }

    setError("");
    setIsScanning(true);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleStopScanning = () => {
    setIsScanning(false);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleSaveAll = async () => {
    try {
      for (const item of scanList) {
        await axios.post(
          `${BASE_URL}/api/workorders/qr-save`,
          {
            ...item,
            enNo: item.ean,
            remarks: item.remarks || "",
            stage: item.stage || "",
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      }

      alert("All scans saved ✅");

      setScanList([]);
      setData(null);
      setRemarks("");
      setError("");

      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (err) {
      alert("Error saving batch ❌");
    }
  };

  return (
    <div
    
      style={{
        minHeight: "100vh",
        backgroundImage:
          "linear-gradient(rgba(7, 89, 133, 0.07), rgba(14, 164, 233, 0.07)), url('/bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: "18px 8px",
      }}
    >
      <div className="container-fluid">
        <div className="row justify-content-center">
          <div
            className="shadow-lg"
            style={{
              maxWidth: "1220px",
              width: "100%",
              margin: "0 auto",
              borderRadius: "14px",
              overflow: "hidden",
              background: "#f0f9ff",
              border: scanSuccess ? "3px solid #38bdf8" : "1px solid #bae6fd",
              transition: "0.25s ease",
            }}
          >
            <div
              style={{
                background:
                  "linear-gradient(135deg, #075985 0%, #0284c7 55%, #38bdf8 100%)",
                color: "#fff",
                padding: "18px 22px",
              }}
            >
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div>
                  <h4 className="mb-1 fw-bold">📷 QR Scanner</h4>
                  <div style={{ opacity: 0.95, fontSize: "14px" }}>
                    Select stage, scan QR, review list and save batch
                  </div>
                </div>

                <div
                  className="px-3 py-2"
                  style={{
                    background: "rgba(255,255,255,0.18)",
                    border: "1px solid rgba(255,255,255,0.28)",
                    borderRadius: "10px",
                    fontWeight: "700",
                  }}
                >
                  Total Scans: {scanList.length}
                </div>
              </div>
            </div>

            <div className="p-3 p-md-4">
              <div
                className="d-flex flex-wrap justify-content-center align-items-center gap-3 mb-3"
                style={{
                  background: "#ffffff",
                  border: "1px solid #bae6fd",
                  borderRadius: "12px",
                  padding: "14px",
                  boxShadow: "0 4px 14px rgba(2, 132, 199, 0.10)",
                }}
              >
                <select
                  value={stage}
                  onChange={(e) => {
                    setStage(e.target.value);
                    setError("");
                    setTimeout(() => inputRef.current?.focus(), 100);
                  }}
                  className="form-select"
                  style={{
                    maxWidth: "220px",
                    fontWeight: "700",
                    borderColor: "#7dd3fc",
                    color: "#075985",
                  }}
                >
                  <option value="">Select Stage</option>
                  <option value="PRINTING">Printing</option>
                  <option value="BINDING">Binding</option>
                  <option value="DISPATCH">Dispatch</option>
                </select>

                {!isScanning ? (
                  <button
                    className="btn fw-semibold px-4"
                    style={{
                      background: "#0284c7",
                      color: "#fff",
                      borderColor: "#0284c7",
                    }}
                    onClick={handleStartScanning}
                  >
                    ▶ Start Scanning
                  </button>
                ) : (
                  <button
                    className="btn fw-semibold px-4"
                    style={{
                      background: "#dc2626",
                      color: "#fff",
                      borderColor: "#dc2626",
                    }}
                    onClick={handleStopScanning}
                  >
                    ⛔ Stop Scanning
                  </button>
                )}

                {stage && (
                  <span
                    className="badge px-3 py-2"
                    style={{
                      background: "#e0f2fe",
                      color: "#075985",
                      border: "1px solid #7dd3fc",
                    }}
                  >
                    Stage: {stage}
                  </span>
                )}
              </div>

              {scanSuccess && (
                <div
                  className="alert text-center py-2 fw-bold mb-3"
                  style={{
                    background: "#e0f2fe",
                    color: "#075985",
                    border: "1px solid #38bdf8",
                  }}
                >
                  ✅ Scan Successful
                </div>
              )}

              {error && (
                <div
                  className="alert text-center py-2 fw-semibold mb-3"
                  style={{
                    background: "#fff7ed",
                    color: "#9a3412",
                    border: "1px solid #fdba74",
                  }}
                >
                  {error}
                </div>
              )}

             <input
  ref={inputRef}
  type="text"
  autoFocus
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      processScan(e.target.value);
      e.target.value = "";
    }
  }}
  style={{
    position: "absolute",
    left: "-9999px",
  }}
/>

              {isScanning && (
                <div className="d-flex justify-content-center mb-3">
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "330px",
                      background: "#075985",
                      padding: "12px",
                      borderRadius: "14px",
                      boxShadow: "0 10px 25px rgba(2, 132, 199, 0.30)",
                    }}
                  >
                    <div
                      id="qr-reader"
                      className="w-100"
                      style={{
                        overflow: "hidden",
                        borderRadius: "10px",
                        background: "#000",
                      }}
                    />
                  </div>
                </div>
              )}

              {data && (
                <div
                  className="mb-3"
                  style={{
                    border: "1px solid #bae6fd",
                    borderRadius: "12px",
                    overflow: "hidden",
                    background: "#ffffff",
                  }}
                >
                  <div
                    className="px-3 py-2 fw-bold"
                    style={{
                      background: "#e0f2fe",
                      color: "#075985",
                      borderBottom: "1px solid #bae6fd",
                    }}
                  >
                    📦 Work Order Details
                  </div>

                  <div className="p-3">
                    <div className="row g-2">
                      <div className="col-12 col-md-6"><b>PO:</b> {data.poNo}</div>
                      <div className="col-12 col-md-6"><b>WO:</b> {data.woNo}</div>
                      <div className="col-12 col-md-6"><b>EAN:</b> {data.ean}</div>
                      <div className="col-12 col-md-6"><b>Item:</b> {data.item}</div>
                      <div className="col-12 col-md-6"><b>Qty:</b> {data.qty}</div>
                      <div className="col-12 col-md-6"><b>Customer:</b> {data.customer}</div>
                      <div className="col-12 col-md-6"><b>Description:</b> {data.description}</div>
                      <div className="col-12 col-md-6">
                        <b>Date:</b>{" "}
                        {data.woDate
                          ? new Date(data.woDate).toLocaleDateString("en-IN")
                          : "-"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {scanList.length > 0 && (
                <div
                  style={{
                    border: "1px solid #bae6fd",
                    borderRadius: "12px",
                    overflow: "hidden",
                    background: "#ffffff",
                  }}
                >
                  <div
                    className="d-flex flex-wrap justify-content-between align-items-center gap-2 px-3 py-2"
                    style={{
                      background: "#075985",
                      color: "#fff",
                    }}
                  >
                    <h5 className="mb-0">📋 Scanned Items</h5>

                    <button
                      className="btn btn-sm fw-semibold px-3"
                      style={{
                        background: "#38bdf8",
                        color: "#083344",
                        borderColor: "#38bdf8",
                      }}
                      onClick={handleSaveAll}
                    >
                      💾 Save All
                    </button>
                  </div>

                  <div style={{ maxHeight: "340px", overflow: "auto" }}>
                    <table className="table table-bordered table-sm text-center align-middle mb-0">
                      <thead
                        style={{
                          position: "sticky",
                          top: 0,
                          background: "#e0f2fe",
                          color: "#075985",
                        }}
                      >
                        <tr>
                          <th>#</th>
                          <th>PO</th>
                          <th>WO</th>
                          <th>EAN</th>
                          <th>Item</th>
                          <th>Qty</th>
                          <th>Customer</th>
                          <th>Description</th>
                          <th>Date</th>
                          <th>Stage</th>
                          <th style={{ minWidth: "180px" }}>Remarks</th>
                        </tr>
                      </thead>

                      <tbody>
                        {scanList.map((item, i) => (
                          <tr key={`${item.woNo}-${item.ean}-${item.stage}`}>
                            <td className="fw-bold">{i + 1}</td>
                            <td>{item.poNo}</td>
                            <td>{item.woNo}</td>
                            <td>{item.ean}</td>
                            <td>{item.item}</td>
                            <td>{item.qty}</td>
                            <td>{item.customer}</td>
                            <td>{item.description}</td>
                            <td>
                              {item.woDate
                                ? new Date(item.woDate).toLocaleDateString("en-IN")
                                : "-"}
                            </td>
                            <td>
                              <span
                                className="badge"
                                style={{
                                  background: "#dbeafe",
                                  color: "#1d4ed8",
                                }}
                              >
                                {item.stage}
                              </span>
                            </td>
                            <td>
                              <textarea
                                value={item.remarks || ""}
                                onChange={(e) =>
                                  handleRemarkChange(i, e.target.value)
                                }
                                onFocus={() => setIsScanning(false)}
                                className="form-control form-control-sm"
                                placeholder="Enter remarks..."
                                rows="2"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div
                    className="text-center p-3"
                    style={{ background: "#f0f9ff" }}
                  >
                    <button
                      className="btn fw-semibold px-5"
                      style={{
                        background: "#0284c7",
                        color: "#fff",
                        borderColor: "#0284c7",
                      }}
                      onClick={handleSaveAll}
                    >
                      💾 Save All
                    </button>
                  </div>
                </div>
              )}

              {scanList.length === 0 && !data && (
                <div
                  className="text-center py-4"
                  style={{
                    color: "#075985",
                    border: "1px dashed #7dd3fc",
                    borderRadius: "12px",
                    background: "#ffffff",
                  }}
                >
                  No QR scanned yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QRScanner;
