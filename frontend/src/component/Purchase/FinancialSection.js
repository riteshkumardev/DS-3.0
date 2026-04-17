import React from "react";
import { MessageSquare, Percent, Banknote, FileText } from "lucide-react";

/**
 * FinancialSection Component (Updated Schema)
 * - amountPaid aur cashDiscount ko handle karta hai
 * - remarks field updated
 */
const FinancialSection = ({ formData, loading, isAuthorized, handleChange }) => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 📉 Cash Discount (CD %) */}
        <div className="space-y-1.5 text-left">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-1">
            <Percent size={12} className="text-rose-500" /> Cash Discount (CD %)
          </label>
          <input 
            type="number" 
            name="cashDiscount" 
            value={formData.cashDiscount} 
            onChange={handleChange} 
            placeholder="0 %" 
            disabled={loading || !isAuthorized} 
            className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl p-3 text-xs font-bold outline-none focus:border-emerald-500 dark:text-white transition-all shadow-sm" 
          />
        </div>

        {/* 💰 Paid Amount (₹) */}
        <div className="space-y-1.5 text-left">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-1">
            <Banknote size={12} className="text-emerald-500" /> Paid Amount (₹)
          </label>
          <input 
            type="number" 
            name="amountPaid" 
            value={formData.amountPaid} 
            onChange={handleChange} 
            placeholder="0" 
            disabled={loading || !isAuthorized} 
            className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl p-3 text-xs font-black outline-none focus:border-emerald-500 dark:text-white transition-all shadow-sm" 
          />
        </div>
      </div>
      
      {/* 📝 Remarks / Transaction Notes */}
      <div className="space-y-2 text-left">
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-1">
           <MessageSquare size={12} className="text-zinc-500"/> Remarks & Internal Notes
        </label>
        <div className="relative">
          <textarea 
            name="remarks" 
            value={formData.remarks} 
            onChange={handleChange} 
            placeholder="Yahan quality, bank transfer details ya koi specific note likhein..." 
            disabled={loading || !isAuthorized} 
            rows="3"
            className="w-full bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 text-xs font-medium outline-none focus:border-emerald-500 dark:text-white transition-all resize-none shadow-sm"
          />
          <div className="absolute right-3 bottom-3 opacity-20 dark:opacity-10 pointer-events-none">
            <FileText size={40} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialSection;