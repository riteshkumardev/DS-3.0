import React from "react";
import rkSignature from "./rkSig.png";
const TransportDetails = ({ transport }) => {
  return (
    <div style={{ 
      marginTop: 20, 
      borderTop: "1px solid #ccc", 
      paddingTop: 10,
      display: "flex",
      justifyContent: "space-between", // Details left mein, Sign right mein
      alignItems: "flex-end"
    }}>
      {/* Left Side: Transport Info */}
      <div style={{ flex: 1 }}>
        <h4 style={{ margin: "0 0 5px 0" }}>Transport Details</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <span><strong>Doc No:</strong> {transport.docNo || "---"}</span>
          <span><strong>Doc Date:</strong> {transport.docDate || "---"}</span>
        </div>
      </div>

      {/* Right Side: Authorized Signature */}
      <div style={{ textAlign: "center", minWidth: "150px" }}>
        <img 
          src={rkSignature} // 👈 Apne image ka path yahan check karein
          alt="Ritesh Kumar Signature" 
          style={{ 
            width: "120px", 
            height: "auto", 
            marginBottom: "-10px", // Sign ko line ke thoda upar lane ke liye
            display: "block",
            marginLeft: "auto",
            marginRight: "auto"
          }} 
        />
        <div style={{ 
          borderTop: "1px solid black", 
          marginTop: "5px", 
          paddingTop: "5px",
          fontSize: "12px",
          fontWeight: "bold"
        }}>
          Authorized Signatory
        </div>
      </div>
    </div>
  );
};

export default TransportDetails;