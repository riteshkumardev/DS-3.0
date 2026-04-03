import React from "react";

const VehicleDetails = ({ vehicle }) => (
  <div style={{ marginTop: 15, paddingBottom: 20, borderBottom: "1px solid #eee" }}>
    <h4 style={{ margin: "0 0 10px 0", color: "#333", borderBottom: "1px solid #ddd", display: "inline-block" }}>
      🚛 Vehicle & Transport Details
    </h4>
    
    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
      {/* Left Side: Vehicle Info */}
      <div style={{ flex: 1, minWidth: "200px" }}>
        <p style={{ margin: "5px 0" }}><strong>Vehicle No:</strong> {vehicle.vehicleNo || "---"}</p>
        <p style={{ margin: "5px 0" }}><strong>From:</strong> {vehicle.from || "Bihar"}</p>
      </div>

      {/* Middle: Driver Info (Emp Table se link karne ke liye) */}
      <div style={{ flex: 1, minWidth: "200px" }}>
        <p style={{ margin: "5px 0" }}><strong>Driver Name:</strong> {vehicle.driverName || "---"}</p>
        <p style={{ margin: "5px 0" }}><strong>Driver Mobile:</strong> {vehicle.driverPhone || "---"}</p>
      </div>

      {/* Right Side: Signature Space */}
      <div style={{ flex: 1, minWidth: "150px", textAlign: "right", alignSelf: "flex-end" }}>
        <div style={{ marginTop: "20px" }}>
          <div style={{ borderTop: "1px dashed #000", width: "120px", marginLeft: "auto" }}></div>
          <p style={{ margin: "5px 0 0 0", fontSize: "12px", fontWeight: "bold" }}>Driver's Signature</p>
        </div>
      </div>
    </div>
  </div>
);

export default VehicleDetails;