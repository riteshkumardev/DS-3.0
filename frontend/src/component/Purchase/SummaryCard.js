import React from "react";
import { Receipt, Wallet, Info } from "lucide-react";

/**
 * SummaryCard Component (Updated Schema)
 * - uses 'Freight' in formula calculation note
 * - formatted for Indian Rupee (₹) standards
 */
const SummaryCard = ({ totalAmount, balanceAmount }) => {
  // ✅ Ensuring we always have a safe number for display
  const displayTotal = Number(totalAmount) || 0;
  const displayBalance = Number(balanceAmount) || 0;

  return (
    <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border-2 border-zinc-100 dark:border-zinc-800 space-y-6 h-fit sticky top-6 shadow-2xl transition-all hover:border-emerald-500/30">
        
        <div className="flex items-center gap-2 mb-2">
           <Receipt size={16} className="text-emerald-500" />
           <h3 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em]">
             Financial Summary
           </h3>
        </div>

        {/* 🧾 Grand Total Display */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Final Bill Amount</p>
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter">
              ₹{displayTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="h-px bg-zinc-100 dark:bg-zinc-800 w-full" />

        {/* 💸 Balance Due Display */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Balance Due</p>
          <div className="flex justify-between items-center">
            <span className={`text-2xl font-black tracking-tighter ${displayBalance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
              ₹{displayBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            {displayBalance > 0 ? (
              <div className="px-2 py-1 bg-rose-500/10 rounded-lg border border-rose-500/20">
                 <span className="text-[8px] font-black text-rose-500 uppercase tracking-tighter">Pending</span>
              </div>
            ) : (
              <div className="px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                 <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">Cleared</span>
              </div>
            )}
          </div>
        </div>

        {/* ℹ️ Formula Information (Updated for new schema) */}
        <div className="pt-4 border-t border-dashed border-zinc-200 dark:border-zinc-700">
            <div className="flex items-start gap-2">
              <Info size={12} className="text-zinc-400 mt-0.5" />
              <p className="text-[9px] text-zinc-400 leading-relaxed font-medium italic">
                Formula: (Qty × Rate) − CD% ± Freight Charges
              </p>
            </div>
            
            {displayBalance < 0 && (
              <div className="mt-3 p-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex items-center gap-2">
                <Wallet size={12} className="text-emerald-500" />
                <p className="text-[9px] text-emerald-500 font-black uppercase tracking-tighter">
                   Extra Amount Paid (Advance)
                </p>
              </div>
            )}
        </div>
    </div>
  );
};

export default SummaryCard;