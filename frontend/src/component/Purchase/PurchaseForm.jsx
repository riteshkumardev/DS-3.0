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

  const initialState = {
    date: new Date().toISOString().split("T")[0],
    supplierName: "",
    gstin: "",      
    mobile: "",     
    address: "",    
    productName: "",
    billNo: "",
    vehicleNo: "",
    quantity: "",
    rate: "",
    travelingCost: "", 
    cashDiscount: "", 
    totalAmount: 0,
    paidAmount: "",
    balanceAmount: 0,
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

  // Live Calculations
  useEffect(() => {
    const qty = toSafeNumber(formData.quantity);
    const rate = toSafeNumber(formData.rate);
    const travel = toSafeNumber(formData.travelingCost);
    const cdPercent = toSafeNumber(formData.cashDiscount);
    const paid = toSafeNumber(formData.paidAmount);

    const basePrice = qty * rate;
    const discountAmount = (basePrice * cdPercent) / 100;
    const travelEffect = travelMode === "+" ? travel : -travel;

    const total = basePrice - discountAmount + travelEffect; 
    const balance = total - paid;

    setFormData((prev) => ({
      ...prev,
      totalAmount: Math.round(total),
      balanceAmount: Math.round(balance),
    }));
  }, [formData.quantity, formData.rate, formData.cashDiscount, formData.paidAmount, formData.travelingCost, travelMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!isAuthorized) return showMsg("Unauthorized!", "error");

  // 1. Supplier find karein taaki ID aur exact metadata mil sake
  const selectedSupplier = suppliers.find(s => s.name === formData.supplierName);

  setLoading(true);
  try {
    // 2. GST Type calculation (Bihar code: 10)
    const isBihar = selectedSupplier?.gstin?.startsWith("10");
    const calculatedGstType = isBihar ? "CGST/SGST" : "IGST";

    // 3. Goods Array: Backend validation ke liye product matching zaroori hai
    const goodsArray = [{
      productName: formData.productName,
      quantity: toSafeNumber(formData.quantity),
      rate: toSafeNumber(formData.rate),
      taxableAmount: toSafeNumber(formData.quantity) * toSafeNumber(formData.rate),
      unit: "KG",
      // IMPORTANT: Agar aapke paas products ki list hai, toh yahan selectedProd._id bhejein
      // Agar nahi hai, toh backend handle karega, lekin productName pass hona chahiye
      productId: formData.productName 
    }];

    // 4. Final Payload (Backend schema ke according)
    const payload = {
      date: formData.date,
      billNo: formData.billNo || `PUR-${Date.now()}`,
      supplierId: selectedSupplier?._id || "69ddddbdb0477c53bf79cd3e",
      supplierName: formData.supplierName, // ✅ FIXED: Puraane logic mein ye missing tha
      gstin: formData.gstin || selectedSupplier?.gstin || "URD",
      mobile: formData.mobile || selectedSupplier?.phone || "",
      address: formData.address || selectedSupplier?.address?.street || "",
      
      logistics: {
        vehicleNo: formData.vehicleNo.toUpperCase(),
        freight: toSafeNumber(formData.travelingCost),
        travelMode: travelMode
      },
      
      goods: goodsArray, // ✅ Iterable Array
      gstType: calculatedGstType,
      discount: toSafeNumber(formData.cashDiscount),
      amountPaid: toSafeNumber(formData.paidAmount),
      grandTotal: toSafeNumber(formData.totalAmount),
      remarks: formData.remarks,
      performedBy: user?._id
    };

    // 5. API Call
    const res = await createPurchase(payload);
    
    if (res.data.success) {
      showMsg("✅ Purchase Entry Saved Successfully!");
      setFormData(initialState);
      if (onSuccess) onSuccess();
    }
  } catch (error) {
    // Backend se aane wala specific error dikhayein (e.g. "Path supplierName is required")
    const errorMsg = error.response?.data?.message || "Data processing error";
    showMsg(errorMsg, "error");
    console.error("Purchase Submit Error:", error);
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
            <h2 className="text-lg font-black tracking-tight uppercase">Purchase Entry (Live Stock)</h2>
          </div>
          {!isAuthorized && (
            <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1 rounded-full text-xs font-bold border border-red-500/50">
              <ShieldAlert size={14} /> Read Only
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          
          <SupplierSection 
            formData={formData} 
            suppliers={suppliers} 
            loading={loading} 
            isAuthorized={isAuthorized} 
            setFormData={setFormData}
            handleChange={handleChange}
          />

          <ProductSection 
            formData={formData} 
            loading={loading} 
            isAuthorized={isAuthorized} 
            handleChange={handleChange}
            travelMode={travelMode}
            setTravelMode={setTravelMode}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <FinancialSection 
                formData={formData} 
                loading={loading} 
                isAuthorized={isAuthorized} 
                handleChange={handleChange}
              />
            </div>
            
            <SummaryCard 
                totalAmount={formData.totalAmount} 
                balanceAmount={formData.balanceAmount} 
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t dark:border-zinc-800">
            <button type="button" onClick={onCancel} className="px-8 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all">Cancel</button>
            <button type="submit" disabled={loading || !isAuthorized} className="px-12 py-2.5 rounded-xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all">
              {loading ? "Saving..." : !isAuthorized ? "🔒 Locked" : <div className="flex items-center gap-2"><Save size={14}/> Save Purchase</div>}
            </button>
          </div>
        </form>
      </div>

      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />
      
      <style>{`
        .form-input-zinc { width: 100%; background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 0.75rem; padding: 0.65rem 0.75rem; font-size: 0.875rem; outline: none; transition: all 0.2s; }
        .dark .form-input-zinc { background: #18181b; border-color: #27272a; color: #f4f4f5; }
        .form-input-zinc:focus { border-color: #10b981; box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1); }
        .form-input-zinc-readonly { width: 100%; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 0.65rem 0.75rem; font-size: 0.875rem; color: #64748b; }
        .dark .form-input-zinc-readonly { background: #09090b; border-color: #18181b; color: #71717a; }
        .label-style { font-size: 10px; font-weight: 900; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.1em; display: flex; align-items: center; gap: 4px; margin-bottom: 4px; }
      `}</style>
    </div>
  );
};

export default PurchaseForm;