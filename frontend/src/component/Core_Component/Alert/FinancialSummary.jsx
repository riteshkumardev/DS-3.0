import React, { useMemo } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldAlert, 
  CheckCircle2 
} from "lucide-react";

/* Helper to ensure numbers are safe */
const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const FinancialSummary = ({ salesList = [], purchaseList = [], expenses = 0, salaryData = [] }) => {
  
  const stats = useMemo(() => {
    // 1. Total Receivables (Lena Hai)
    const totalToReceive = salesList.reduce((sum, s) => 
      sum + safeNum(s.paymentDue || (safeNum(s.totalAmount) - safeNum(s.amountReceived))), 0);

    // 2. Total Payables (Dena Hai)
    const totalPurchasesDue = purchaseList.reduce((sum, p) => 
      sum + safeNum(p.balanceAmount || (safeNum(p.totalAmount) - safeNum(p.paidAmount))), 0);
    
    const totalSalaryPending = salaryData.reduce((sum, sal) => 
      sum + safeNum(sal.pendingAmount), 0);

    const totalPayable = totalPurchasesDue + safeNum(expenses) + totalSalaryPending;

    return {
      receive: totalToReceive,
      pay: totalPayable,
      net: totalToReceive - totalPayable
    };
  }, [salesList, purchaseList, expenses, salaryData]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
      
      {/* 📥 RECEIVABLES CARD */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] shadow-xl border border-zinc-100 dark:border-zinc-800 flex flex-col justify-between group hover:border-emerald-500/30 transition-all duration-300">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
            <TrendingUp size={24} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-lg">Assets</span>
        </div>
        <div>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Total Receivables</p>
          <h3 className="text-2xl font-black text-zinc-800 dark:text-white tracking-tighter">
            ₹{stats.receive.toLocaleString("en-IN")}
          </h3>
          <p className="text-[10px] font-bold text-zinc-400 italic mt-2 flex items-center gap-1">
             <ArrowDownLeft size={10} className="text-emerald-500"/> Pending Customer Payments
          </p>
        </div>
      </div>

      {/* 📤 PAYABLES CARD */}
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] shadow-xl border border-zinc-100 dark:border-zinc-800 flex flex-col justify-between group hover:border-rose-500/30 transition-all duration-300">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform">
            <TrendingDown size={24} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1 rounded-lg">Liabilities</span>
        </div>
        <div>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Total Payables</p>
          <h3 className="text-2xl font-black text-zinc-800 dark:text-white tracking-tighter">
            ₹{stats.pay.toLocaleString("en-IN")}
          </h3>
          <p className="text-[10px] font-bold text-zinc-400 italic mt-2 flex items-center gap-1">
             <ArrowUpRight size={10} className="text-rose-500"/> Suppliers, Salary & Misc
          </p>
        </div>
      </div>

      {/* ⚖️ NET BALANCE CARD */}
      <div className={`p-6 rounded-[2.5rem] shadow-2xl border-2 flex flex-col justify-between transform hover:scale-105 transition-all duration-300 ${
        stats.net >= 0 
        ? 'bg-emerald-600 border-emerald-500 text-white' 
        : 'bg-zinc-900 border-zinc-800 text-white'
      }`}>
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner">
            <Scale size={24} />
          </div>
          <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
            {stats.net >= 0 ? <CheckCircle2 size={10}/> : <ShieldAlert size={10}/>}
            {stats.net >= 0 ? 'Optimal' : 'Attention'}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-1">Net Pending Balance</p>
          <h3 className="text-3xl font-black tracking-tighter">
            ₹{stats.net.toLocaleString("en-IN")}
          </h3>
          <p className="text-[10px] font-bold uppercase tracking-widest mt-2 opacity-80">
            {stats.net >= 0 ? "🚀 Surplus Cashflow" : "⚠️ High Liquidity Risk"}
          </p>
        </div>
      </div>

    </div>
  );
};

export default FinancialSummary;