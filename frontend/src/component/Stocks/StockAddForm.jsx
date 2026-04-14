import React, { useState } from "react";
import { Save, Calendar, Package, Weight, Layers, ListChecks, Info } from "lucide-react";
import { adjustStockManual } from "../../api/stockApi";
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const StockAddForm = ({ user }) => {
  const role = user?.role?.toUpperCase();
  const isAuthorized = role === "ADMIN" || role === "ACCOUNTANT" || role === "MANAGER";

  const initialState = {
    date: new Date().toISOString().split("T")[0],
    productName: "",
    category: "GRAINS", // Default category matching Product model
    unit: "KG",         // Default unit matching Product model
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
    // Auto-set Category and Unit based on Product Selection
    if (name === "productName") {
        let cat = "GRAINS";
        let unt = "KG";
        if (value.includes("BAG")) { cat = "PACKAGING"; unt = "BAG"; }
        if (value === "CATTLE FEED") { cat = "OTHERS"; unt = "KG"; }
        
        setFormData(prev => ({ ...prev, [name]: value, category: cat, unit: unt }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthorized) {
      triggerMsg("Access Denied: Aapke paas permission nahi hai", "error");
      return;
    }

    if (!formData.productName) return triggerMsg("Kripya Product select karein", "error");
    if (!formData.weight || Number(formData.weight) <= 0) return triggerMsg("Valid Weight dalein", "error");

    setLoading(true);
    try {
      const payload = {
        productName: formData.productName.toUpperCase(),
        category: formData.category,
        unit: formData.unit,
        totalQuantity: Number(formData.weight),
        quantity: Number(formData.quantity) || 0,
        bagType: formData.bagType,
        bagCondition: formData.bagCondition,
        remarks: formData.remarks || "MANUAL STOCK UPDATE",
        date: formData.date,
        performedBy: user?._id 
      };

      const res = await adjustStockManual(payload);
      
      if (res.data.success) {
        triggerMsg("✅ Inventory updated successfully!", "success");
        setFormData(initialState);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Inventory sync failed: Product not found or Invalid Unit";
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
          <div className="p-2 bg-white/20 rounded-xl shadow-inner">
             <Package size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight italic">Inventory Control Master</h2>
            <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest opacity-80">Industrial Stock Update Panel</p>
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
              <select name="productName" value={formData.productName} onChange={handleChange} required className="form-input-zinc font-bold text-emerald-600">
                <option value="">Choose Item...</option>
                <optgroup label="Grain Products">
                  <option value="CORN">CORN</option>
                  <option value="CORN GRIT">CORN GRIT</option>
                  <option value="CORN GRIT (3MM)">CORN GRIT (3MM)</option>
                  <option value="CORN FLOUR">CORN FLOUR</option>
                  <option value="CATTLE FEED">CATTLE FEED</option>
                </optgroup>
                <optgroup label="Rice Products">
                  <option value="RICE">RICE</option>
                  <option value="RICE GRIT">RICE GRIT</option>
                  <option value="RICE FLOUR">RICE FLOUR</option>
                  <option value="RICE BROKEN">RICE BROKEN</option>
                </optgroup>
                <optgroup label="Packaging">
                  <option value="PACKING BAG">PACKING BAG</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* Conditional Options for Bags */}
          {(formData.productName.includes("BAG")) && (
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
              <label className="form-label"><ListChecks size={12}/> Unit Quantity (Bags/Units)</label>
              <input type="number" name="quantity" placeholder="No. of Bags" value={formData.quantity} onChange={handleChange} required className="form-input-zinc font-black text-emerald-600 text-lg shadow-inner" />
            </div>

            <div className="space-y-2">
              <label className="form-label"><Weight size={12}/> Total Net Weight (KG)</label>
              <input type="number" name="weight" placeholder="Total KG" value={formData.weight} onChange={handleChange} required className="form-input-zinc font-black text-emerald-600 text-lg shadow-inner" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="form-label"><Info size={12}/> Internal Audit Remarks</label>
            <textarea name="remarks" rows="2" value={formData.remarks} onChange={handleChange} placeholder="Reason for inventory adjustment..." className="form-input-zinc resize-none"></textarea>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full py-5 bg-zinc-900 dark:bg-emerald-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black dark:hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer group"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                SYNCING DATABASE...
              </span>
            ) : (
              <><Save size={20} className="group-hover:rotate-12 transition-transform"/> Update Inventory Now</>
            )}
          </button>
        </form>
      </div>

      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />

      <style>{`
        .form-label { display: flex; align-items: center; gap: 0.5rem; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: #71717a; margin-left: 0.5rem; }
        .form-input-zinc { width: 100%; background: #ffffff; border: 1.5px solid #e4e4e7; border-radius: 1.25rem; padding: 1rem 1.5rem; font-size: 0.95rem; font-weight: 600; outline: none; transition: all 0.3s; }
        .dark .form-input-zinc { background: #18181b; border-color: #27272a; color: #f4f4f5; }
        .form-input-zinc:focus { border-color: #10b981; box-shadow: 0 0 0 5px rgba(16, 185, 129, 0.1); }
      `}</style>
    </div>
  );
};

export default StockAddForm;