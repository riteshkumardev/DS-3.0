import React from "react";

const SummaryCard = ({ totalAmount, balanceAmount }) => {
  // ✅ Ensuring we always have a safe number for display
  const displayTotal = Number(totalAmount) || 0;
  const displayBalance = Number(balanceAmount) || 0;

  return (
    <div className="bg-zinc-50 dark:bg-zinc-800/80 p-6 rounded-3xl border-2 border-zinc-100 dark:border-zinc-800 space-y-4 h-fit sticky top-6 shadow-sm">
        <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4">
          Financial Summary
        </h3>

        {/* 🧾 Grand Total Display */}
        <div className="flex justify-between items-center text-xs font-bold text-zinc-500 uppercase tracking-tighter">
          <span>Final Bill Amount</span>
          <span className="text-lg font-black text-zinc-900 dark:text-white">
            ₹{displayTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="h-px bg-zinc-200 dark:bg-zinc-700 w-full" />

        {/* 💸 Balance Due Display */}
        <div className="flex justify-between items-center">
          <span className="text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-widest">
            Balance Due
          </span>
          <span className={`text-xl font-black ${displayBalance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
            ₹{displayBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* ℹ️ Formula Information */}
        <div className="pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-700">
           <p className="text-[9px] text-zinc-400 leading-relaxed italic">
             Calculated: (Qty × Rate) − Cash Discount ± Traveling Cost
           </p>
           {displayBalance < 0 && (
             <p className="text-[9px] text-emerald-500 font-bold mt-1 uppercase">
               * Extra Amount Paid (Advance)
             </p>
           )}
        </div>
    </div>
  );
};

export default SummaryCard;