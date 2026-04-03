import React, { useState, useEffect } from "react";
import axios from "axios"; 
import { 
  Calendar, User, Hash, Truck, MapPin, Package, 
  Layers, CreditCard, Info, Save, X, Plus, Minus, ShieldAlert, MessageSquare
} from "lucide-react";

// 🏗️ Core Components Import
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const PurchaseForm = ({user,onCancel }) => {
  const role=user.role
  console.log();
  
  console.log(user,"onCancel");
  
  // 🔐 Permission Check
  const isAuthorized = role === "Admin" || role === "Accountant";

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
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  
  // 🆕 Traveling Cost Mode State (+ ya - select karne ke liye)
  const [travelMode, setTravelMode] = useState("-"); 

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  const productList = ["Corn", "Corn Greet", "Cattle Feed", "Aatarice", "Rice Greet", "Packing Bag","Rice Broken"];

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/suppliers/list`); 
        if (res.data && res.data.success) {
          setSuppliers(res.data.data);
        }
      } catch (err) { 
        showMsg("Suppliers load नहीं हो पाए", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchSuppliers();
  }, [API_URL]);

  const handleSupplierSelect = (e) => {
    const selectedName = e.target.value;
    const supplier = suppliers.find((s) => s.name === selectedName);

    if (supplier) {
      let finalName = supplier.name;
      if (supplier.name === "Local customer") {
        const customName = prompt("कृपया बिल के लिए लोकल कस्टमर का नाम दर्ज करें:");
        if (customName) finalName = customName;
      }

      setFormData((prev) => ({
        ...prev,
        supplierName: finalName,
        gstin: supplier.gstin || "N/A",
        mobile: supplier.phone || "N/A",
        address: supplier.address || "N/A",
      }));
    } else {
      setFormData((prev) => ({ 
        ...prev, 
        supplierName: selectedName, gstin: "", mobile: "", address: "" 
      }));
    }
  };

  // 🧮 Live Calculations
  useEffect(() => {
    const qty = Number(formData.quantity) || 0;
    const rate = Number(formData.rate) || 0;
    const travel = Number(formData.travelingCost) || 0;
    const cdPercent = Number(formData.cashDiscount) || 0;

    const basePrice = qty * rate;
    const discountAmount = (basePrice * cdPercent) / 100;
    const travelEffect = travelMode === "+" ? travel : -travel;

    const total = basePrice - discountAmount + travelEffect; 
    const balance = total - (Number(formData.paidAmount) || 0);

    setFormData((prev) => ({
      ...prev,
      totalAmount: total,
      balanceAmount: balance,
    }));
  }, [formData.quantity, formData.rate, formData.cashDiscount, formData.paidAmount, formData.travelingCost, travelMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthorized) return showMsg("Unauthorized!", "error");

    setLoading(true);
    try {
      const payload = {
        ...formData,
        travelMode: travelMode,
        quantity: Number(formData.quantity),
        rate: Number(formData.rate),
        travelingCost: Number(formData.travelingCost) || 0,
        cashDiscount: Number(formData.cashDiscount) || 0,
        paidAmount: Number(formData.paidAmount) || 0
      };
      const res = await axios.post(`${API_URL}/api/purchases`, payload);
      if (res.data.success) {
        showMsg("✅ Purchase Record Saved Successfully!");
        setFormData(initialState);
        if (onCancel) setTimeout(() => onCancel(), 1000); 
      }
    } catch (error) {
      showMsg("❌ Data save नहीं हो पाया।", "error");
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
          {/* Section 1: Supplier Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1"><Calendar size={12}/> Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} disabled={loading || !isAuthorized} className="form-input-zinc" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1"><User size={12}/> Select Supplier</label>
              <select name="supplierName" value={formData.supplierName === "" ? "" : (suppliers.find(s => s.name === formData.supplierName) ? formData.supplierName : (formData.supplierName ? "Local customer" : ""))} onChange={handleSupplierSelect} required disabled={loading || !isAuthorized} className="form-input-zinc">
                <option value="">-- Choose Supplier --</option>
                {suppliers.map((s) => <option key={s._id} value={s.name}>{s.name}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Supplier Name (Saved)</label>
              <input name="supplierName" value={formData.supplierName} readOnly className="form-input-zinc-readonly font-bold text-emerald-600" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">GSTIN</label>
              <input name="gstin" value={formData.gstin} readOnly className="form-input-zinc-readonly" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1"><CreditCard size={12}/> Mobile No</label>
              <input name="mobile" value={formData.mobile} readOnly className="form-input-zinc-readonly" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1"><Hash size={12}/> Bill No</label>
              <input name="billNo" value={formData.billNo} onChange={handleChange} placeholder="Optional" disabled={loading || !isAuthorized} className="form-input-zinc" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1"><Truck size={12}/> Vehicle No</label>
              <input name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} placeholder="BR-01-XXXX" disabled={loading || !isAuthorized} className="form-input-zinc" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1"><MapPin size={12}/> Address</label>
              <input name="address" value={formData.address} readOnly className="form-input-zinc-readonly" />
            </div>
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

            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-500 uppercase">Quantity (Kg/Unit)</label>
              <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required placeholder="0" disabled={loading || !isAuthorized} className="form-input-zinc bg-white dark:bg-zinc-900" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-500 uppercase">Rate (Per Unit)</label>
              <input type="number" name="rate" value={formData.rate} onChange={handleChange} required placeholder="0.00" disabled={loading || !isAuthorized} className="form-input-zinc bg-white dark:bg-zinc-900" />
            </div>

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

          {/* Section 3: Billing & Remarks */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Cash Discount (CD %)</label>
                  <input type="number" name="cashDiscount" value={formData.cashDiscount} onChange={handleChange} placeholder="0 %" disabled={loading || !isAuthorized} className="form-input-zinc" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Paid Amount (₹)</label>
                  <input type="number" name="paidAmount" value={formData.paidAmount} onChange={handleChange} placeholder="0" disabled={loading || !isAuthorized} className="form-input-zinc" />
                </div>
              </div>
              
              {/* 🆕 Improved Remarks Field */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                   <MessageSquare size={12} className="text-emerald-600"/> Remarks / Transaction Notes
                </label>
                <textarea 
                  name="remarks" 
                  value={formData.remarks} 
                  onChange={handleChange} 
                  placeholder="Yahan quality, payment details ya extra information likhein..." 
                  disabled={loading || !isAuthorized} 
                  rows="3"
                  className="form-input-zinc min-h-[100px] resize-none pt-3"
                />
              </div>
            </div>

            {/* Bill Summary Card */}
            <div className="bg-zinc-50 dark:bg-zinc-800/80 p-6 rounded-3xl border-2 border-zinc-100 dark:border-zinc-800 space-y-4 h-fit sticky top-6">
               <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4">Financial Summary</h3>
               <div className="flex justify-between items-center text-xs font-bold text-zinc-500 uppercase tracking-tighter">
                 <span>Final Bill Amount</span>
                 <span className="text-lg font-black text-zinc-900 dark:text-white">₹{formData.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
               </div>
               <div className="h-px bg-zinc-200 dark:bg-zinc-700 w-full" />
               <div className="flex justify-between items-center">
                 <span className="text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-widest">Balance Due</span>
                 <span className={`text-xl font-black ${formData.balanceAmount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>₹{formData.balanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
               </div>
               <p className="text-[9px] text-zinc-400 leading-relaxed italic">Calculated: (Qty * Rate) - CD + Traveling</p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t dark:border-zinc-800">
            <button type="button" onClick={onCancel} className="px-8 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all">Cancel</button>
            <button type="submit" disabled={loading || !isAuthorized} className="px-12 py-2.5 rounded-xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95">
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
      `}</style>
    </div>
  );
};

export default PurchaseForm;