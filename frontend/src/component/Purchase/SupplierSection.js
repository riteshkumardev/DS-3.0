import React from "react";
import { Calendar, User, CreditCard, Hash, Truck, MapPin } from "lucide-react";

const SupplierSection = ({ formData, suppliers, loading, isAuthorized, setFormData, handleChange }) => {
  
  const handleSupplierSelect = (e) => {
    const selectedName = e.target.value;
    const supplier = suppliers.find((s) => s.name === selectedName);

    if (supplier) {
      let finalName = supplier.name;
      // Local Customer handling logic
      if (supplier.name === "Local customer") {
        const customName = prompt("कृपया लोकल कस्टमर का नाम दर्ज करें:");
        if (customName) finalName = customName;
      }

      setFormData(prev => ({
        ...prev,
        supplierName: finalName,
        supplierId: supplier._id, // Backend strictly ID mangta hai
        gstin: supplier.gstin || "URD",
        mobile: supplier.phone || "N/A",
        address: supplier.address?.street || "N/A",
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        supplierName: selectedName, 
        supplierId: "", 
        gstin: "", 
        mobile: "", 
        address: "" 
      }));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* 📅 Date Field - purchaseDate sync */}
      <div className="space-y-1">
        <label className="label-style"><Calendar size={12}/> Date</label>
        <input 
          type="date" 
          name="purchaseDate" 
          value={formData.purchaseDate} 
          onChange={handleChange} 
          disabled={loading || !isAuthorized} 
          className="w-full border rounded-lg p-2 text-xs" 
        />
      </div>

      {/* 👤 Supplier Selection */}
      <div className="space-y-1">
        <label className="label-style"><User size={12}/> Select Supplier</label>
        <select 
          name="supplierName" 
          value={formData.supplierName === "" ? "" : (suppliers.find(s => s.name === formData.supplierName) ? formData.supplierName : "Local customer")} 
          onChange={handleSupplierSelect} 
          required 
          disabled={loading || !isAuthorized} 
          className="w-full border rounded-lg p-2 text-xs"
        >
          <option value="">-- Choose Supplier --</option>
          {suppliers.map((s) => <option key={s._id} value={s.name}>{s.name}</option>)}
        </select>
      </div>

      {/* Supplier Name (Read Only) */}
      <div className="space-y-1">
        <label className="label-style">Supplier Name (Saved)</label>
        <input 
          name="supplierName" 
          value={formData.supplierName} 
          readOnly 
          className="w-full border rounded-lg p-2 text-xs"
        />
      </div>

      {/* GSTIN (Read Only) */}
      <div className="space-y-1">
        <label className="label-style">GSTIN</label>
        <input 
          name="gstin" 
          value={formData.gstin} 
          readOnly 
          className="w-full border rounded-lg p-2 text-xs" 
        />
      </div>

      {/* Mobile No (Read Only) */}
      <div className="space-y-1">
        <label className="label-style"><CreditCard size={12}/> Mobile No</label>
        <input 
          name="mobile" 
          value={formData.mobile} 
          readOnly 
          className="w-full border rounded-lg p-2 text-xs" 
        />
      </div>

      {/* 🔢 Bill No - purchaseBillNo sync */}
      <div className="space-y-1">
        <label className="label-style"><Hash size={12}/> Bill No</label>
        <input 
          name="purchaseBillNo" 
          value={formData.purchaseBillNo} 
          onChange={handleChange} 
          placeholder="Optional" 
          disabled={loading || !isAuthorized} 
         className="w-full border rounded-lg p-2 text-xs"
        />
      </div>

      {/* 🚛 Vehicle No */}
      <div className="space-y-1">
        <label className="label-style"><Truck size={12}/> Vehicle No</label>
        <input 
          name="vehicleNo" 
          value={formData.vehicleNo} 
          onChange={handleChange} 
          placeholder="BR-01-XXXX" 
          disabled={loading || !isAuthorized} 
         className="w-full border rounded-lg p-2 text-xs"
        />
      </div>

      {/* 📍 Address (Read Only) */}
      <div className="space-y-1">
        <label className="label-style"><MapPin size={12}/> Address</label>
        <input 
          name="address" 
          value={formData.address} 
          readOnly 
          className="w-full border rounded-lg p-2 text-xs" 
        />
      </div>
    </div>
  );
};

export default SupplierSection;