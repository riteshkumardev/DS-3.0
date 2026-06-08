import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, FileText, Plus, ArrowLeft, Printer, 
  Wallet, CreditCard, AlertCircle, CheckCircle2, X 
} from "lucide-react";
import EWayBillContainer from "../EWayBill/EWayBillContainer";
import { getAllSales } from "../../api/saleApi";
import Loader from "../Core_Component/Loader/Loader";

const InvoicePage = () => {
  const navigate = useNavigate();
  
  const [allSales, setAllSales] = useState([]); 
  const [searchTerm, setSearchTerm] = useState(""); 
  const [showPreview, setShowPreview] = useState(false);
  const [ewayData, setEwayData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSales = async () => {
      try {
        setLoading(true); 
        const res = await getAllSales(); 
        if (res.data?.success) {
          setAllSales(res.data.data || []);
        }
      } catch (err) {
        console.error("Sales load error inside ledger container:", err);
      } finally {
        setLoading(false);
      }
    };
    loadSales();
  }, []);

  const customerHistory = useMemo(() => {
    if (!allSales || allSales.length === 0) return [];
    
    let filtered = [...allSales];

    if (searchTerm.trim() !== "") {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(s => {
        const nameMatch = s.customerName ? String(s.customerName).toLowerCase().includes(lowerSearch) : false;
        const billMatch = s.billNo ? String(s.billNo).toLowerCase().includes(lowerSearch) : false;
        return nameMatch || billMatch;
      });
    }

    // Sort by absolute date sequence (Latest on top)
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [searchTerm, allSales]);

  const handleSelectSale = (sale) => {
    // 🚀 CODE CORRECTION: PDF Print data me missing/negative fields ko yahan safe-guard kiya gaya hai
    const optimizedSale = {
      ...sale,
      // Agar backend se freight negative (-3000) aa raha hai toh uska sign fix karein display ke liye
      logistics: {
        ...sale.logistics,
        freight: sale.logistics?.freight ? Math.abs(Number(sale.logistics.freight)) : 0,
      }
    };
    setEwayData(optimizedSale); 
    setShowPreview(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 🚀 CALCULATION REFIX: Pure database mapping ke sath fallback calculations
  const totalInvoiced = useMemo(() => {
    return customerHistory.reduce((sum, s) => sum + (Number(s.grandTotal || s.subTotal || 0)), 0);
  }, [customerHistory]);

  const totalReceived = useMemo(() => {
    return customerHistory.reduce((sum, s) => sum + (Number(s.amountPaid || 0)), 0);
  }, [customerHistory]);

  const totalPending = useMemo(() => {
    // Agar absolute value outstanding tracking karni hai
    return totalInvoiced - totalReceived;
  }, [totalInvoiced, totalReceived]);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-zinc-950 p-3 md:p-8 font-sans transition-colors duration-300">
      
      {/* --- HEADER --- */}
      <div className="no-print max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-600/20">
              <FileText size={24} />
            </div>
            Billing Ledger
          </h2>
          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-2 ml-1">Manage receivables & invoice history</p>
        </div>
        <button 
          onClick={() => navigate("/sales-entry")} 
          className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/30 transition-all active:scale-95 transform"
        >
          <Plus size={18} strokeWidth={3} /> New Billing Entry
        </button>
      </div>

      {!showPreview ? (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
          
          {/* --- SEARCH & FILTERS --- */}
          <div className="no-print sticky top-4 z-30">
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-4 rounded-3xl shadow-2xl border border-white dark:border-zinc-800 transition-all">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="Search by Customer Name or Bill No..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all text-zinc-800 dark:text-white"
                />
                {searchTerm && (
                   <button onClick={() => setSearchTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-red-500">
                     <X size={18}/>
                   </button>
                )}
              </div>
            </div>
          </div>

          {/* --- SUMMARY STATS --- */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            <StatCard label="Total Billing" value={totalInvoiced} color="zinc" icon={<Wallet size={20}/>} />
            <StatCard label="Total Collected" value={totalReceived} color="emerald" icon={<CheckCircle2 size={20}/>} />
            <StatCard label="Outstanding" value={totalPending} color="red" icon={<AlertCircle size={20}/>} />
          </div>

          {/* --- TABLE SECTION --- */}
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-zinc-100 dark:border-zinc-800">
                    <th className="px-6 py-5">Date / Bill No</th>
                    <th className="px-6 py-5">Party Details</th>
                    <th className="px-6 py-5">Product Info</th>
                    <th className="px-6 py-5 text-right">Bill Value</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                  {customerHistory.length > 0 ? (
                    customerHistory.map((s) => {
                      const cleanDate = s.date ? String(s.date).split('T')[0] : '—';
                      
                      // 🚀 REFIX: Safe extraction dropdown fallback product name mapping
                      const aggregatedProdNames = s.goods && s.goods.length > 0 
                        ? s.goods.map(g => g.productName || g.product || "Broken Rice").join(", ") 
                        : "BROKEN RICE";

                      const billValue = Number(s.grandTotal || s.subTotal || 0);
                      const receivedValue = Number(s.amountPaid || 0);
                      const isCleared = (billValue - receivedValue) <= 0;

                      return (
                        <tr key={s._id} className="hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-all group cursor-default text-xs font-bold">
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <span className="text-[11px] font-bold text-zinc-400">
                                {cleanDate !== '—' ? new Date(cleanDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                              </span>
                              <span className="text-sm font-black text-zinc-900 dark:text-white tracking-tight mt-0.5">#{s.billNo}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-tighter italic">{s.customerName || 'UNKNOWN PARTY'}</span>
                              <span className="text-[10px] text-zinc-400 font-bold mt-0.5">{s.partyId?.phone || s.phone || 'NO PHONE'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-[10px] font-black text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 max-w-[200px] truncate block uppercase tracking-wide">
                              {aggregatedProdNames}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <span className="text-sm font-black text-zinc-900 dark:text-white tracking-tighter">₹{billValue.toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-5">
                            {isCleared ? (
                              <StatusBadge type="paid" text="Cleared" />
                            ) : (
                              <StatusBadge type="due" text="Pending" />
                            )}
                          </td>
                          <td className="px-6 py-5 text-center">
                            <button 
                              onClick={() => handleSelectSale(s)}
                              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:text-white transition-all shadow-md active:scale-90"
                            >
                              <Printer size={14} strokeWidth={2.5} /> View
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-20 text-center">
                        <div className="flex flex-col items-center justify-center gap-3 opacity-60">
                          <Search size={48} className="text-zinc-300 dark:text-zinc-700" />
                          <p className="text-zinc-400 font-black uppercase text-[10px] tracking-widest">No matching records found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* --- ENHANCED PREVIEW VIEW --- */
        <div className="max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-300">
          <div className="no-print flex justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-3xl mb-6 shadow-xl border border-zinc-200 dark:border-zinc-800">
            <button 
              onClick={() => setShowPreview(false)} 
              className="group flex items-center gap-2 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Exit Preview
            </button>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Currently Viewing</span>
              <span className="text-sm font-black text-zinc-800 dark:text-white">Bill #{ewayData?.billNo}</span>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden ring-1 ring-zinc-200">
             {/* Yahan optimized data pass ho raha hai component ko */}
             <EWayBillContainer data={ewayData} />
          </div>

          <div className="no-print mt-8 text-center text-zinc-400 font-bold text-[10px] uppercase tracking-widest">
            Dhara Shakti Agro Products • Billing Management System
          </div>
        </div>
      )}
    </div>
  );
};

// Reusable Components
const StatCard = ({ label, value, color, icon }) => {
  const colors = {
    zinc: "border-zinc-400 dark:border-zinc-700 text-zinc-600 dark:bg-zinc-900",
    emerald: "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600",
    red: "border-red-500 bg-red-50/50 dark:bg-red-950/20 text-red-500"
  };

  return (
    <div className={`bg-white dark:bg-zinc-900 p-6 rounded-[2rem] shadow-xl border-l-8 flex items-center gap-5 transition-transform hover:-translate-y-1 ${colors[color]}`}>
      <div className={`p-3 rounded-2xl ${color === 'zinc' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500' : ''}`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 dark:text-zinc-400">{label}</p>
        <h4 className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-white mt-1">₹{value.toLocaleString()}</h4>
      </div>
    </div>
  );
};

const StatusBadge = ({ type, text }) => {
  const styles = type === 'paid' 
    ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50" 
    : "text-red-500 bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/50";
  
  return (
    <span className={`flex items-center gap-1.5 text-[9px] font-black uppercase px-3 py-1.5 rounded-full w-max border ${styles}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${type === 'paid' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
      {text}
    </span>
  );
};

export default InvoicePage;