import React, { useState } from "react";
import axios from "axios";
import "./ewayForm.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const toSafeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const EWayBillForm = ({ data, setData, onPreview }) => {
  const [loading, setLoading] = useState(false);
  const [searchBillNo, setSearchBillNo] = useState("");

  /* =============================================
      🔍 Fetch Data by Bill Number (Mapping JSON)
     ============================================= */
  const fetchBillData = async () => {
    if (!searchBillNo) return alert("Please enter a Bill Number");
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/sales`);
      if (res.data?.success) {
        // Backend data se specific Bill khojna
        const billData = res.data.data.find(b => b.billNo === parseInt(searchBillNo));

        if (billData) {
          // Backend se milne wale exact variables ko map karna
          setData({
            ...data,
            billNo: billData.billNo,
            date: billData.date,
            customerName: billData.customerName,
            address: billData.address,
            gstin: billData.gstin,
            mobile: billData.mobile,
            vehicleNo: billData.vehicleNo,
            deliveryNote: billData.deliveryNote,
            paymentMode: billData.paymentMode,
            buyerOrderNo: billData.buyerOrderNo,
            buyerOrderDate: billData.buyerOrderDate,
            dispatchDocNo: billData.dispatchDocNo,
            dispatchDate: billData.dispatchDate,
            dispatchedThrough: billData.dispatchedThrough,
            destination: billData.destination,
            termsOfDelivery: billData.termsOfDelivery,
            freight: billData.freight,
            // Goods array mapping
            goods: billData.goods.map(g => ({
              product: g.product,
              hsn: g.hsn || "2309",
              quantity: g.quantity,
              rate: g.rate,
              taxableAmount: g.taxableAmount
            })),
            taxSummary: {
              taxable: billData.taxableValue,
              cgst: billData.cgst,
              sgst: billData.sgst,
              igst: billData.igst,
              total: billData.totalAmount
            }
          });
          alert("Data fetched successfully!");
        } else {
          alert("Bill not found in database!");
        }
      }
    } catch (error) {
      console.error("Fetch error:", error);
      alert("Error loading data from server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="eway-form-page no-print">
      <div className="eway-form-card">
        <h2>📄 Sales Bill Selector</h2>
        <p style={{ fontSize: "12px", color: "#666" }}>Backend se data load karne ke liye Bill No. daalein</p>

        {/* --- Search Section (Ab sirf isi ka kaam hai) --- */}
        <div style={{ background: "#f0f4f8", padding: "15px", borderRadius: "8px", marginBottom: "20px", display: "flex", gap: "10px" }}>
          <input
            type="number"
            placeholder="Enter Bill No (e.g. 1)"
            value={searchBillNo}
            onChange={(e) => setSearchBillNo(e.target.value)}
            style={{ flex: 1, padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }}
          />
          <button 
            onClick={fetchBillData} 
            disabled={loading} 
            style={{ background: "#007bff", color: "white", padding: "10px 20px", border: "none", borderRadius: "4px", cursor: "pointer" }}
          >
            {loading ? "Loading..." : "🔍 Fetch Bill"}
          </button>
        </div>

        {/* --- View Only Info (Confirm karne ke liye ki sahi data hai) --- */}
     
    
      </div>
    </div>
  );
};

export default EWayBillForm;