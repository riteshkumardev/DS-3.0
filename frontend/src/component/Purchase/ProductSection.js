import React from "react";
import { Layers, Plus, Minus, Tag, Trash2, ShoppingBag } from "lucide-react";

const ProductSection = ({ 
  formData, 
  products, 
  loading, 
  isAuthorized, 
  setFormData, 
  travelMode, 
  setTravelMode 
}) => {

  // 1. Add New Row
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      goods: [...(prev.goods || []), { productId: "", productName: "", hsn: "", quantity: "", rate: "", unit: "KG" }]
    }));
  };

  // 2. Remove Row
  const removeItem = (index) => {
    const updatedGoods = formData.goods.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, goods: updatedGoods }));
  };

  // 3. Handle Item Changes (Dropdown selection & Numeric inputs)
  const handleItemChange = (index, field, value) => {
    const updatedGoods = [...formData.goods];
    
    if (field === "productId") {
      const product = products.find((p) => p._id === value);
      if (product) {
        updatedGoods[index] = {
          ...updatedGoods[index],
          productId: product._id,
          productName: product.name,
          hsn: product.hsnCode || "",
          unit: product.unit || "KG",
          rate: product.purchasePrice || "" // Auto-fill purchase price
        };
      }
    } else {
      updatedGoods[index][field] = value;
    }

    setFormData(prev => ({ ...prev, goods: updatedGoods }));
  };

  // 4. Handle Freight Change (Since it's global for the bill)
  const handleFreightChange = (e) => {
    setFormData(prev => ({ ...prev, freight: e.target.value }));
  };

  return (
    <div className="space-y-6">
      {/* Table Header Style Label */}
      <div className="flex justify-between items-center px-2">
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
          <ShoppingBag size={14} className="text-emerald-500" /> Itemized Goods Details
        </label>
        <span className="text-[9px] font-bold bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-zinc-500">
          Total Items: {formData.goods?.length || 0}
        </span>
      </div>

      {/* Dynamic Product Rows */}
      <div className="space-y-4">
        {formData.goods && formData.goods.map((item, index) => (
          <div key={index} className="group relative bg-white dark:bg-zinc-900/50 p-5 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-12 gap-4 items-end animate-in fade-in slide-in-from-left-2 transition-all hover:shadow-md">
            
            {/* 📦 Product Dropdown */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-[9px] font-black text-zinc-400 uppercase ml-1">Product {index + 1}</label>
              <select 
                value={item.productId} 
                onChange={(e) => handleItemChange(index, "productId", e.target.value)}
                disabled={loading || !isAuthorized}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-emerald-500 rounded-xl p-2.5 text-xs font-bold outline-none dark:text-white appearance-none cursor-pointer"
              >
                <option value="">-- Select Product --</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>{p.name.toUpperCase()} [{p.hsnCode}]</option>
                ))}
              </select>
            </div>

            {/* 🔢 Quantity */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[9px] font-black text-zinc-400 uppercase ml-1">Qty ({item.unit})</label>
              <input 
                type="number" 
                placeholder="0"
                value={item.quantity} 
                onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-emerald-500 rounded-xl p-2.5 text-xs font-black text-center outline-none dark:text-white"
              />
            </div>

            {/* 💰 Rate */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[9px] font-black text-zinc-400 uppercase ml-1">Rate (₹)</label>
              <input 
                type="number" 
                placeholder="0.00"
                value={item.rate} 
                onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-emerald-500 rounded-xl p-2.5 text-xs font-black text-center outline-none dark:text-white"
              />
            </div>

            {/* 📈 Row Total (Read Only) */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-[9px] font-black text-zinc-400 uppercase ml-1 text-right block">Amount</label>
              <div className="w-full bg-emerald-50/50 dark:bg-emerald-900/10 border-2 border-transparent rounded-xl p-2.5 text-xs font-black text-right text-emerald-600 dark:text-emerald-400">
                ₹{(Number(item.quantity || 0) * Number(item.rate || 0)).toLocaleString()}
              </div>
            </div>

            {/* 🗑️ Delete Action */}
            <div className="md:col-span-1 flex justify-center pb-1">
              {formData.goods.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => removeItem(index)}
                  className="p-2.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Actions: Add Button & Freight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2">
        <button 
          type="button" 
          onClick={addItem}
          disabled={loading || !isAuthorized}
          className="w-fit flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg"
        >
          <Plus size={16} /> Add Another Product
        </button>

        {/* Global Freight for the Entire Bill */}
        <div className="flex justify-end items-center gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 block text-right">Bill Freight (₹)</label>
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => setTravelMode(prev => prev === "+" ? "-" : "+")} 
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white transition-all ${
                  travelMode === "+" ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-500 shadow-rose-500/20'
                } shadow-lg`}
              >
                {travelMode === "+" ? <Plus size={16}/> : <Minus size={16}/>}
              </button>
              <input 
                type="number" 
                name="freight"
                value={formData.freight} 
                onChange={handleFreightChange} 
                placeholder="0" 
                className="w-32 bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl p-2 text-xs font-black outline-none focus:border-emerald-500 text-right" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSection;