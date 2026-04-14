import React, { useState, useEffect } from "react";
import { Layers, Plus, Minus } from "lucide-react";
import API from "../../api/apiConfig"; // Product fetch karne ke liye

const ProductSection = ({ formData, loading, isAuthorized, setFormData, handleChange, travelMode, setTravelMode }) => {
  const [masterProducts, setMasterProducts] = useState([]);

  // 1. Fetch Products from Master
  useEffect(() => {
    const getProducts = async () => {
      try {
        const res = await API.get("/products"); // Aapka product route
        if (res.data?.success) setMasterProducts(res.data.data);
      } catch (err) {
        console.error("Products load fail", err);
      }
    };
    getProducts();
  }, []);

  // 2. Custom Change Handler to Sync ID and Name
  const handleProductSelect = (e) => {
    const selectedName = e.target.value;
    const product = masterProducts.find(p => p.name === selectedName);

    if (product) {
      setFormData(prev => ({
        ...prev,
        productName: product.name,
        productId: product._id // ✅ FIX: Backend validation pass karne ke liye
      }));
    } else {
      setFormData(prev => ({ ...prev, productName: selectedName, productId: "" }));
    }
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-800/50 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      
      {/* 📦 Product Name - Syncing with ID */}
      <div className="space-y-1">
        <label className="label-style"><Layers size={14}/> Product Name</label>
        <select 
          name="productName" 
          value={formData.productName} 
          onChange={handleProductSelect} 
          required 
          disabled={loading || !isAuthorized} 
          className="form-input-zinc bg-white dark:bg-zinc-900"
        >
          <option value="">-- Select Product --</option>
          {masterProducts.length > 0 ? (
            masterProducts.map(p => <option key={p._id} value={p.name}>{p.name}</option>)
          ) : (
            <option disabled>Loading products...</option>
          )}
        </select>
      </div>

      {/* 🔢 Quantity */}
      <div className="space-y-1">
        <label className="label-style">Quantity (Kg/Unit)</label>
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

      {/* 💰 Rate */}
      <div className="space-y-1">
        <label className="label-style">Rate (Per Unit)</label>
        <input 
          type="number" 
          name="rate" 
          value={formData.rate} 
          onChange={handleChange} 
          required 
          placeholder="0.00" 
          disabled={loading || !isAuthorized} 
          className="form-input-zinc bg-white dark:bg-zinc-900" 
        />
      </div>

      {/* 🚚 Traveling Cost */}
      <div className="space-y-1">
        <label className="label-style">Traveling Cost (₹)</label>
        <div className="flex gap-1">
          <button 
            type="button" 
            onClick={() => setTravelMode(prev => prev === "+" ? "-" : "+")} 
            disabled={loading || !isAuthorized} 
            className={`w-10 rounded-lg flex items-center justify-center font-bold text-white transition-all ${travelMode === "+" ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}
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