import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { fetchPartiesList } from "../../api/partyApi";
import { getAllProducts } from "../../api/productApi";
import { createSale, updateSale } from "../../api/saleApi"; // Modular API use karein
import SalesEntryForm from "./SalesEntryForm";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const toSafeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const SalesEntry = ({ user, editData, onCancel, onSuccess }) => {
  const userRole = user?.role?.toUpperCase();
  const isAuthorized = ["ADMIN", "ACCOUNTANT", "MANAGER"].includes(userRole);

  const initialState = {
    date: new Date().toISOString().split("T")[0],
    customerName: "",
    partyId: "",
    gstin: "",
    mobile: "",
    street: "",
    city: "Samastipur",
    // Backend 'goods' use karta hai, frontend state 'items' rakhte hain render ke liye
    items: [{ productId: "", productName: "", hsn: "", quantity: "", rate: "", unit: "KG" }],
    billNo: "",
    vehicleNo: "",
    travelingCost: 0, // Maps to logistics.freight
    cashDiscount: 0,
    totalPrice: 0, // Maps to grandTotal
    amountReceived: 0, // Maps to amountPaid
    paymentDue: 0, // Maps to balanceDue
    remarks: "",
    paymentMode: "CREDIT",
    dispatchedThrough: "",
    destination: "",
    lrRrNo: "",
  };

  const [formData, setFormData] = useState(initialState);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [nextSi, setNextSi] = useState(1);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showMsg = (msg, type = "success") => setSnackbar({ open: true, message: msg, severity: type });

  // --- DATA LOADING ---
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [supRes, prodRes] = await Promise.all([
        fetchPartiesList('SUPPLIER'), // Customers fetch karein
        getAllProducts({ isActive: true })
      ]);

      if (supRes.data?.success) setSuppliers(supRes.data.data);
      if (prodRes.data?.success) setProducts(prodRes.data.data);

      // Agar Naya Entry hai toh Bill ID generate karein
      if (!editData) {
        // Serial number logic backend se fetch kar sakte hain ya props se le sakte hain
        setFormData(prev => ({ ...prev, billNo: "" })); 
      }
    } catch (err) {
      showMsg("Master data load failed.", "error");
    } finally { setLoading(false); }
  }, [editData]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- ✏️ EDIT MODE SYNC ---
  useEffect(() => {
    if (editData) {
      setFormData({
        ...editData,
        date: editData.date?.split('T')[0] || "",
        customerName: editData.customerName || "",
        partyId: editData.partyId?._id || editData.partyId || "",
        vehicleNo: editData.logistics?.vehicleNo || "",
        dispatchedThrough: editData.logistics?.dispatchedThrough || "",
        destination: editData.logistics?.destination || "",
        lrRrNo: editData.logistics?.lrRrNo || "",
        travelingCost: editData.logistics?.freight || 0,
        amountReceived: editData.amountPaid || 0,
        cashDiscount: editData.discount || 0,
        // Goods mapping back to items
        items: editData.goods?.map(g => ({
          productId: g.productId?._id || g.productId,
          productName: g.productName,
          hsn: g.hsn,
          quantity: g.quantity,
          rate: g.rate,
          unit: g.unit || "KG"
        })) || initialState.items
      });
    }
  }, [editData]);

  // --- HANDLERS ---
  const handleCustomerSelect = (e) => {
    const selectedName = e.target.value;
    const customer = suppliers.find((s) => s.name === selectedName);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerName: customer.name,
        partyId: customer._id,
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

    if (name === "productId") {
      const selectedProd = products.find(p => p._id === value);
      if (selectedProd) {
        newItems[index] = {
          ...newItems[index],
          productId: selectedProd._id,
          productName: selectedProd.name,
          hsn: selectedProd.hsnCode || "",
          rate: selectedProd.salesPrice || "",
        };
      }
    } else {
      newItems[index][name] = value;
    }
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => setFormData(prev => ({ 
    ...prev, 
    items: [...prev.items, { productId: "", productName: "", hsn: "", quantity: "", rate: "", unit: "KG" }] 
  }));

  const removeItem = (index) => setFormData(prev => ({ 
    ...prev, 
    items: prev.items.filter((_, i) => i !== index) 
  }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- LIVE CALCULATIONS ---
  useEffect(() => {
    const sub = formData.items.reduce((acc, curr) => acc + (toSafeNumber(curr.quantity) * toSafeNumber(curr.rate)), 0);
    const freight = toSafeNumber(formData.travelingCost);
    const disc = toSafeNumber(formData.cashDiscount);
    const received = toSafeNumber(formData.amountReceived);

    const grand = (sub + freight) - disc;
    setFormData(prev => ({ 
      ...prev, 
      totalPrice: Math.round(grand), 
      paymentDue: Math.round(grand - received) 
    }));
  }, [formData.items, formData.travelingCost, formData.cashDiscount, formData.amountReceived]);

  // --- SUBMIT ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthorized) return showMsg("Access Denied!", "error");
    if (!formData.partyId) return showMsg("Please select a valid customer.", "error");

    setLoading(true);
    try {
      const payload = {
        ...formData,
        goods: formData.items.map(item => ({
          ...item,
          taxableAmount: toSafeNumber(item.quantity) * toSafeNumber(item.rate)
        })),
        logistics: {
          vehicleNo: (formData.vehicleNo || "").toUpperCase(),
          dispatchedThrough: formData.dispatchedThrough,
          destination: formData.destination,
          lrRrNo: formData.lrRrNo,
          freight: toSafeNumber(formData.travelingCost)
        },
        gstType: formData.gstin?.startsWith("10") ? "CGST/SGST" : "IGST",
        grandTotal: toSafeNumber(formData.totalPrice),
        amountPaid: toSafeNumber(formData.amountReceived),
        discount: toSafeNumber(formData.cashDiscount),
        performedBy: user?._id
      };

      const res = editData?._id 
        ? await updateSale(editData._id, payload)
        : await createSale(payload);
      
      if (res.data.success) {
        showMsg(editData ? "✅ Update Successful!" : "✅ Sale Created Successfully!");
        if (onSuccess) onSuccess();
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
        products={products}
        handleChange={handleChange}
        handleCustomerSelect={handleCustomerSelect}
        handleItemChange={handleItemChange}
        addItem={addItem} 
        removeItem={removeItem}
        handleSubmit={handleSubmit}
        resetForm={onCancel || (() => setFormData(initialState))}
        editMode={!!editData}
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