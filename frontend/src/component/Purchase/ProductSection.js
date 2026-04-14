import React from "react";
import { Layers, Plus, Minus } from "lucide-react";

const ProductSection = ({ formData, loading, isAuthorized, handleChange, travelMode, setTravelMode }) => {
  const productList = ["Corn", "Corn Greet", "Cattle Feed", "Aatarice", "Rice Greet", "Packing Bag", "Rice Broken"];

  return (
    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <div className="space-y-1">
        <label className="label-style"><Layers size={14}/> Product Name</label>
        <select name="productName" value={formData.productName} onChange={handleChange} required disabled={loading || !isAuthorized} className="form-input-zinc bg-white dark:bg-zinc-900">
          <option value="">-- Select Product --</option>
          {productList.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="space-y-1">
        <label className="label-style">Quantity (Kg/Unit)</label>
        <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required placeholder="0" disabled={loading || !isAuthorized} className="form-input-zinc bg-white dark:bg-zinc-900" />
      </div>

      <div className="space-y-1">
        <label className="label-style">Rate (Per Unit)</label>
        <input type="number" name="rate" value={formData.rate} onChange={handleChange} required placeholder="0.00" disabled={loading || !isAuthorized} className="form-input-zinc bg-white dark:bg-zinc-900" />
      </div>

      <div className="space-y-1">
        <label className="label-style">Traveling Cost (₹)</label>
        <div className="flex gap-1">
          <button type="button" onClick={() => setTravelMode(prev => prev === "+" ? "-" : "+")} disabled={loading || !isAuthorized} 
            className={`w-10 rounded-lg flex items-center justify-center font-bold text-white transition-all ${travelMode === "+" ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
            {travelMode === "+" ? <Plus size={14}/> : <Minus size={14}/>}
          </button>
          <input type="number" name="travelingCost" value={formData.travelingCost} onChange={handleChange} placeholder="0" disabled={loading || !isAuthorized} className="flex-1 form-input-zinc bg-white dark:bg-zinc-900" />
        </div>
      </div>
    </div>
  );
};

export default ProductSection;