import React, { useState, useEffect, useCallback } from "react";
import { Package, ShieldAlert, Save, X } from "lucide-react";

// API & Core Components
import { createPurchase } from "../../api/purchaseApi"; 
import { fetchPartiesList } from "../../api/partyApi";
import { getAllProducts } from "../../api/productApi"; 
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

// --- Sub-Components ---
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

  // ✅ INITIAL STATE - Updated for your New Schema
  const initialState = {
    date: new Date().toISOString().split("T")[0], // ❌ purchaseDate -> ✅ date
    billNo: "", // purchaseBillNo -> billNo
    customerName: "", // ❌ supplierName -> ✅ customerName (as per your request)
    partyId: "", // ❌ supplierId -> ✅ partyId
    gstin: "",      
    mobile: "",     
    address: "",    
    productName: "", 
    productId: "", 
    hsn: "",       
    unit: "KG",
    vehicleNo: "",
    quantity: "",
    rate: "",
    freight: "", // ❌ travelingCost -> ✅ freight
    cashDiscount: "", 
    grandTotal: 0,
    amountPaid: "",
    balanceDue: 0,
    remarks: "",
  };

  const [formData, setFormData] = useState(initialState);
  const [suppliers, setSuppliers] = useState([]); 
  const [products, setProducts] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [travelMode, setTravelMode] = useState("-"); 
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showMsg = (msg, type = "success") => setSnackbar({ open: true, message: msg, severity: type });

  const loadMasterData = useCallback(async () => {
    try {
      setLoading(true);
      const [supRes, prodRes] = await Promise.all([
        fetchPartiesList('SUPPLIER'),
        getAllProducts({ isActive: true }) 
      ]);

      if (supRes.data?.success) setSuppliers(supRes.data.data);
      if (prodRes.data?.success) setProducts(prodRes.data.data);
    } catch (err) { 
      showMsg("Master data load nahi ho paya", "error");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadMasterData(); }, [loadMasterData]);

  // 🧮 LIVE CALCULATIONS
  useEffect(() => {
    const qty = toSafeNumber(formData.quantity);
    const rate = toSafeNumber(formData.rate);
    const freightVal = toSafeNumber(formData.freight);
    const cdPercent = toSafeNumber(formData.cashDiscount);
    const paid = toSafeNumber(formData.amountPaid);

    const basePrice = qty * rate;
    const discountAmount = (basePrice * cdPercent) / 100;
    const travelEffect = travelMode === "+" ? freightVal : (travelMode === "-" ? -freightVal : 0);

    const total = Math.round(basePrice - discountAmount + travelEffect); 
    const balance = Math.round(total - paid);

    setFormData(prev => ({
      ...prev,
      grandTotal: total,
      balanceDue: balance,
    }));
  }, [formData.quantity, formData.rate, formData.cashDiscount, formData.amountPaid, formData.freight, travelMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "productId") { 
      const selected = products.find(p => p._id === value);
      if (selected) {
        setFormData(prev => ({
          ...prev,
          productId: value,
          productName: selected.name,
          hsn: selected.hsnCode,
          unit: selected.unit,
          rate: selected.purchasePrice || prev.rate 
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // 💾 SUBMIT PURCHASE - Updated with NEW Mappings
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthorized) return showMsg("Unauthorized!", "error");
    if (!formData.productId) return showMsg("Kripya Product select karein", "error");

    // Supplier selection logic for ID and Name mapping
    const selectedSupplier = suppliers.find(s => s.name === formData.customerName || s._id === formData.partyId);

    setLoading(true);
    try {
      const isBihar = selectedSupplier?.gstin?.startsWith("10");
      const calculatedGstType = isBihar ? "CGST/SGST" : "IGST";

      // DETERMINING STATUS
      let status = "UNPAID";
      if (toSafeNumber(formData.amountPaid) > 0) {
          status = toSafeNumber(formData.balanceDue) <= 0 ? "PAID" : "PARTIAL";
      }

      const payload = {
        date: formData.date, // ✅ Fixed Field
        billNo: formData.billNo || `PUR-${Date.now()}`,
        partyId: selectedSupplier?._id || formData.partyId, // ✅ Fixed Field
        customerName: selectedSupplier?.name || formData.customerName, // ✅ Fixed Field
        gstin: formData.gstin || "URD",
        mobile: formData.mobile || "",
        address: formData.address || "",

        // ✅ Fixed goods[] Structure
        goods: [{
          productId: formData.productId, 
          productName: formData.productName,
          hsn: formData.hsn,
          quantity: toSafeNumber(formData.quantity),
          rate: toSafeNumber(formData.rate),
          taxableAmount: toSafeNumber(formData.quantity) * toSafeNumber(formData.rate),
          unit: formData.unit
        }],

        // ✅ Fixed logistics.freight Structure
        logistics: {
          vehicleNo: (formData.vehicleNo || "").toUpperCase(),
          freight: toSafeNumber(formData.freight), 
          isFreightPaid: travelMode === "-" // logic for internal sync
        },

        gstType: calculatedGstType,
        subTotal: toSafeNumber(formData.quantity) * toSafeNumber(formData.rate),
        discount: toSafeNumber(formData.cashDiscount),
        grandTotal: toSafeNumber(formData.grandTotal),
        amountPaid: toSafeNumber(formData.amountPaid),
        balanceDue: toSafeNumber(formData.balanceDue),
        status: status, // ✅ Added status
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
      showMsg(error.response?.data?.message || "Data processing error", "error");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 font-sans text-left">
      {loading && <Loader />}
      
      <div className="max-w-7xl mx-auto bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-600 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <Package size={28} className="p-1.5 bg-white/20 rounded-lg" />
            <div>
              <h2 className="text-xl font-black tracking-tight uppercase italic">Purchase Management</h2>
              <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest opacity-80">Synced with Product Master</p>
            </div>
          </div>
          {!isAuthorized && (
            <div className="flex items-center gap-2 bg-red-500/20 px-4 py-2 rounded-xl text-xs font-black border border-red-500/50 uppercase">
              <ShieldAlert size={14} /> Read Only Mode
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-10">
          
          {/* SECTION 1: SUPPLIER INFO */}
          <div className="glass-section relative p-6 bg-zinc-50 dark:bg-zinc-800/30 rounded-3xl border border-zinc-200 dark:border-zinc-700">
            <div className="absolute -top-3 left-6 bg-zinc-900 dark:bg-emerald-600 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
              1. Supplier & Logistics
            </div>
            {/* Note: In your Sub-Components, ensure they use 'date', 'customerName', and 'freight' props */}
            <SupplierSection 
              formData={formData} 
              suppliers={suppliers} 
              loading={loading} 
              isAuthorized={isAuthorized} 
              setFormData={setFormData}
              handleChange={handleChange}
            />
          </div>

          {/* SECTION 2: PRODUCT INFO */}
          <div className="glass-section relative p-6 bg-zinc-50 dark:bg-zinc-800/30 rounded-3xl border border-zinc-200 dark:border-zinc-700">
            <div className="absolute -top-3 left-6 bg-zinc-900 dark:bg-emerald-600 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
              2. Product & Inventory Data
            </div>
            <ProductSection 
              formData={formData} 
              products={products}
              setFormData={setFormData}
              loading={loading} 
              isAuthorized={isAuthorized} 
              handleChange={handleChange}
              travelMode={travelMode}
              setTravelMode={setTravelMode}
            />
          </div>

          {/* SECTION 3: FINANCIALS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 glass-section relative p-6 bg-zinc-50 dark:bg-zinc-800/30 rounded-3xl border border-zinc-200 dark:border-zinc-700">
               <div className="absolute -top-3 left-6 bg-zinc-900 dark:bg-emerald-600 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                3. Final Settlement
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

          {/* ACTION BUTTONS */}
          <div className="flex justify-end items-center gap-4 pt-6 border-t dark:border-zinc-800">
            <button 
              type="button" 
              onClick={onCancel} 
              className="px-8 py-4 rounded-2xl text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all font-black text-[10px] uppercase tracking-widest"
            >
              Cancel Entry
            </button>
            <button 
              type="submit" 
              disabled={loading || !isAuthorized} 
              className="group relative px-12 py-5 rounded-[1.5rem] bg-zinc-900 dark:bg-emerald-600 hover:bg-black dark:hover:bg-emerald-500 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-3">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18}/>}
                <span>Validate & Save Purchase</span>
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