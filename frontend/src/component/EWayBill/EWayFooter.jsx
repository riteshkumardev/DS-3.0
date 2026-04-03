import React from "react";

const EWayFooter = ({ data }) => {
  return (
    <div style={{ marginTop: 30, borderTop: "1px solid #000", paddingTop: 10 }}>
      {/* 1. Declaration & Bank Details Section */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", gap: "10px" }}>
        
        <div style={{ flex: 2 }}>
          <p style={{ margin: "0 0 10px 0", fontStyle: "italic", fontSize: "11px" }}>
            I/We hereby certify that food/foods mentioned in this invoice are warranted to be 
            of the nature and quality which it/these products purport to be.
          </p>
          
          <div style={{ border: "1px solid #000", padding: "8px",display:"flex",
             borderRadius: "4px", backgroundColor: "#f9f9f9" }}>
            <strong style={{ display: "block", marginBottom: "5px", textDecoration: "underline" }}>
              BANK DETAILS:
            </strong>
            <p style={{ margin: "1px 0" }}><strong>Account Name:</strong> MS DHARA SHAKTI AGRO PRODUCTS</p>
            <p style={{ margin: "1px 0" }}><strong>Account Number:</strong> 3504008700005079</p>
            <p style={{ margin: "1px 0" }}><strong>IFSC Code:</strong> PUNB0350400</p>
            <p style={{ margin: "1px 0" }}><strong>Branch:</strong> WARISNAGAR (PUNJAB NATIONAL BANK)</p>
          </div>
        </div>

      
      </div>

    </div>
  );
};

export default EWayFooter;