import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { fetchPartiesList } from "../../api/partyApi";
import { getAllProducts } from "../../api/productApi"; // 👈 API import
import SalesEntryForm from "./SalesEntryForm";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const toSafeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const SalesEntry = ({ user }) => {
  const userRole = user?.role?.toUpperCase();
  const isAuthorized = ["ADMIN", "ACCOUNTANT", "MANAGER"].includes(userRole);

  const initialState = {
    date: new Date().toISOString().split("T")[0],
    customerName: "",
    gstin: "",
    mobile: "",
    street: "",
    city: "Samastipur",
    // items mein ab hum ID aur HSN ko priority denge
    items: [{ productName: "", quantity: "", rate: "", productId: "", hsn: "" }],
    billNo: "",
    vehicleNo: "",
    travelingCost: 0,
    cashDiscount: 0,
    totalPrice: 0,
    amountReceived: 0,
    paymentDue: 0,
    remarks: "",
    paymentMode: "BY BANK",
    dispatchedThrough: "",
    destination: "",
    lrRrNo: "",
  };

  const [formData, setFormData] = useState(initialState);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]); // 👈 Master Product List
  const [nextSi, setNextSi] = useState(1);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const getAuthHeader = useCallback(() => ({
    headers: { Authorization: `Bearer ${user?.token}` }
  }), [user]);

  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  // --- SMART DATA FETCHING ---
  const fetchData = useCallback(async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      const [supRes, prodRes, salesRes] = await Promise.all([
        fetchPartiesList('SUPPLIER'),
        getAllProducts({ isActive: true }), // 👈 Seedhe Product Master se data
        axios.get(`${API_URL}/sales`, getAuthHeader())
      ]);

      if (supRes.data?.success) setSuppliers(supRes.data.data);
      if (prodRes.data?.success) setProducts(prodRes.data.data);

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

  // --- AUTO GENERATE BILL ID ---
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

  // --- CUSTOMER SELECTION ---
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

  // --- SMART ITEM SELECTION (NO HARDCODING) ---
  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...formData.items];

    if (name === "productId") { // 👈 Select dropdown ab productId bhejega
      const selectedProd = products.find(p => p._id === value);
      if (selectedProd) {
        newItems[index].productId = selectedProd._id;
        newItems[index].productName = selectedProd.name;
        newItems[index].hsn = selectedProd.hsnCode || "000000";
        newItems[index].rate = selectedProd.salesPrice || ""; // Auto-fill sales price
      }
    } else {
      newItems[index][name] = value;
    }

    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => setFormData(prev => ({ 
    ...prev, 
    items: [...prev.items, { productName: "", quantity: "", rate: "", productId: "", hsn: "" }] 
  }));

  const removeItem = (index) => setFormData(prev => ({ 
    ...prev, 
    items: prev.items.filter((_, i) => i !== index) 
  }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- TOTAL CALCULATION ---
  useEffect(() => {
    let sub = 0;
    formData.items.forEach(item => { sub += toSafeNumber(item.quantity) * toSafeNumber(item.rate); });
    const disc = toSafeNumber(formData.cashDiscount);
    const freight = toSafeNumber(formData.travelingCost);
    const received = toSafeNumber(formData.amountReceived);

    const grand = (sub + freight) - disc;
    setFormData(prev => ({ ...prev, totalPrice: grand, paymentDue: grand - received }));
  }, [formData.items, formData.travelingCost, formData.cashDiscount, formData.amountReceived]);

  // --- SUBMIT SALE ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthorized) return showMsg("Access Denied!", "error");

    const hasInvalidItem = formData.items.some(item => !item.productId);
    if (hasInvalidItem) return showMsg("Please select a product from the list for all rows.", "error");

    const selectedParty = suppliers.find(s => s.name === formData.customerName);

    setLoading(true);
    try {
      const goods = formData.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        hsn: item.hsn,
        quantity: toSafeNumber(item.quantity),
        unit: "KG",
        rate: toSafeNumber(item.rate),
        taxableAmount: toSafeNumber(item.quantity) * toSafeNumber(item.rate)
      }));

      const isBihar = formData.gstin?.startsWith("10");
      const gstTypeValue = isBihar ? "CGST/SGST" : "IGST";

      const payload = {
        billNo: formData.billNo,
        date: formData.date,
        partyId: selectedParty?._id,
        customerName: formData.customerName,
        logistics: {
          vehicleNo: formData.vehicleNo.toUpperCase(),
          dispatchedThrough: formData.dispatchedThrough.toUpperCase(),
          destination: formData.destination.toUpperCase(),
          lrRrNo: formData.lrRrNo,
          freight: toSafeNumber(formData.travelingCost)
        },
        goods: goods,
        gstType: gstTypeValue,
        discount: toSafeNumber(formData.cashDiscount),
        amountPaid: toSafeNumber(formData.amountReceived),
        performedBy: user?._id,
        remarks: formData.remarks
      };

      const res = await axios.post(`${API_URL}/sales`, payload, getAuthHeader());
      
      if (res.data.success) {
        showMsg("✅ Bill Saved & Inventory Synced!");
        fetchData();
        setFormData({ ...initialState, billNo: generateBillID(formData.billNo) });
      }
    } catch (error) {
      showMsg(error.response?.data?.message || "Submission failed.", "error");
    } finally { setLoading(false); }
  };

  return (
    <>
      <SalesEntryForm 
        formData={formData} 
        nextSi={nextSi} 
        loading={loading}
        suppliers={suppliers} 
        products={products} // 👈 Dynamic Products
        handleChange={handleChange}
        handleCustomerSelect={handleCustomerSelect}
        handleItemChange={handleItemChange}
        addItem={addItem} 
        removeItem={removeItem}
        handleSubmit={handleSubmit}
        resetForm={() => fetchData()}
      />
      <CustomSnackbar 
        open={snackbar.open} 
        message={snackbar.message} 
        severity={snackbar.severity} 
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
      />
    </>
  );
};

export default SalesEntry;