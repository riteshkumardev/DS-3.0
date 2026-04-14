import React, { useState, useEffect } from "react";
import { Package, ShieldAlert, Save } from "lucide-react";

// API & Core Components
import { createPurchase } from "../../api/purchaseApi"; 
import { fetchPartiesList } from "../../api/partyApi";
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

// --- Sub-Components Import ---
import SupplierSection from "./SupplierSection";
import ProductSection from "./ProductSection";
import FinancialSection from "./FinancialSection";
import SummaryCard from "./SummaryCard";

const toSafeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const PurchaseForm = ({ user, onCancel, onSuccess }) => {
  const userRole = user?.role?.toUpperCase();
  const isAuthorized = userRole === "ADMIN" || userRole === "ACCOUNTANT";

  // ✅ INITIAL STATE - Backend naming convention synced with your data
  const initialState = {
    purchaseDate: new Date().toISOString().split("T")[0],
    purchaseBillNo: "",
    billNo: "", 
    supplierName: "",
    supplierId: "",
    gstin: "",      
    mobile: "",     
    address: "",    
    productName: "CORN GRIT", // Default as per your data
    productId: "69ddf828b2da0117460f8ebf", // As per your response
    vehicleNo: "",
    quantity: "",
    rate: "",
    travelingCost: "", 
    cashDiscount: "", 
    grandTotal: 0,
    amountPaid: "",
    balanceDue: 0,
    remarks: "",
  };

  const [formData, setFormData] = useState(initialState);
  const [suppliers, setSuppliers] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [travelMode, setTravelMode] = useState("-"); 
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showMsg = (msg, type = "success") => setSnackbar({ open: true, message: msg, severity: type });

  // Load Suppliers
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        setLoading(true);
        const res = await fetchPartiesList('SUPPLIER'); 
        if (res.data?.success) setSuppliers(res.data.data);
      } catch (err) { 
        showMsg("Suppliers load nahi ho paye", "error");
      } finally { setLoading(false); }
    };
    loadSuppliers();
  }, []);

  // 🧮 LIVE CALCULATIONS
  useEffect(() => {
    const qty = toSafeNumber(formData.quantity);
    const rate = toSafeNumber(formData.rate);
    const travel = toSafeNumber(formData.travelingCost);
    const cdPercent = toSafeNumber(formData.cashDiscount);
    const paid = toSafeNumber(formData.amountPaid);

    const basePrice = qty * rate;
    const discountAmount = (basePrice * cdPercent) / 100;
    const travelEffect = travelMode === "+" ? travel : -travel;

    const total = Math.round(basePrice - discountAmount + travelEffect); 
    const balance = Math.round(total - paid);

    if (formData.grandTotal !== total || formData.balanceDue !== balance) {
      setFormData((prev) => ({
        ...prev,
        grandTotal: total,
        balanceDue: balance,
      }));
    }
  }, [formData.quantity, formData.rate, formData.cashDiscount, formData.amountPaid, formData.travelingCost, travelMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthorized) return showMsg("Unauthorized!", "error");

    const selectedSupplier = suppliers.find(s => s.name === formData.supplierName);

    setLoading(true);
    try {
      const isBihar = selectedSupplier?.gstin?.startsWith("10");
      const calculatedGstType = isBihar ? "CGST/SGST" : "IGST";

      // ✅ PAYLOAD - Synced with your Backend Schema
      const payload = {
        purchaseDate: formData.purchaseDate,
        purchaseBillNo: formData.purchaseBillNo || `PUR-${Date.now()}`,
        billNo: formData.purchaseBillNo || `PUR-${Date.now()}`, // Required path fix
        
        supplierId: selectedSupplier?._id || formData.supplierId || "69ddddbdb0477c53bf79cd3e",
        supplierName: formData.supplierName,
        gstin: formData.gstin || "URD",
        mobile: formData.mobile || "",
        address: formData.address || "",

        // Multiple items handle karne ke liye array format
        items: [{
          productId: formData.productId, 
          productName: formData.productName,
          quantity: toSafeNumber(formData.quantity),
          rate: toSafeNumber(formData.rate),
          taxableAmount: toSafeNumber(formData.quantity) * toSafeNumber(formData.rate),
          unit: "KG"
        }],

        logistics: {
          vehicleNo: (formData.vehicleNo || "").toUpperCase(),
          freight: toSafeNumber(formData.travelingCost),
          travelMode: travelMode
        },

        gstType: calculatedGstType,
        subTotal: toSafeNumber(formData.quantity) * toSafeNumber(formData.rate),
        discount: toSafeNumber(formData.cashDiscount),
        grandTotal: toSafeNumber(formData.grandTotal),
        amountPaid: toSafeNumber(formData.amountPaid),
        balanceDue: toSafeNumber(formData.balanceDue),
        
        performedBy: user?._id,
        remarks: formData.remarks
      };

      const res = await createPurchase(payload);
      
      if (res.data.success) {
        showMsg("✅ Purchase Entry Saved Successfully!");
        setFormData(initialState);
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Data processing error";
      showMsg(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 font-sans">
      {loading && <Loader />}
      
      <div className="max-w-7xl mx-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-600 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <Package size={24} />
            <h2 className="text-lg font-black tracking-tight uppercase">Purchase Entry (Dharashakti ERP)</h2>
          </div>
          {!isAuthorized && (
            <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1 rounded-full text-xs font-bold border border-red-500/50">
              <ShieldAlert size={14} /> Read Only
            </div>
          )}
        </div>

     // PurchaseForm.js ke andar form layout ko is tarah wrap karein
<form onSubmit={handleSubmit} className="p-6 space-y-10">
  
  {/* 🏢 SUPPLIER & LOGISTICS SECTION */}
  <div className="glass-section relative">
    <div className="absolute -top-3 left-6 bg-emerald-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
      Supplier Info
    </div>
    <SupplierSection 
      formData={formData} 
      suppliers={suppliers} 
      loading={loading} 
      isAuthorized={isAuthorized} 
      setFormData={setFormData}
      handleChange={handleChange}
    />
  </div>

  {/* 📦 PRODUCT DETAILS SECTION */}
  <div className="glass-section relative border-emerald-500/20">
    <div className="absolute -top-3 left-6 bg-emerald-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
      Product Details
    </div>
    <ProductSection 
      formData={formData} 
      setFormData={setFormData}
      loading={loading} 
      isAuthorized={isAuthorized} 
      handleChange={handleChange}
      travelMode={travelMode}
      setTravelMode={setTravelMode}
    />
  </div>

  {/* 💰 FINANCIAL & SUMMARY SECTION */}
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
    <div className="lg:col-span-2 glass-section relative">
       <div className="absolute -top-3 left-6 bg-emerald-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
        Payments & Remarks
      </div>
      <FinancialSection 
        formData={formData} 
        loading={loading} 
        isAuthorized={isAuthorized} 
        handleChange={handleChange}
      />
    </div>
    
    <div className="lg:col-span-1 h-full">
      <SummaryCard 
        totalAmount={formData.grandTotal} 
        balanceAmount={formData.balanceDue} 
      />
    </div>
  </div>

  {/* 🚀 ACTION BUTTONS */}
  <div className="flex justify-end items-center gap-4 pt-4">
    <button 
      type="button" 
      onClick={onCancel} 
      className="px-6 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all font-bold text-xs uppercase tracking-widest"
    >
      Cancel
    </button>
    <button 
      type="submit" 
      disabled={loading || !isAuthorized} 
      className="group relative px-10 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-[0.15em] shadow-[0_10px_20px_-10px_rgba(16,185,129,0.5)] transition-all active:scale-95 disabled:opacity-50"
    >
      <div className="flex items-center gap-2">
        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16}/>}
        <span>Save Purchase Record</span>
      </div>
    </button>
  </div>
</form>
      </div>

      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />
    </div>
  );
};

export default PurchaseForm;