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

  const initialState = {
    date: new Date().toISOString().split("T")[0],
    customerName: "",
    gstin: "",
    mobile: "",
    street: "",
    city: "Samastipur",
    items: [{ productName: "", quantity: "", rate: "", productId: "", hsn: "" }],
    billNo: "",
    vehicleNo: "",
    travelingCost: 0,
    cashDiscount: 0,
    totalPrice: 0,
    amountReceived: 0,
    paymentDue: 0,
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
  const [products, setProducts] = useState([]);
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
      // Reset serial if month changed, else increment
      if (currentMonth === parts[2]) nextSerial = lastSerial + 1;
    }
    return `DS/${finYear}/${currentMonth}/${String(nextSerial).padStart(3, '0')}`;
  };

  const fetchData = useCallback(async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      const [supRes, prodRes, salesRes] = await Promise.all([
        fetchPartiesList('SUPPLIER'),
        axios.get(`${API_URL}/stocks`, getAuthHeader()),
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

    if (name === "productName") {
      // Improved match: Case insensitive and checks both 'name' and 'productName' fields
      const selectedProd = products.find(p => 
        (p.name?.toLowerCase() === value.toLowerCase()) || 
        (p.productName?.toLowerCase() === value.toLowerCase())
      );

      if (selectedProd) {
        newItems[index].productId = selectedProd._id;
        newItems[index].hsn = selectedProd.hsnCode || "";
      } else {
        newItems[index].productId = ""; // Reset if user types something invalid
      }
    }

    newItems[index][name] = value;
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

    // VALIDATION: Ensure all rows have a product selected from the DB
    const hasInvalidItem = formData.items.some(item => !item.productId || item.productId === "");
    console.log(hasInvalidItem, "--- hasInvalidItem");
    console.log(formData.items,"--- formData.items");
    
    if (hasInvalidItem) {
        return showMsg("Please select valid products from the suggestion list for all rows.", "error");
    }

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
        partyId: selectedParty?._id || "69ddc75636ee8ada6e41102f", // Default fallback if needed
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
        // Refresh serial numbers and products for the next bill
        await fetchData();
        // Reset form to initial state but keep the new Bill No
        setFormData(prev => ({ 
            ...initialState, 
            billNo: generateBillID(formData.billNo) 
        }));
      }
    } catch (error) {
      showMsg(error.response?.data?.message || "Submission failed. Please check network.", "error");
    } finally { setLoading(false); }
  };

  return (
    <>
      <SalesEntryForm 
        formData={formData} 
        nextSi={nextSi} 
        loading={loading}
        suppliers={suppliers} 
        products={products}
        handleChange={handleChange}
        handleCustomerSelect={handleCustomerSelect}
        handleItemChange={handleItemChange}
        addItem={addItem} 
        removeItem={removeItem}
        handleSubmit={handleSubmit}
        resetForm={() => fetchData()}
        initialState={initialState}
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