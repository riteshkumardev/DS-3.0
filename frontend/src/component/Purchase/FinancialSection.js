import React from "react";
import { MessageSquare } from "lucide-react";

const FinancialSection = ({ formData, loading, isAuthorized, handleChange }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 📉 Cash Discount Section */}
        <div className="space-y-1">
          <label className="label-style">Cash Discount (CD %)</label>
          <input 
            type="number" 
            name="cashDiscount" 
            value={formData.cashDiscount} 
            onChange={handleChange} 
            placeholder="0 %" 
            disabled={loading || !isAuthorized} 
            className="w-full border rounded-lg p-2 text-xs" 
          />
        </div>

        {/* 💰 Paid Amount Section - Updated name to amountPaid */}
        <div className="space-y-1">
          <label className="label-style">Paid Amount (₹)</label>
          <input 
            type="number" 
            name="amountPaid" 
            value={formData.amountPaid} 
            onChange={handleChange} 
            placeholder="0" 
            disabled={loading || !isAuthorized} 
            className="w-full border rounded-lg p-2 text-xs" 
          />
        </div>
      </div>
      
      {/* 📝 Remarks / Transaction Notes */}
      <div className="space-y-2">
        <label className="label-style">
           <MessageSquare size={12} className="text-emerald-600"/> Remarks / Transaction Notes
        </label>
        <textarea 
          name="remarks" 
          value={formData.remarks} 
          onChange={handleChange} 
          placeholder="Yahan quality, payment details ya extra information likhein..." 
          disabled={loading || !isAuthorized} 
          rows="3"
          className="w-full border rounded-lg p-2 text-xs"
        />
      </div>
    </div>
  );
};

export default FinancialSection;