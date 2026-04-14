import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { fetchPartiesList } from "../../api/partyApi";
import SalesEntryForm from "./SalesEntryForm";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const toSafeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const SalesEntry = ({ user }) => {
  const userRole = user?.role?.toUpperCase();
  const isAuthorized = ["ADMIN", "ACCOUNTANT", "MANAGER"].includes(userRole);

  // 🆔 Product to ID Mapping (Mandatory for Backend ref: 'Product')
  // Note: Ensure these IDs exist in your MongoDB Products collection
  const productIdMap = {
    "CORN GRIT": "60d000000000000000000001",
    "CORN GRIT (3MM)": "60d000000000000000000002",
    "CATTLE FEED": "60d000000000000000000003",
    "RICE GRIT": "60d000000000000000000004",
    "CORN FLOUR": "60d000000000000000000005",
    "RICE FLOUR": "60d000000000000000000006",
    "DEFAULT": "60d000000000000000000000"
  };

  const initialState = {
    date: new Date().toISOString().split("T")[0],
    customerName: "",
    gstin: "",
    mobile: "",
    street: "",
    city: "Samastipur",
    items: [{ productName: "", quantity: "", rate: "" }],
    billNo: "", 
    vehicleNo: "",
    travelingCost: 0, // Maps to logistics.freight
    cashDiscount: 0,  // Maps to discount
    totalPrice: 0,    // Maps to grandTotal
    amountReceived: 0, // Maps to amountPaid
    paymentDue: 0,    // Maps to balanceDue
    remarks: "",
    deliveryNote: "",
    deliveryNoteDate: "", 
    paymentMode: "BY BANK",
    buyerOrderNo: "",
    buyerOrderDate: "",
    dispatchDocNo: "",
    dispatchDate: "",
    dispatchedThrough: "", 
    destination: "",
    lrRrNo: "",
    termsOfDelivery: "",
  };

  const [formData, setFormData] = useState(initialState);
  const [suppliers, setSuppliers] = useState([]);
  const [nextSi, setNextSi] = useState(1);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // 📦 HSN Logic Helper
  const getHSNCode = (productName) => {
    const name = productName?.toUpperCase().trim() || "";
    if (name.includes("CATTLE FEED")) return "23099010";
    if (name.includes("CORN GRIT")) return "11031300";
    if (name.includes("CORN FLOUR")) return "11022000";
    if (name.includes("RICE GRIT")) return "10064000";
    if (name.includes("RICE FLOUR")) return "11022000";
    if (name.includes("BAG")) return "63053300";
    return "00000000";
  };

  const getAuthHeader = useCallback(() => ({
    headers: { Authorization: `Bearer ${user?.token}` }
  }), [user]);

  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  const generateBillID = (lastBillNo) => {
    const now = new Date();
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const currentMonth = months[now.getMonth()];
    const currentYear = now.getFullYear();
    const finYear = now.getMonth() >= 3 ? `${currentYear}-${(currentYear + 1).toString().slice(-2)}` : `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
    
    let nextSerial = 1;
    if (lastBillNo && lastBillNo.includes('/')) {
      const parts = lastBillNo.split('/');
      const lastSerial = parseInt(parts[parts.length - 1]);
      if (currentMonth === parts[2]) nextSerial = lastSerial + 1;
    }
    return `DS/${finYear}/${currentMonth}/${String(nextSerial).padStart(3, '0')}`;
  };

  const fetchData = useCallback(async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      const supRes = await fetchPartiesList('SUPPLIER'); 
      if (supRes.data?.success) setSuppliers(supRes.data.data);

      const salesRes = await axios.get(`${API_URL}/sales`, getAuthHeader());
      if (salesRes.data?.success && salesRes.data.data.length > 0) {
        const salesData = salesRes.data.data;
        const lastSi = Math.max(...salesData.map((s) => s.si || 0));
        setNextSi(lastSi + 1);
        const lastBillNo = salesData[salesData.length - 1].billNo;
        setFormData(prev => ({ ...prev, billNo: generateBillID(lastBillNo) }));
      } else {
        setFormData(prev => ({ ...prev, billNo: generateBillID("") }));
      }
    } catch (err) { 
      showMsg("Data loading failed.", "error");
    } finally { setLoading(false); }
  }, [user, API_URL, getAuthHeader]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCustomerSelect = (e) => {
    const selectedName = e.target.value;
    const customer = suppliers.find((s) => s.name === selectedName);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerName: customer.name,
        gstin: customer.gstin || "URD",
        mobile: customer.phone || "",
        street: customer.address?.street || "",
        city: customer.address?.city || "Samastipur",
      }));
    }
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...formData.items];
    newItems[index][name] = value;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => setFormData(prev => ({ ...prev, items: [...prev.items, { productName: "", quantity: "", rate: "" }] }));
  const removeItem = (index) => setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Logic to sync visuals with Schema's pre-save calculations
  useEffect(() => {
    let sub = 0;
    formData.items.forEach(item => { sub += toSafeNumber(item.quantity) * toSafeNumber(item.rate); });
    const disc = toSafeNumber(formData.cashDiscount);
    const freight = toSafeNumber(formData.travelingCost);
    const received = toSafeNumber(formData.amountReceived);
    
    const grand = (sub + freight) - disc;
    setFormData(prev => ({ ...prev, totalPrice: grand, paymentDue: grand - received }));
  }, [formData.items, formData.travelingCost, formData.cashDiscount, formData.amountReceived]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthorized) return showMsg("Access Denied!", "error");
    
    const selectedParty = suppliers.find(s => s.name === formData.customerName);
    if (!selectedParty && formData.customerName !== "Local customer") {
        return showMsg("Please select a valid customer", "error");
    }

    setLoading(true);
    try {
      const goods = formData.items.map(item => ({
        productId: productIdMap[item.productName.toUpperCase()] || productIdMap["DEFAULT"],
        productName: item.productName,
        hsn: getHSNCode(item.productName),
        quantity: toSafeNumber(item.quantity),
        unit: "KG",
        rate: toSafeNumber(item.rate),
        taxableAmount: toSafeNumber(item.quantity) * toSafeNumber(item.rate)
      }));

      // 🔥 ENUM FIX: Backend strictly needs 'IGST' or 'CGST/SGST'
      const isBihar = formData.gstin?.startsWith("10");
      const gstTypeValue = isBihar ? "CGST/SGST" : "IGST";

      const payload = {
        billNo: formData.billNo,
        date: formData.date,
        partyId: selectedParty?._id || "69ddc75636ee8ada6e41102f", // Actual Party Ref
        customerName: formData.customerName,
        logistics: {
          vehicleNo: formData.vehicleNo.toUpperCase(),
          dispatchedThrough: formData.dispatchedThrough.toUpperCase(),
          destination: formData.destination.toUpperCase(),
          lrRrNo: formData.lrRrNo,
          freight: toSafeNumber(formData.travelingCost)
        },
        buyerOrderNo: formData.buyerOrderNo,
        termsOfDelivery: formData.termsOfDelivery,
        goods: goods,
        gstType: gstTypeValue, 
        discount: toSafeNumber(formData.cashDiscount),
        amountPaid: toSafeNumber(formData.amountReceived),
        performedBy: user?._id || "60d00000000000000000000a", // Admin ID ref
        remarks: formData.remarks
      };

      const res = await axios.post(`${API_URL}/sales`, payload, getAuthHeader());
      if (res.data.success) {
        showMsg("✅ Sale Saved & Inventory Synced!");
        setNextSi(prev => prev + 1);
        const nextBill = generateBillID(formData.billNo);
        setFormData({ ...initialState, billNo: nextBill });
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "ValidationError: Check required fields";
      showMsg(errorMsg, "error");
    } finally { setLoading(false); }
  };

  return (
    <>
      <SalesEntryForm 
        formData={formData} nextSi={nextSi} loading={loading}
        suppliers={suppliers} handleChange={handleChange}
        handleCustomerSelect={handleCustomerSelect}
        handleItemChange={handleItemChange}
        addItem={addItem} removeItem={removeItem}
        handleSubmit={handleSubmit}
        resetForm={() => setFormData({ ...initialState, billNo: generateBillID(formData.billNo) })}
        initialState={initialState}
      />
      <CustomSnackbar 
        open={snackbar.open} message={snackbar.message} severity={snackbar.severity} 
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
      />
    </>
  );
};

export default SalesEntry;