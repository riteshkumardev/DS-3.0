import React, { useState, useEffect, useCallback } from "react";
import { 
  Save, Calendar, Package, Weight, Layers, 
  ListChecks, Info, Search, PlusCircle, X, RefreshCw 
} from "lucide-react";
import { adjustStockManual } from "../../api/stockApi";
import { getAllProducts } from "../../api/productApi";
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";
import ProductMaster from "./ProductMaster"; // 👈 Path check karein

const StockAddForm = ({ user }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    productId: "", productName: "", category: "GRAINS",
    unit: "KG", quantity: "", weight: "", remarks: "", hsn: ""
  });

  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // 👈 Side Drawer State
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const fetchMasterProducts = useCallback(async () => {
    try {
      const res = await getAllProducts({ isActive: true });
      if (res.data?.success) setProductList(res.data.data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchMasterProducts(); }, [fetchMasterProducts]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "productId") {
      const selectedProd = productList.find(p => p._id === value);
      if (selectedProd) {
        setFormData(prev => ({ 
          ...prev, productId: value, productName: selectedProd.name,
          category: selectedProd.category, unit: selectedProd.unit, hsn: selectedProd.hsnCode
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await adjustStockManual({ ...formData, totalQuantity: Number(formData.weight), quantity: Number(formData.quantity), performedBy: user?._id });
      if (res.data.success) {
        setSnackbar({ open: true, message: `✅ ${formData.productName} Stock Updated!`, severity: "success" });
        setFormData({ ...formData, productId: "", productName: "", quantity: "", weight: "", hsn: "" });
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.message || "Sync Error", severity: "error" });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 font-sans relative overflow-hidden">
      {loading && <Loader />}
      
      <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="bg-zinc-900 dark:bg-emerald-600 p-6 text-white flex justify-between items-center rounded-t-[2.5rem]">
          <div className="flex items-center gap-3">
            <Package size={24} />
            <h2 className="text-xl font-black uppercase tracking-tight italic">Inventory Adjustment</h2>
          </div>
          {/* 🚀 SMART BUTTON: OPEN SIDE MASTER */}
          <button 
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
          >
            <PlusCircle size={14} /> Add New Product
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="form-label">Entry Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} required className="form-input-zinc" />
            </div>

            <div className="space-y-2">
              <label className="form-label flex justify-between">
                <span>Select Product</span>
                <RefreshCw size={12} className="cursor-pointer hover:rotate-180 transition-all text-emerald-500" onClick={fetchMasterProducts}/>
              </label>
              <select name="productId" value={formData.productId} onChange={handleChange} required className="form-input-zinc font-bold text-emerald-600">
                <option value="">-- Choose From Master --</option>
                {productList.map(prod => <option key={prod._id} value={prod._id}>{prod.name} ({prod.hsnCode})</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t dark:border-zinc-800 pt-8 text-left">
            <div className="space-y-2">
              <label className="form-label">Quantity ({formData.unit})</label>
              <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required className="form-input-zinc font-black text-lg" />
            </div>
            <div className="space-y-2">
              <label className="form-label">Total Weight (KG)</label>
              <input type="number" name="weight" value={formData.weight} onChange={handleChange} required className="form-input-zinc font-black text-lg" />
            </div>
          </div>

          {formData.productId && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 flex justify-between">
              <div><p className="text-[8px] font-black text-emerald-600 uppercase">HSN</p><p className="text-sm font-mono font-bold dark:text-emerald-400">{formData.hsn}</p></div>
              <div><p className="text-[8px] font-black text-emerald-600 uppercase">Category</p><p className="text-sm font-bold dark:text-emerald-400">{formData.category}</p></div>
              <div><p className="text-[8px] font-black text-emerald-600 uppercase">Unit</p><p className="text-sm font-bold dark:text-emerald-400">{formData.unit}</p></div>
            </div>
          )}

          <button type="submit" className="w-full py-5 bg-zinc-900 dark:bg-emerald-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl hover:scale-[1.01] transition-all flex items-center justify-center gap-3">
            <Save size={20}/> Update Master Stock
          </button>
        </form>
      </div>

      {/* 🟢 SIDE DRAWER (THE SMART PART) */}
      <div className={`fixed inset-y-0 right-0 z-[100] w-full md:w-[600px] bg-white dark:bg-zinc-950 shadow-[-20px_0_50px_rgba(0,0,0,0.2)] transform transition-transform duration-500 ease-in-out border-l border-zinc-200 dark:border-zinc-800 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="p-6 bg-zinc-900 text-white flex justify-between items-center">
            <h3 className="font-black uppercase italic tracking-tighter">Product Master Panel</h3>
            <button onClick={() => setIsDrawerOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={24}/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
             {/* 👈 CALLING PRODUCT MASTER IN SIDEBAR MODE */}
            <ProductMaster 
                isSidebarMode={true} 
                onProductCreated={() => { fetchMasterProducts(); setIsDrawerOpen(false); }} 
            />
          </div>
        </div>
      </div>
      
      {/* Background Overlay */}
      {isDrawerOpen && <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] transition-opacity" onClick={() => setIsDrawerOpen(false)}></div>}

      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />

      <style>{`
        .form-label { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #71717a; margin-left: 0.5rem; display: block; }
        .form-input-zinc { width: 100%; background: #f4f4f5; border: 2px solid transparent; border-radius: 1.25rem; padding: 1rem; font-size: 0.95rem; font-weight: 600; outline: none; transition: all 0.3s; }
        .dark .form-input-zinc { background: #18181b; color: white; }
        .form-input-zinc:focus { border-color: #10b981; background: white; }
        .dark .form-input-zinc:focus { background: #09090b; }
      `}</style>
    </div>
  );
};

export default StockAddForm;