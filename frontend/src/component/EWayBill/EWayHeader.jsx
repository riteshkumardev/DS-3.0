import React from "react";

const EWayHeader = ({ data }) => {
  // 2 din aage ki date nikalne ke liye function
  const calculateValidUpto = (inputDate) => {
    if (!inputDate) return "";
    const date = new Date(inputDate);
    date.setDate(date.getDate() + 2); // 2 din add kiye
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  };

  return (
    <div style={{ borderBottom: "2px solid black", marginBottom: 15, paddingBottom: 10 }}>
      <h2 style={{ textAlign: "center", margin: "5px 0", color: "#2c3e50" }}>
        DHARA SHAKTI AGRO PRODUCTS
      </h2>
      <p style={{ textAlign: "center", margin: "5px 0", color: "#2c3e50" }}>
        MANUFACTURER OF CORN GRITS & FLOUR, RICE GRITS & FLOUR, ANIMAL FEED</p>
         
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
        <div>
          <strong>Bill No:</strong> {data.billNo} <br />
          <strong>Date:</strong> {data.date || "N/A"}
        </div>
        <div style={{ textAlign: "right" }}>
          <strong>Generated Date:</strong> {data.date || "N/A"} <br />
          {/* <strong>Valid Upto:</strong> {calculateValidUpto(data.date)} */}
        </div>
      </div>
    </div>
  );
};

export default EWayHeader;