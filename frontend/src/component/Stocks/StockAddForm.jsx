import React, { useState } from "react";
import { Save, Calendar, Package, Weight, Layers, ListChecks, Info } from "lucide-react";
import { adjustStockManual } from "../../api/stockApi";
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const StockAddForm = ({ user }) => {
  // 🛡️ Fix: Role check ko case-insensitive banaya
  const role = user?.role?.toUpperCase();
  const isAuthorized = role === "ADMIN" || role === "ACCOUNTANT" || role === "MANAGER";

  const initialState = {
    date: new Date().toISOString().split("T")[0],
    productName: "",
    bagType: "PP BAG",
    bagCondition: "NEW",
    quantity: "", 
    weight: "",   
    remarks: "",
  };

  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const triggerMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Auth Check
    if (!isAuthorized) {
      triggerMsg("Access Denied: Aapke paas permission nahi hai", "error");
      return;
    }

    // 2. Client Side Validation
    if (!formData.productName) return triggerMsg("Kripya Product select karein", "error");
    if (!formData.weight || Number(formData.weight) <= 0) return triggerMsg("Valid Weight dalein", "error");

    setLoading(true);
    try {
      const payload = {
        productName: formData.productName,
        totalQuantity: Number(formData.weight),
        quantity: Number(formData.quantity) || 0,
        bagType: formData.bagType,
        bagCondition: formData.bagCondition,
        remarks: formData.remarks || "Manual Stock Update",
        date: formData.date,
        performedBy: user?._id 
      };

      console.log("Sending Payload:", payload); // Debugging ke liye

      const res = await adjustStockManual(payload);
      
      if (res.data.success) {
        triggerMsg("✅ Inventory updated successfully!", "success");
        setFormData(initialState);
      }
    } catch (error) {
      console.error("Submission Error:", error);
      const errorMsg = error.response?.data?.message || "Server error: Update fail ho gaya";
      triggerMsg(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 font-sans text-left">
      {loading && <Loader />}
      
      <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        <div className="bg-emerald-600 p-6 text-white flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl">
             <Package size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Dhara Shakti Stock Control</h2>
            <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest italic">Manual Inventory Entry</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="form-label"><Calendar size={12}/> Entry Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} required className="form-input-zinc" />
            </div>

            <div className="space-y-2">
              <label className="form-label"><Layers size={12}/> Product Category</label>
              <select name="productName" value={formData.productName} onChange={handleChange} required className="form-input-zinc">
                <option value="">Choose Item...</option>
                <optgroup label="Grain Products">
                  <option value="CORN">Corn </option>
                  <option value="CORN GRIT">Corn Grit</option>
                  <option value="CORN GRIT 3MM">Corn Grit 3mm</option>
                  <option value="CORN FLOUR">Corn Flour </option>
                   <option value="CATTLE FEED">Cattle Feed </option>
                </optgroup>
                <optgroup label="Rice Products">
                  <option value="RICE">Rice </option>
                  <option value="RICE GRIT">Rice Grit </option>
                  <option value="RICE FLOUR">Rice Flour </option>
                </optgroup>
                <optgroup label="Industrial">
                  <option value="PACKING BAG">Packing Bag</option>
                  <option value="PACKING BAG JUTE">Packing Bag Jute</option>
                  <option value="PACKING BAG PLASTIC">Packing Bag Plastic</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* Conditional Options for Packing Bags */}
          {(formData.productName.includes("BAG") || formData.productName === "PACKING BAG") && (
            <div className="p-8 bg-zinc-50 dark:bg-zinc-800/30 rounded-[2rem] border-2 border-dashed border-emerald-500/20 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
               <div className="space-y-2">
                  <label className="form-label font-black text-emerald-600">Bag Material</label>
                  <select name="bagType" value={formData.bagType} onChange={handleChange} className="form-input-zinc bg-white dark:bg-zinc-900 border-emerald-200">
                    <option value="PP BAG">PP Plastic</option>
                    <option value="JUTE">Jute (पटुआ)</option>
                    <option value="HDPE">HDPE</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="form-label font-black text-emerald-600">Bag Condition</label>
                  <select name="bagCondition" value={formData.bagCondition} onChange={handleChange} className="form-input-zinc bg-white dark:bg-zinc-900 border-emerald-200">
                    <option value="NEW">Fresh New (नया)</option>
                    <option value="USED">Used (पुराना)</option>
                  </select>
               </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t dark:border-zinc-800 pt-8">
            <div className="space-y-2">
              <label className="form-label"><ListChecks size={12}/> Unit Quantity (Bags)</label>
              <input type="number" name="quantity" placeholder="No. of Bags" value={formData.quantity} onChange={handleChange} required className="form-input-zinc font-black text-emerald-600 text-lg" />
            </div>

            <div className="space-y-2">
              <label className="form-label"><Weight size={12}/> Total Weight (KG)</label>
              <input type="number" name="weight" placeholder="Total KG" value={formData.weight} onChange={handleChange} required className="form-input-zinc font-black text-emerald-600 text-lg" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="form-label"><Info size={12}/> Internal Note</label>
            <textarea name="remarks" rows="2" value={formData.remarks} onChange={handleChange} placeholder="Update reason..." className="form-input-zinc resize-none"></textarea>
          </div>

          {/* 🔘 FIXED BUTTON: Logic improved */}
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-5 bg-zinc-900 dark:bg-emerald-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-black dark:hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
          >
            {loading ? "SYNCING..." : <><Save size={20}/> Update Inventory Now</>}
          </button>
        </form>
      </div>

      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />

      <style>{`
        .form-label { display: flex; align-items: center; gap: 0.5rem; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: #71717a; margin-left: 0.5rem; }
        .form-input-zinc { width: 100%; background: #ffffff; border: 1.5px solid #e4e4e7; border-radius: 1.25rem; padding: 1rem 1.5rem; font-size: 0.95rem; font-weight: 600; outline: none; transition: all 0.3s; }
        .dark .form-input-zinc { background: #18181b; border-color: #27272a; color: #f4f4f5; }
        .form-input-zinc:focus { border-color: #10b981; box-shadow: 0 0 0 5px rgba(16, 185, 129, 0.1); }
      `}</style>
    </div>
  );
};

export default StockAddForm;