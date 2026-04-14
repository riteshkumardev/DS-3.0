import React from "react";
import { Calendar, User, CreditCard, Hash, Truck, MapPin } from "lucide-react";

const SupplierSection = ({ formData, suppliers, loading, isAuthorized, setFormData, handleChange }) => {
  
  const handleSupplierSelect = (e) => {
    const selectedName = e.target.value;
    const supplier = suppliers.find((s) => s.name === selectedName);

    if (supplier) {
      let finalName = supplier.name;
      if (supplier.name === "Local customer") {
        const customName = prompt("कृपया लोकल कस्टमर का नाम दर्ज करें:");
        if (customName) finalName = customName;
      }

      setFormData(prev => ({
        ...prev,
        supplierName: finalName,
        gstin: supplier.gstin || "N/A",
        mobile: supplier.phone || "N/A",
        address: supplier.address?.street || "N/A",
      }));
    } else {
      setFormData(prev => ({ ...prev, supplierName: selectedName, gstin: "", mobile: "", address: "" }));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <div className="space-y-1">
        <label className="label-style"><Calendar size={12}/> Date</label>
        <input type="date" name="date" value={formData.date} onChange={handleChange} disabled={loading || !isAuthorized} className="form-input-zinc" />
      </div>

      <div className="space-y-1">
        <label className="label-style"><User size={12}/> Select Supplier</label>
        <select name="supplierName" value={formData.supplierName === "" ? "" : (suppliers.find(s => s.name === formData.supplierName) ? formData.supplierName : "Local customer")} onChange={handleSupplierSelect} required disabled={loading || !isAuthorized} className="form-input-zinc">
          <option value="">-- Choose Supplier --</option>
          {suppliers.map((s) => <option key={s._id} value={s.name}>{s.name}</option>)}
        </select>
      </div>

      <div className="space-y-1">
        <label className="label-style">Supplier Name (Saved)</label>
        <input name="supplierName" value={formData.supplierName} readOnly className="form-input-zinc-readonly font-bold text-emerald-600" />
      </div>

      <div className="space-y-1">
        <label className="label-style">GSTIN</label>
        <input name="gstin" value={formData.gstin} readOnly className="form-input-zinc-readonly" />
      </div>

      <div className="space-y-1">
        <label className="label-style"><CreditCard size={12}/> Mobile No</label>
        <input name="mobile" value={formData.mobile} readOnly className="form-input-zinc-readonly" />
      </div>

      <div className="space-y-1">
        <label className="label-style"><Hash size={12}/> Bill No</label>
        <input name="billNo" value={formData.billNo} onChange={handleChange} placeholder="Optional" disabled={loading || !isAuthorized} className="form-input-zinc" />
      </div>

      <div className="space-y-1">
        <label className="label-style"><Truck size={12}/> Vehicle No</label>
        <input name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} placeholder="BR-01-XXXX" disabled={loading || !isAuthorized} className="form-input-zinc" />
      </div>

      <div className="space-y-1">
        <label className="label-style"><MapPin size={12}/> Address</label>
        <input name="address" value={formData.address} readOnly className="form-input-zinc-readonly" />
      </div>
    </div>
  );
};

export default SupplierSection;