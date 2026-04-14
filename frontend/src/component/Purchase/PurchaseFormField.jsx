import React, { useState, useEffect } from "react";
import { 
  Calendar, User, Hash, Truck, MapPin, Package, 
  Layers, CreditCard, Save, X, Plus, Minus, ShieldAlert, MessageSquare
} from "lucide-react";

// API & Core Components
import { createPurchase } from "../../api/purchaseApi"; 
import { fetchPartiesList } from "../../api/partyApi";
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

/**
 * Helper: Ensures numerical safety
 */
const toSafeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const PurchaseFormField = ({ user, onCancel, onSuccess }) => {
  // 🔐 Permissions
  const userRole = user?.role?.toUpperCase();
  const isAuthorized = userRole === "ADMIN" || userRole === "ACCOUNTANT";

  // 📝 Constants
  const productList = ["Corn", "Corn Greet", "Cattle Feed", "Aatarice", "Rice Greet", "Packing Bag", "Rice Broken"];

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

  // 🧠 State
  const [formData, setFormData] = useState(initialState);
  const [suppliers, setSuppliers] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [travelMode, setTravelMode] = useState("-"); 
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showMsg = (msg, type = "success") => setSnackbar({ open: true, message: msg, severity: type });

  // 🔄 Load Suppliers
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        setLoading(true);
        const res = await fetchPartiesList('SUPPLIER'); 
        if (res.data?.success) setSuppliers(res.data.data);
      } catch (err) { 
        showMsg("Suppliers load karne mein problem aayi", "error");
      } finally { setLoading(false); }
    };
    loadSuppliers();
  }, []);

  // 🧮 Live Calculations
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

  // 🖊️ Event Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSupplierSelect = (e) => {
    const selectedName = e.target.value;
    const supplier = suppliers.find((s) => s.name === selectedName);

    if (supplier) {
      let finalName = supplier.name;
      if (supplier.name === "Local customer") {
        const customName = prompt("Enter Local Supplier Name:");
        if (customName) finalName = customName;
      }
      setFormData(prev => ({
        ...prev,
        supplierName: finalName,
        gstin: supplier.gstin || "URD",
        mobile: supplier.phone || "N/A",
        address: supplier.address?.street || "N/A",
      }));
    } else {
      setFormData(prev => ({ ...prev, supplierName: selectedName, gstin: "", mobile: "", address: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthorized) return showMsg("Unauthorized Access!", "error");
    if (!formData.supplierName || !formData.productName) return showMsg("Supplier aur Product zaroori hain!", "warning");

    try {
      setLoading(true);
      const payload = {
        ...formData,
        travelMode,
        performedBy: user?._id
      };

      const res = await createPurchase(payload);
      if (res.data.success) {
        showMsg("✅ Purchase Entry Successful!");
        setFormData(initialState);
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      showMsg(error.response?.data?.message || "Save failed!", "error");
    } finally { setLoading(false); }
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
            <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1 rounded-full text-xs font-bold border border-red-500/50 text-red-200">
              <ShieldAlert size={14} /> Read Only
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Section 1: Supplier Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <InputField label="Date" icon={<Calendar size={12}/>} type="date" name="date" value={formData.date} onChange={handleChange} disabled={loading || !isAuthorized} />
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1"><User size={12}/> Select Supplier</label>
              <select name="supplierName" value={formData.supplierName === "" ? "" : (suppliers.find(s => s.name === formData.supplierName) ? formData.supplierName : "Local customer")} onChange={handleSupplierSelect} required disabled={loading || !isAuthorized} className="form-input-zinc">
                <option value="">-- Choose Supplier --</option>
                {suppliers.map((s) => <option key={s._id} value={s.name}>{s.name}</option>)}
              </select>
            </div>

            <InputField label="Supplier Name (Saved)" name="supplierName" value={formData.supplierName} readOnly className="font-bold text-emerald-600" />
            <InputField label="GSTIN" name="gstin" value={formData.gstin} readOnly />
            <InputField label="Mobile No" icon={<CreditCard size={12}/>} name="mobile" value={formData.mobile} readOnly />
            <InputField label="Bill No" icon={<Hash size={12}/>} name="billNo" value={formData.billNo} onChange={handleChange} placeholder="Optional" disabled={loading || !isAuthorized} />
            <InputField label="Vehicle No" icon={<Truck size={12}/>} name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} placeholder="BR-01-XXXX" disabled={loading || !isAuthorized} />
            <InputField label="Address" icon={<MapPin size={12}/>} name="address" value={formData.address} readOnly />
          </div>

          {/* Section 2: Product & Cost */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-500 uppercase flex items-center gap-1"><Layers size={14}/> Product Name</label>
              <select name="productName" value={formData.productName} onChange={handleChange} required disabled={loading || !isAuthorized} className="form-input-zinc bg-white dark:bg-zinc-900">
                <option value="">-- Select Product --</option>
                {productList.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <InputField label="Quantity (Kg/Unit)" type="number" name="quantity" value={formData.quantity} onChange={handleChange} required placeholder="0" disabled={loading || !isAuthorized} className="bg-white dark:bg-zinc-900" />
            <InputField label="Rate (Per Unit)" type="number" name="rate" value={formData.rate} onChange={handleChange} required placeholder="0.00" disabled={loading || !isAuthorized} className="bg-white dark:bg-zinc-900" />

            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-500 uppercase">Traveling Cost (₹)</label>
              <div className="flex gap-1">
                <button type="button" onClick={() => setTravelMode(prev => prev === "+" ? "-" : "+")} disabled={loading || !isAuthorized} 
                  className={`w-10 rounded-lg flex items-center justify-center font-bold text-white transition-all ${travelMode === "+" ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
                  {travelMode === "+" ? <Plus size={14}/> : <Minus size={14}/>}
                </button>
                <input type="number" name="travelingCost" value={formData.travelingCost} onChange={handleChange} placeholder="0" disabled={loading || !isAuthorized} className="flex-1 form-input-zinc bg-white dark:bg-zinc-900" />
              </div>
            </div>
          </div>

          {/* Section 3: Financials */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField label="Cash Discount (CD %)" type="number" name="cashDiscount" value={formData.cashDiscount} onChange={handleChange} placeholder="0 %" disabled={loading || !isAuthorized} />
                <InputField label="Paid Amount (₹)" type="number" name="paidAmount" value={formData.paidAmount} onChange={handleChange} placeholder="0" disabled={loading || !isAuthorized} />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                   <MessageSquare size={12} className="text-emerald-600"/> Remarks / Notes
                </label>
                <textarea name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Transaction details..." disabled={loading || !isAuthorized} rows="3" className="form-input-zinc min-h-[100px] resize-none pt-3" />
              </div>
            </div>

            {/* Financial Card */}
            <div className="bg-zinc-50 dark:bg-zinc-800/80 p-6 rounded-3xl border-2 border-zinc-100 dark:border-zinc-800 space-y-4 h-fit sticky top-6">
               <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4">Financial Summary</h3>
               <SummaryItem label="Final Bill Amount" value={formData.totalAmount} main />
               <div className="h-px bg-zinc-200 dark:bg-zinc-700 w-full" />
               <SummaryItem label="Balance Due" value={formData.balanceAmount} isDanger={formData.balanceAmount > 0} />
               <p className="text-[9px] text-zinc-400 leading-relaxed italic text-center">Calculated: (Qty * Rate) - CD + Traveling</p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-6 border-t dark:border-zinc-800">
            <button type="button" onClick={onCancel} className="px-8 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-black text-[10px] uppercase hover:bg-zinc-200 transition-all">Cancel</button>
            <button type="submit" disabled={loading || !isAuthorized} className="px-12 py-2.5 rounded-xl bg-emerald-600 text-white font-black text-[10px] uppercase shadow-xl hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50">
              {loading ? "Saving..." : !isAuthorized ? "🔒 Locked" : "Save Purchase"}
            </button>
          </div>
        </form>
      </div>

      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />
      <style>{`
        .form-input-zinc { width: 100%; background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 0.75rem; padding: 0.65rem 0.75rem; font-size: 0.875rem; outline: none; transition: all 0.2s; }
        .dark .form-input-zinc { background: #18181b; border-color: #27272a; color: #f4f4f5; }
        .form-input-zinc:focus { border-color: #10b981; box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1); }
      `}</style>
    </div>
  );
};

// --- Sub-components for cleaner JSX ---
const InputField = ({ label, icon, ...props }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
      {icon} {label}
    </label>
    {props.readOnly ? (
      <input {...props} className={`w-100 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-500 cursor-not-allowed ${props.className}`} readOnly />
    ) : (
      <input {...props} className={`form-input-zinc ${props.className}`} />
    )}
  </div>
);

const SummaryItem = ({ label, value, main, isDanger }) => (
  <div className="flex justify-between items-center text-xs font-bold text-zinc-500 uppercase">
    <span>{label}</span>
    <span className={`tracking-tighter ${main ? 'text-lg font-black text-zinc-900 dark:text-white' : `text-xl font-black ${isDanger ? 'text-red-500' : 'text-emerald-500'}`}`}>
      ₹{toSafeNumber(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
    </span>
  </div>
);

export default PurchaseFormField;