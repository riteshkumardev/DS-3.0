import React, { useState, useEffect, useCallback } from "react";
import { 
  Save, Package, ListChecks, PlusCircle, X, RefreshCw, Layers, ShoppingBag,
  Weight
} from "lucide-react";
import { adjustStockManual } from "../../api/stockApi";
import { getAllProducts } from "../../api/productApi";
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";
import ProductMaster from "./ProductMaster"; 

const StockAddForm = ({ user }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    productId: "", productName: "", category: "GRAINS",
    unit: "KG", quantity: "", weight: "", remarks: "", hsn: ""
  });

  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showMsg = (msg, type = "success") => setSnackbar({ open: true, message: msg, severity: type });

  const fetchMasterProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllProducts({ isActive: true });
      if (res.data?.success) setProductList(res.data.data);
    } catch (err) { showMsg("Product load nahi ho paye", "error"); }
    finally { setLoading(false); }
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
    if (!formData.productId) return showMsg("Kripya Product select karein", "warning");

    setLoading(true);
    try {
      const payload = {
        ...formData,
        totalQuantity: Number(formData.weight),
        quantity: Number(formData.quantity),
        performedBy: user?._id
      };
      const res = await adjustStockManual(payload);
      if (res.data.success) {
        showMsg(`✅ ${formData.productName} Master Stock Updated!`);
        setFormData(prev => ({ ...prev, productId: "", productName: "", quantity: "", weight: "", hsn: "" }));
      }
    } catch (error) {
      showMsg(error.response?.data?.message || "Adjustment Failed", "error");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 font-sans relative overflow-hidden text-left">
      {loading && <Loader />}
      
      <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Header */}
        <div className="bg-zinc-900 dark:bg-emerald-600 p-8 text-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl"><Package size={24} /></div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight italic">Manual Stock Inward</h2>
              <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">Adjust Master Inventory</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="bg-white/10 hover:bg-white text-white hover:text-emerald-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2"
          >
            <PlusCircle size={14} /> Add New Product
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="form-label">Adjustment Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} required className="form-input-zinc font-bold" />
            </div>

            <div className="space-y-2">
              <label className="form-label flex justify-between">
                <span>Select Product Master</span>
                <RefreshCw size={12} className="cursor-pointer hover:rotate-180 transition-all text-emerald-500" onClick={fetchMasterProducts}/>
              </label>
              <div className="relative">
                <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <select name="productId" value={formData.productId} onChange={handleChange} required className="form-input-zinc pl-12 font-black text-emerald-600 appearance-none cursor-pointer">
                  <option value="">-- Choose From Master --</option>
                  {productList.map(prod => <option key={prod._id} value={prod._id}>{prod.name.toUpperCase()} ({prod.hsnCode})</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-zinc-50 dark:bg-zinc-800/30 rounded-[2rem] border-2 border-dashed border-zinc-200 dark:border-zinc-700">
            <div className="space-y-2">
              <label className="form-label">Bags / Packets Count</label>
              <input type="number" name="quantity" placeholder="0" value={formData.quantity} onChange={handleChange} required className="form-input-zinc font-black text-2xl text-center" />
            </div>
            <div className="space-y-2">
              <label className="form-label">Net Weight ({formData.unit})</label>
              <div className="relative">
                <Weight className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                <input type="number" name="weight" placeholder="0.00" value={formData.weight} onChange={handleChange} required className="form-input-zinc pl-12 font-black text-2xl text-center" />
              </div>
            </div>
          </div>

          {formData.productId && (
            <div className="grid grid-cols-3 gap-4 p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
              <div className="text-center"><p className="text-[9px] font-black text-zinc-400 uppercase">HSN Code</p><p className="text-xs font-black text-emerald-600">{formData.hsn}</p></div>
              <div className="text-center border-x border-zinc-200 dark:border-zinc-800"><p className="text-[9px] font-black text-zinc-400 uppercase">Unit</p><p className="text-xs font-black text-emerald-600">{formData.unit}</p></div>
              <div className="text-center"><p className="text-[9px] font-black text-zinc-400 uppercase">Category</p><p className="text-xs font-black text-emerald-600">{formData.category}</p></div>
            </div>
          )}

          <div className="space-y-2">
            <label className="form-label">Adjustment Remarks</label>
            <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows="2" className="form-input-zinc resize-none italic" placeholder="Reason for manual adjustment (e.g. Opening Stock, Damaged, etc)"></textarea>
          </div>

          <button type="submit" disabled={loading} className="w-full py-5 bg-zinc-900 dark:bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl hover:shadow-emerald-500/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
            {loading ? <RefreshCw className="animate-spin" /> : <Save size={20}/>}
            Commit Stock Change
          </button>
        </form>
      </div>

      {/* 🟡 Side Drawer for Product Master */}
      <div className={`fixed inset-y-0 right-0 z-[100] w-full md:w-[600px] bg-white dark:bg-zinc-950 shadow-2xl transform transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] border-l dark:border-zinc-800 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="p-8 bg-zinc-900 text-white flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black uppercase italic tracking-tighter">Product Ecosystem</h3>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Create New Item In Master List</p>
            </div>
            <button onClick={() => setIsDrawerOpen(false)} className="p-3 hover:bg-white/10 rounded-full transition-all"><X size={24}/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <ProductMaster isSidebarMode={true} onProductCreated={() => { fetchMasterProducts(); setIsDrawerOpen(false); }} />
          </div>
        </div>
      </div>
      
      {isDrawerOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[90] transition-opacity duration-500" onClick={() => setIsDrawerOpen(false)}></div>}
      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />

      <style>{`
        .form-label { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #71717a; margin-left: 0.5rem; display: block; margin-bottom: 4px; }
        .form-input-zinc { width: 100%; background: #f8fafc; border: 2px solid #f1f5f9; border-radius: 1.25rem; padding: 1rem; font-size: 0.95rem; font-weight: 600; outline: none; transition: all 0.3s; color: #1e293b; }
        .dark .form-input-zinc { background: #18181b; color: white; border-color: #27272a; }
        .form-input-zinc:focus { border-color: #10b981; background: white; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.1); }
        .dark .form-input-zinc:focus { background: #09090b; }
      `}</style>
    </div>
  );
};

export default StockAddForm;