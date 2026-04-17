import React from "react";
import { Layers, Plus, Minus, Tag } from "lucide-react";

/**
 * ProductSection Component (Updated Schema)
 * - uses 'freight' instead of 'travelingCost'
 * - uses 'productId' and 'productName' from props
 */
const ProductSection = ({ 
  formData, 
  products, 
  loading, 
  isAuthorized, 
  setFormData, 
  handleChange, 
  travelMode, 
  setTravelMode 
}) => {

  // 1. Custom Change Handler: Dropdown se ID select hogi
  const handleProductSelect = (e) => {
    const selectedId = e.target.value;
    const product = products.find((p) => p._id === selectedId);

    if (product) {
      setFormData((prev) => ({
        ...prev,
        productId: product._id,
        productName: product.name,
        hsn: product.hsnCode || "",
        unit: product.unit || "KG",
        rate: product.purchasePrice || prev.rate // Master se purchase price uthayega
      }));
    } else {
      setFormData((prev) => ({ 
        ...prev, 
        productId: "", 
        productName: "",
        hsn: "",
        unit: "KG"
      }));
    }
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      
      {/* 📦 Product Name Dropdown (productId sync) */}
      <div className="space-y-1.5 text-left">
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-1">
          <Layers size={12} className="text-emerald-500" /> Select Product
        </label>
        <select 
          name="productId" 
          value={formData.productId} 
          onChange={handleProductSelect} 
          required 
          disabled={loading || !isAuthorized} 
          className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl p-3 text-xs font-bold outline-none focus:border-emerald-500 dark:text-white transition-all appearance-none"
        >
          <option value="">-- Choose From Master --</option>
          {products && products.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name} {p.hsnCode ? `[${p.hsnCode}]` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* 🔢 Quantity Field */}
      <div className="space-y-1.5 text-left">
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
          Quantity ({formData.unit || 'Units'})
        </label>
        <input 
          type="number" 
          name="quantity" 
          value={formData.quantity} 
          onChange={handleChange} 
          required 
          placeholder="0" 
          disabled={loading || !isAuthorized} 
          className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl p-3 text-xs font-bold outline-none focus:border-emerald-500 dark:text-white transition-all"
        />
      </div>

      {/* 💰 Rate Field */}
      <div className="space-y-1.5 text-left">
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
          Rate (₹ / {formData.unit || 'Unit'})
        </label>
        <input 
          type="number" 
          name="rate" 
          value={formData.rate} 
          onChange={handleChange} 
          required 
          placeholder="0.00" 
          disabled={loading || !isAuthorized} 
          className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl p-3 text-xs font-black outline-none focus:border-emerald-500 dark:text-white transition-all" 
        />
      </div>

      {/* 🚚 Freight Section (Updated Field Name) */}
      <div className="space-y-1.5 text-left">
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">
          Freight Charges (₹)
        </label>
        <div className="flex gap-2">
          <button 
            type="button" 
            onClick={() => setTravelMode(prev => prev === "+" ? "-" : "+")} 
            disabled={loading || !isAuthorized} 
            className={`w-12 rounded-xl flex items-center justify-center font-bold text-white transition-all shadow-md ${
              travelMode === "+" ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'
            }`}
          >
            {travelMode === "+" ? <Plus size={16}/> : <Minus size={16}/>}
          </button>
          <input 
            type="number" 
            name="freight" // ✅ travelingCost se badal kar freight kar diya
            value={formData.freight} 
            onChange={handleChange} 
            placeholder="0" 
            disabled={loading || !isAuthorized} 
            className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl p-3 text-xs font-bold outline-none focus:border-emerald-500 dark:text-white transition-all" 
          />
        </div>
      </div>

      {/* ℹ️ Smart Preview (Auto-filled from master) */}
      {formData.productId && (
        <div className="md:col-span-4 mt-2 flex gap-4 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
                <Tag size={12} className="text-zinc-400"/>
                <span className="text-[10px] font-black text-zinc-500 uppercase">HSN:</span>
                <span className="text-[10px] font-mono font-bold dark:text-emerald-400">{formData.hsn}</span>
            </div>
            <div className="flex items-center gap-2 border-l border-zinc-200 dark:border-zinc-700 pl-4">
                <span className="text-[10px] font-black text-zinc-500 uppercase">Goods Value:</span>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                    ₹{(Number(formData.quantity) * Number(formData.rate)).toLocaleString()}
                </span>
            </div>
            <div className="flex items-center gap-2 border-l border-zinc-200 dark:border-zinc-700 pl-4">
                <span className="text-[10px] font-black text-zinc-500 uppercase">Selected:</span>
                <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 italic">
                  {formData.productName}
                </span>
            </div>
        </div>
      )}
    </div>
  );
};

export default ProductSection;