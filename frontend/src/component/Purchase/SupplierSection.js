import React from "react";
import { Calendar, User, CreditCard, Hash, Truck, MapPin, Fingerprint } from "lucide-react";

/**
 * SupplierSection Component (Updated Schema)
 * - uses 'date' instead of 'purchaseDate'
 * - uses 'partyId' instead of 'supplierId'
 * - uses 'customerName' instead of 'supplierName'
 */
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
        customerName: finalName, // ✅ supplierName -> customerName
        partyId: supplier._id,   // ✅ supplierId -> partyId
        gstin: supplier.gstin || "URD",
        mobile: supplier.phone || "N/A",
        address: supplier.address?.street || "N/A",
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        customerName: selectedName, 
        partyId: "", 
        gstin: "", 
        mobile: "", 
        address: "" 
      }));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      
      {/* 📅 Date Field - ✅ Synced with 'date' */}
      <div className="space-y-1.5 text-left">
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-1">
          <Calendar size={12} className="text-emerald-500"/> Transaction Date
        </label>
        <input 
          type="date" 
          name="date" 
          value={formData.date} 
          onChange={handleChange} 
          disabled={loading || !isAuthorized} 
          className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl p-3 text-xs font-bold outline-none focus:border-emerald-500 dark:text-white transition-all" 
        />
      </div>

      {/* 👤 Supplier Selection - ✅ Synced with 'customerName' */}
      <div className="space-y-1.5 text-left">
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-1">
          <User size={12} className="text-emerald-500"/> Select Supplier
        </label>
        <select 
          name="customerName" 
          value={suppliers.find(s => s.name === formData.customerName) ? formData.customerName : (formData.customerName ? "Local customer" : "")} 
          onChange={handleSupplierSelect} 
          required 
          disabled={loading || !isAuthorized} 
          className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl p-3 text-xs font-bold outline-none focus:border-emerald-500 dark:text-white transition-all appearance-none cursor-pointer"
        >
          <option value="">-- Choose Supplier --</option>
          {suppliers.map((s) => <option key={s._id} value={s.name}>{s.name.toUpperCase()}</option>)}
        </select>
      </div>

      {/* 🆔 Party ID (Read Only) - ✅ Synced with 'partyId' */}
      <div className="space-y-1.5 text-left">
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-1">
          <Fingerprint size={12} className="text-zinc-400"/> Party Reference ID
        </label>
        <input 
          name="partyId" 
          value={formData.partyId || "AUTO-GENERATED"} 
          readOnly 
          className="w-full bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl p-3 text-[10px] font-mono font-bold text-zinc-500 outline-none"
        />
      </div>

      {/* 🔢 Bill No - ✅ Synced with 'billNo' */}
      <div className="space-y-1.5 text-left">
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-1">
          <Hash size={12} className="text-emerald-500"/> Bill Number
        </label>
        <input 
          name="billNo" 
          value={formData.billNo} 
          onChange={handleChange} 
          placeholder="Optional (e.g. PUR-001)" 
          disabled={loading || !isAuthorized} 
          className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl p-3 text-xs font-bold outline-none focus:border-emerald-500 dark:text-white transition-all"
        />
      </div>

      {/* 🚛 Vehicle No */}
      <div className="space-y-1.5 text-left">
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-1">
          <Truck size={12} className="text-emerald-500"/> Vehicle Number
        </label>
        <input 
          name="vehicleNo" 
          value={formData.vehicleNo} 
          onChange={handleChange} 
          placeholder="BR-01-XXXX" 
          disabled={loading || !isAuthorized} 
          className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl p-3 text-xs font-bold outline-none focus:border-emerald-500 dark:text-white transition-all uppercase"
        />
      </div>

      {/* GSTIN (Read Only) */}
      <div className="space-y-1.5 text-left">
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">GST Number</label>
        <input 
          name="gstin" 
          value={formData.gstin} 
          readOnly 
          className="w-full bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl p-3 text-xs font-bold text-zinc-500 outline-none" 
        />
      </div>

      {/* Mobile No (Read Only) */}
      <div className="space-y-1.5 text-left">
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-1">
          <CreditCard size={12}/> Contact Mobile
        </label>
        <input 
          name="mobile" 
          value={formData.mobile} 
          readOnly 
          className="w-full bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl p-3 text-xs font-bold text-zinc-500 outline-none" 
        />
      </div>

      {/* 📍 Address (Read Only) */}
      <div className="space-y-1.5 text-left">
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-1">
          <MapPin size={12}/> Supplier Address
        </label>
        <input 
          name="address" 
          value={formData.address} 
          readOnly 
          className="w-full bg-zinc-50 dark:bg-zinc-800/50 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl p-3 text-xs font-bold text-zinc-500 outline-none" 
        />
      </div>
    </div>
  );
};

export default SupplierSection;