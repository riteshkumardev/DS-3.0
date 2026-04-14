import React, { useState, useEffect } from "react";
import { Layers, Plus, Minus } from "lucide-react";
// ✅ Modular API import
import { getAllProducts } from "../../api/productApi";

const ProductSection = ({ formData, loading, isAuthorized, setFormData, handleChange, travelMode, setTravelMode }) => {
  const [masterProducts, setMasterProducts] = useState([]);

  // 1. Fetch Products using modular API
  useEffect(() => {
    const loadProducts = async () => {
      try {
        // Sirf wahi products mangaiye jo active hain dropdown ke liye
        const res = await getAllProducts({ isActive: true }); 
        if (res.data?.success) {
          setMasterProducts(res.data.data);
        }
      } catch (err) {
        console.error("Master products load karne mein fail:", err);
      }
    };
    loadProducts();
  }, []);

  // 2. Custom Change Handler: Name aur ID dono ko sync karega
  const handleProductSelect = (e) => {
    const selectedName = e.target.value;
    const product = masterProducts.find((p) => p.name === selectedName);

    if (product) {
      setFormData((prev) => ({
        ...prev,
        productName: product.name,
        productId: product._id, // ✅ Backend validation ke liye MongoDB ID
        // HSN Code aur Unit auto-fill logic (optional layout ke liye)
      }));
    } else {
      setFormData((prev) => ({ 
        ...prev, 
        productName: selectedName, 
        productId: "" 
      }));
    }
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      
      {/* 📦 Product Name Dropdown */}
      <div className="space-y-1">
        <label className="label-style">
          <Layers size={14} className="text-emerald-500" /> Product Name
        </label>
        <select 
          name="productName" 
          value={formData.productName} 
          onChange={handleProductSelect} 
          required 
          disabled={loading || !isAuthorized} 
          className="form-input-zinc bg-white dark:bg-zinc-900 font-bold"
        >
          <option value="">-- Choose Product --</option>
          {masterProducts.map((p) => (
            <option key={p._id} value={p.name}>
              {p.name} {p.hsnCode ? `(${p.hsnCode})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* 🔢 Quantity Field */}
      <div className="space-y-1">
        <label className="label-style">Quantity (Unit)</label>
        <input 
          type="number" 
          name="quantity" 
          value={formData.quantity} 
          onChange={handleChange} 
          required 
          placeholder="0" 
          disabled={loading || !isAuthorized} 
          className="form-input-zinc bg-white dark:bg-zinc-900" 
        />
      </div>

      {/* 💰 Rate Field */}
      <div className="space-y-1">
        <label className="label-style">Rate (Price/Unit)</label>
        <input 
          type="number" 
          name="rate" 
          value={formData.rate} 
          onChange={handleChange} 
          required 
          placeholder="0.00" 
          disabled={loading || !isAuthorized} 
          className="form-input-zinc bg-white dark:bg-zinc-900 font-medium" 
        />
      </div>

      {/* 🚚 Traveling Cost Section */}
      <div className="space-y-1">
        <label className="label-style">Traveling Cost (₹)</label>
        <div className="flex gap-1">
          <button 
            type="button" 
            onClick={() => setTravelMode(prev => prev === "+" ? "-" : "+")} 
            disabled={loading || !isAuthorized} 
            className={`w-10 rounded-lg flex items-center justify-center font-bold text-white transition-all shadow-sm ${
              travelMode === "+" ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {travelMode === "+" ? <Plus size={14}/> : <Minus size={14}/>}
          </button>
          <input 
            type="number" 
            name="travelingCost" 
            value={formData.travelingCost} 
            onChange={handleChange} 
            placeholder="0" 
            disabled={loading || !isAuthorized} 
            className="flex-1 form-input-zinc bg-white dark:bg-zinc-900" 
          />
        </div>
      </div>
    </div>
  );
};

export default ProductSection;