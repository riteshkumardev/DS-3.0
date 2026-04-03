import React from "react";

const TaxSummary = ({ tax = {}, freight = 0 }) => {
  // ✅ Sabhi tax fields ko destructure karein
  const { 
    taxable = 0, 
    cgst = 0, 
    sgst = 0, 
    igst = 0, 
    total = 0 
  } = tax;

  const cellStyle = { 
    border: "1px solid #000", 
    padding: "8px", 
    textAlign: "right",
    fontSize: "14px"
  };

  const labelStyle = {
    ...cellStyle,
    textAlign: "left",
    fontWeight: "500"
  };

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
      <table style={{ width: "45%", borderCollapse: "collapse", border: "1px solid #000" }}>
        <tbody>
          {/* Goods ki Basic Taxable Value */}
        

          {/* Freight / Transport Charges [cite: 7] */}
        

          {/* CGST Calculation  */}
          <tr>
            <td style={labelStyle}>CGST</td>
            <td style={cellStyle}>{cgst.toFixed(2)}</td>
          </tr>

          {/* SGST Calculation  */}
          <tr>
            <td style={labelStyle}>SGST</td>
            <td style={cellStyle}>{sgst.toFixed(2)}</td>
          </tr>

          {/* IGST Calculation  */}
          <tr>
            <td style={labelStyle}>IGST</td>
            <td style={cellStyle}>{igst.toFixed(2)}</td>
          </tr>
            <tr>
            <td style={labelStyle}>Freight / Transport Charges</td>
            <td style={cellStyle}>-
              {Number(freight).toFixed(2)}</td>
          </tr>

          {/* Grand Total  */}
          <tr style={{ background: "#f2f2f2", fontWeight: "bold" }}>
            <td style={labelStyle}>Total Amount (Grand Total)</td>
            <td style={cellStyle}>{total.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default TaxSummary;