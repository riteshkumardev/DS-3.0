import React from "react";

const SummaryCard = ({ totalAmount, balanceAmount }) => {
  return (
    <div className="bg-zinc-50 dark:bg-zinc-800/80 p-6 rounded-3xl border-2 border-zinc-100 dark:border-zinc-800 space-y-4 h-fit sticky top-6">
       <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4">Financial Summary</h3>
       <div className="flex justify-between items-center text-xs font-bold text-zinc-500 uppercase tracking-tighter">
         <span>Final Bill Amount</span>
         <span className="text-lg font-black text-zinc-900 dark:text-white">₹{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
       </div>
       <div className="h-px bg-zinc-200 dark:bg-zinc-700 w-full" />
       <div className="flex justify-between items-center">
         <span className="text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-widest">Balance Due</span>
         <span className={`text-xl font-black ${balanceAmount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>₹{balanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
       </div>
       <p className="text-[9px] text-zinc-400 leading-relaxed italic">Calculated: (Qty * Rate) - CD + Traveling</p>
    </div>
  );
};

export default SummaryCard;