import React, { useState, useEffect, useCallback } from "react";
import { Package, ShieldAlert, Save, X, Edit3 } from "lucide-react";

// API & Core Components
import { createPurchase, updatePurchase } from "../../api/purchaseApi"; 
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

const PurchaseForm = ({ user, editData, onCancel, onSuccess }) => {
  const userRole = user?.role?.toUpperCase();
  const isAuthorized = userRole === "ADMIN" || userRole === "ACCOUNTANT";

  // ✅ INITIAL STATE
  const initialState = {
    date: new Date().toISOString().split("T")[0], 
    billNo: "", 
    customerName: "", 
    partyId: "", 
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
    freight: "", 
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

  // 🔄 LOAD MASTER DATA
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

  // ✏️ EDIT MODE HANDLER - Pre-fill form when editData is provided
  useEffect(() => {
    if (editData) {
      const firstGood = editData.goods?.[0] || {};
      setFormData({
        ...editData,
        date: editData.date?.split('T')[0] || new Date().toISOString().split("T")[0],
        billNo: editData.billNo || "",
        customerName: editData.customerName || "",
        partyId: editData.partyId?._id || editData.partyId || "",
        // Goods mapping
        productId: firstGood.productId?._id || firstGood.productId || "",
        productName: firstGood.productName || "",
        quantity: firstGood.quantity || "",
        rate: firstGood.rate || "",
        hsn: firstGood.hsn || "",
        unit: firstGood.unit || "KG",
        // Logistics
        vehicleNo: editData.logistics?.vehicleNo || "",
        freight: Math.abs(toSafeNumber(editData.logistics?.freight)),
        // Financials
        cashDiscount: editData.discount || "",
        amountPaid: editData.amountPaid || "",
        remarks: editData.remarks || ""
      });
      // Set travel mode based on freight sign (negative means paid by us)
      setTravelMode(toSafeNumber(editData.logistics?.freight) < 0 ? "-" : "+");
    } else {
      setFormData(initialState);
    }
  }, [editData]);

  // 🧮 LIVE CALCULATIONS
  useEffect(() => {
    const qty = toSafeNumber(formData.quantity);
    const rate = toSafeNumber(formData.rate);
    const freightVal = toSafeNumber(formData.freight);
    const cdPercent = toSafeNumber(formData.cashDiscount);
    const paid = toSafeNumber(formData.amountPaid);

    const basePrice = qty * rate;
    const discountAmount = (basePrice * cdPercent) / 100;
    const travelEffect = travelMode === "+" ? freightVal : -freightVal;

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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 💾 SUBMIT (CREATE OR UPDATE)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthorized) return showMsg("Unauthorized!", "error");
    if (!formData.productId) return showMsg("Kripya Product select karein", "error");

    setLoading(true);
    try {
      const selectedSupplier = suppliers.find(s => s._id === formData.partyId || s.name === formData.customerName);
      const isBihar = selectedSupplier?.gstin?.startsWith("10");
      
      const payload = {
        date: formData.date,
        billNo: formData.billNo || `PUR-${Date.now()}`,
        partyId: formData.partyId,
        customerName: formData.customerName,
        goods: [{
          productId: formData.productId, 
          productName: formData.productName,
          hsn: formData.hsn,
          quantity: toSafeNumber(formData.quantity),
          rate: toSafeNumber(formData.rate),
          taxableAmount: toSafeNumber(formData.quantity) * toSafeNumber(formData.rate),
          unit: formData.unit
        }],
        logistics: {
          vehicleNo: (formData.vehicleNo || "").toUpperCase(),
     
          freight: travelMode === "-" ? -toSafeNumber(formData.freight) : toSafeNumber(formData.freight)
        },
        gstType: isBihar ? "CGST/SGST" : "IGST",
        discount: toSafeNumber(formData.cashDiscount),
        grandTotal: toSafeNumber(formData.grandTotal),
        amountPaid: toSafeNumber(formData.amountPaid),
        balanceDue: toSafeNumber(formData.balanceDue),
        remarks: formData.remarks,
        performedBy: user?._id
      };

      let res;
      if (editData?._id) {
        res = await updatePurchase(editData._id, payload);
      } else {
        res = await createPurchase(payload);
      }
      
      if (res.data.success) {
        showMsg(editData ? "✅ Update Successful!" : "✅ Purchase Saved!");
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      showMsg(error.response?.data?.message || "Error processing request", "error");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 font-sans text-left">
      {loading && <Loader />}
      
      <div className="max-w-7xl mx-auto bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className={`${editData ? 'bg-amber-600' : 'bg-emerald-600'} p-6 flex justify-between items-center text-white transition-colors`}>
          <div className="flex items-center gap-3">
            {editData ? <Edit3 size={28} className="p-1.5 bg-white/20 rounded-lg"/> : <Package size={28} className="p-1.5 bg-white/20 rounded-lg" />}
            <div>
              <h2 className="text-xl font-black tracking-tight uppercase italic">
                {editData ? "Edit Purchase Entry" : "New Purchase Management"}
              </h2>
              <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
                {editData ? `Modifying Bill: ${editData.billNo}` : "Procurement Sync with Inventory"}
              </p>
            </div>
          </div>
          {!isAuthorized && (
            <div className="flex items-center gap-2 bg-red-500/20 px-4 py-2 rounded-xl text-xs font-black border border-red-500/50 uppercase">
              <ShieldAlert size={14} /> Read Only Mode
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-10">
          
          <div className="glass-section relative p-6 bg-zinc-50 dark:bg-zinc-800/30 rounded-3xl border border-zinc-200 dark:border-zinc-700">
            <div className={`absolute -top-3 left-6 ${editData ? 'bg-amber-600' : 'bg-emerald-600'} text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg`}>
              1. Supplier & Logistics
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

          <div className="glass-section relative p-6 bg-zinc-50 dark:bg-zinc-800/30 rounded-3xl border border-zinc-200 dark:border-zinc-700">
            <div className={`absolute -top-3 left-6 ${editData ? 'bg-amber-600' : 'bg-emerald-600'} text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg`}>
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 glass-section relative p-6 bg-zinc-50 dark:bg-zinc-800/30 rounded-3xl border border-zinc-200 dark:border-zinc-700">
               <div className={`absolute -top-3 left-6 ${editData ? 'bg-amber-600' : 'bg-emerald-600'} text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg`}>
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
              Discard Changes
            </button>
            <button 
              type="submit" 
              disabled={loading || !isAuthorized} 
              className={`group relative px-12 py-5 rounded-[1.5rem] ${editData ? 'bg-amber-600 hover:bg-amber-700' : 'bg-zinc-900 dark:bg-emerald-600 hover:bg-black dark:hover:bg-emerald-500'} text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 disabled:opacity-50`}
            >
              <div className="flex items-center gap-3">
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18}/>}
                <span>{editData ? "Update Record" : "Validate & Save Purchase"}</span>
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