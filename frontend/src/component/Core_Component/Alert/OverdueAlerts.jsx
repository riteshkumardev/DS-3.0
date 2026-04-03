import React, { useMemo, useState } from "react";
import { 
  AlertCircle, MessageCircle, ChevronDown, ChevronRight, Layers,
  Printer, ShoppingCart, User, Receipt, ArrowRight, ShieldAlert 
} from "lucide-react";

const OverdueAlerts = ({ salesData = [], purchaseData = [], daysLimit = 10, onViewDetails }) => {
  const [expandedParty, setExpandedParty] = useState(null);

  // 🚩 Sales Grouping Logic (Preserved)
  const salesGrouped = useMemo(() => {
    const today = new Date();
    const limitDate = new Date();
    limitDate.setDate(today.getDate() - daysLimit);
    const groups = {};

    salesData.forEach(s => {
      const due = Number(s.paymentDue || (Number(s.totalAmount) - Number(s.amountReceived || 0)));
      if (due > 0 && new Date(s.date) < limitDate) {
        if (!groups[s.customerName]) {
          groups[s.customerName] = { customerName: s.customerName, mobile: s.mobile, totalDue: 0, bills: [] };
        }
        groups[s.customerName].totalDue += due;
        groups[s.customerName].bills.push(s);
      }
    });
    return Object.values(groups).sort((a, b) => b.totalDue - a.totalDue);
  }, [salesData, daysLimit]);

  // 🚩 Purchase Grouping Logic (Preserved)
  const purchaseGrouped = useMemo(() => {
    const today = new Date();
    const limitDate = new Date();
    limitDate.setDate(today.getDate() - daysLimit);
    const groups = {};

    purchaseData.forEach(p => {
      const balance = Number(p.balanceAmount || 0);
      if (balance > 0 && new Date(p.date) < limitDate) {
        if (!groups[p.supplierName]) {
          groups[p.supplierName] = { supplierName: p.supplierName, totalBalance: 0, bills: [] };
        }
        groups[p.supplierName].totalBalance += balance;
        groups[p.supplierName].bills.push(p);
      }
    });
    return Object.values(groups);
  }, [purchaseData, daysLimit]);

  const handleViewClick = (e, bill, type) => {
    e.stopPropagation(); 
    onViewDetails(bill, type);
  };

  if (salesGrouped.length === 0 && purchaseGrouped.length === 0) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-8 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* --- SALES OVERDUE SECTION --- */}
        {salesGrouped.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="bg-rose-600 p-6 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <AlertCircle size={24} />
                <h4 className="text-lg font-black uppercase tracking-tighter">Receivables Alert</h4>
              </div>
              <span className="bg-white/20 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/30">
                {salesGrouped.length} Parties
              </span>
            </div>
            
            <div className="p-4 max-h-[500px] overflow-y-auto space-y-3">
              {salesGrouped.map(group => {
                const isExpanded = expandedParty === group.customerName;
                const billList = group.bills.map(b => b.billNo).join(", ");
                const waMessage = encodeURIComponent(
                  `Namaste ${group.customerName},\nDhara Shakti Agro se reminder hai ki aapke Total ${group.bills.length} bills (Nos: ${billList}) ka kul ₹${group.totalDue.toLocaleString()} pending hai. Kripya payment clear karein.`
                );

                return (
                  <div key={group.customerName} className={`rounded-2xl border transition-all duration-300 ${isExpanded ? 'bg-zinc-50 dark:bg-zinc-800/50 border-rose-200 dark:border-rose-900/30' : 'bg-white dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700'}`}>
                    <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedParty(isExpanded ? null : group.customerName)}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isExpanded ? 'bg-rose-100 text-rose-600' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500'}`}>
                           {isExpanded ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                        </div>
                        <div>
                          <p className="text-sm font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-tight">{group.customerName}</p>
                          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-0.5 italic">Overdue: ₹{group.totalDue.toLocaleString()}</p>
                        </div>
                      </div>
                      <a href={`https://wa.me/${group.mobile}?text=${waMessage}`} 
                        onClick={(e) => e.stopPropagation()} 
                        target="_blank" rel="noreferrer" 
                        className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95">
                        <MessageCircle size={18} />
                      </a>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-2 animate-in slide-in-from-top-2">
                        {group.bills.map(b => (
                          <div key={b._id} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm group">
                            <div className="flex items-center gap-2">
                               <Receipt size={14} className="text-zinc-400" />
                               <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                                 #{b.billNo} <span className="opacity-40">({b.date})</span> — <b className="text-zinc-900 dark:text-white">₹{Number(b.paymentDue || b.totalAmount).toLocaleString()}</b>
                               </span>
                            </div>
                            <button className="flex items-center gap-1 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-600 hover:text-white transition-all" onClick={(e) => handleViewClick(e, b, 'SALE')}>
                               <Printer size={12}/> Print
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- PURCHASE PAYABLES SECTION --- */}
        {purchaseGrouped.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="bg-amber-500 p-6 flex justify-between items-center text-white">
              <div className="flex items-center gap-3">
                <ShoppingCart size={24} />
                <h4 className="text-lg font-black uppercase tracking-tighter">Purchase Payables</h4>
              </div>
              <span className="bg-white/20 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/30">
                {purchaseGrouped.length} Suppliers
              </span>
            </div>
            
            <div className="p-4 max-h-[500px] overflow-y-auto space-y-3">
              {purchaseGrouped.map(group => {
                const isExpanded = expandedParty === group.supplierName;
                return (
                  <div key={group.supplierName} className={`rounded-2xl border transition-all duration-300 ${isExpanded ? 'bg-zinc-50 dark:bg-zinc-800/50 border-amber-200 dark:border-amber-900/30' : 'bg-white dark:bg-zinc-800 border-zinc-100 dark:border-zinc-700'}`}>
                    <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedParty(isExpanded ? null : group.supplierName)}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${isExpanded ? 'bg-amber-100 text-amber-600' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500'}`}>
                           {isExpanded ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                        </div>
                        <div>
                          <p className="text-sm font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-tight">{group.supplierName}</p>
                          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-0.5 italic">Total Payable: ₹{group.totalBalance.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-700 text-zinc-400 rounded-xl">
                        <ShieldAlert size={18} />
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-2 animate-in slide-in-from-top-2">
                        {group.bills.map(b => (
                          <div key={b._id} className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                            <div className="flex items-center gap-2">
                               <Layers size={14} className="text-zinc-400" />
                               <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                                 Inv #{b.billNo || 'N/A'} <span className="opacity-40">({b.date})</span> — <b className="text-zinc-900 dark:text-white">₹{Number(b.balanceAmount).toLocaleString()}</b>
                               </span>
                            </div>
                            <button className="flex items-center gap-1 px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-amber-600 hover:text-white transition-all" onClick={(e) => handleViewClick(e, b, 'PURCHASE')}>
                               <ArrowRight size={12}/> Detail
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 10px; }
        .dark ::-webkit-scrollbar-thumb { background: #27272a; }
      `}</style>
    </div>
  );
};

export default OverdueAlerts;