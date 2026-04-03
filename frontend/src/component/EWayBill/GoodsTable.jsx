import React from "react";

const GoodsTable = ({ goods = [] }) => (
  <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "15px" }}>
    <thead>
      <tr style={{ background: "#f2f2f2" }}>
        {/* Sl. No. */}
        <th style={{ border: "1px solid #000", padding: "8px", textAlign: "center", width: "50px" }}>Sl. No.</th>
        
        <th style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>HSN/SAC</th>
        <th style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>Product

        </th>
        
        {/* ✅ Weight aur Bags ab ek hi jagah hain */}
        <th style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>Quantity </th>
        <th style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>Weight  </th>
          
         
        
        <th style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>Rate</th>
        <th style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>Amount (Rs.)</th>
      </tr>
    </thead>
    <tbody>
      {goods.length > 0 ? (
        goods.map((g, i) => (
          <tr key={i}>
            {/* Auto-increment Serial Number */}
            <td style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>{i + 1}</td>
              <td style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>
              {g.hsn || "11031300"}
            </td>
              <td style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>
              {g.product
              || "11031300"}
            </td>
            
            {/* ✅ Ek hi cell mein Weight aur Bags (e.g., 2000 KG / 40 Bags) */}
          
            <td style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>
            <div style={{ fontSize: "12px", color: "#555" }}>
                ({Math.ceil(g.quantity / 50)} Bags)
              </div>
              
            </td>
              <td style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>
              <div style={{ fontWeight: "bold" }}>{g.quantity} KG</div>
              
            </td>
            
            
          
            
            <td style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>
              {g.rate}
            </td>
            
            <td style={{ border: "1px solid #000", padding: "8px", textAlign: "right", fontWeight: "bold" }}>
              {Number(g.taxableAmount).toFixed(2)}
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="5" style={{ textAlign: "center", padding: "20px", border: "1px solid #000" }}>
            No Items Added
          </td>
        </tr>
      )}
    </tbody>
  </table>
);

export default GoodsTable;