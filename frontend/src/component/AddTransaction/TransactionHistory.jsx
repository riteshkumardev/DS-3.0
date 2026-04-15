import React, { useState, useEffect, useCallback } from 'react';
// API Imports (Token handling ke liye direct instance use kar rahe hain)
import { fetchParties } from '../../api/partyApi'; 
import { getPartyStatement } from '../../api/ledgerApi';

import { 
  BookOpen, Search, User, IndianRupee, 
  ArrowUpRight, ArrowDownLeft, Calendar, 
  History, Info, Layers, ShieldCheck, Filter, Printer
} from "lucide-react";
import Loader from '../Core_Component/Loader/Loader';

const TransactionHistory = () => {
  const [parties, setParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ totalIn: 0, totalOut: 0, balance: 0 });

  // 1. Fetch Parties List (Using partyApi for Token Safety)
  const loadParties = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchParties(); 
      if (res.data?.success) {
        setParties(res.data.data);
      }
    } catch (err) { 
      console.error("Auth/Fetch Error:", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadParties();
  }, [loadParties]);

  // 2. Fetch Detailed Ledger Statement
  const fetchLedger = useCallback(async (partyId = selectedParty) => {
    if (!partyId) return;

    try {
      setLoading(true);
      // Backend controller 'getPartyStatement' ko call kar raha hai
      const res = await getPartyStatement(partyId, startDate, endDate);
      
      if (res.data?.success) {
        const rawData = res.data.data || [];
        
        // Sorting: Newest transactions first for UI
        const sortedData = [...rawData].sort((a, b) => new Date(b.date) - new Date(a.date));

        // Credit (IN) vs Debit (OUT) Calculation
        const totals = rawData.reduce((acc, curr) => {
          if (curr.type === 'PAYMENT_IN') acc.in += curr.amount;
          else if (curr.type === 'PAYMENT_OUT') acc.out += curr.amount;
          return acc;
        }, { in: 0, out: 0 });

        setHistory(sortedData);
        // Latest running balance from the most recent record in original array
        const latestRecord = rawData[rawData.length - 1];
        setSummary({ 
          totalIn: totals.in, 
          totalOut: totals.out, 
          balance: latestRecord?.runningBalance || 0 
        });
      }
    } catch (err) { 
      console.error("Statement sync error:", err); 
    } finally {
      setLoading(false);
    }
  }, [selectedParty, startDate, endDate]);

  useEffect(() => {
    if (selectedParty) fetchLedger();
  }, [selectedParty, fetchLedger]);

  const handlePrint = () => window.print();

  if (loading && parties.length === 0) return <Loader />;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* --- HEADER & SELECTION --- */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden no-print">
          <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h2 className="text-2xl font-black text-zinc-800 dark:text-zinc-100 flex items-center gap-3 uppercase tracking-tighter">
                  <div className="p-2.5 bg-zinc-900 text-white rounded-2xl shadow-lg">
                    <BookOpen size={24} />
                  </div>
                  Party Ledger Statement
                </h2>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mt-2 italic">Dharashakti Intelligence Node</p>
              </div>
              
              <div className="w-full md:w-1/2 flex gap-3">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                    <select 
                      className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700 rounded-2xl outline-none focus:border-emerald-500 transition-all font-black text-zinc-700 dark:text-zinc-200 text-xs appearance-none cursor-pointer"
                      value={selectedParty}
                      onChange={(e) => setSelectedParty(e.target.value)}
                    >
                      <option value="">-- Choose Party / Supplier --</option>
                      {parties.map(p => (
                        <option key={p._id} value={p._id}>{p.name.toUpperCase()} (Bal: ₹{p.currentBalance || 0})</option>
                      ))}
                    </select>
                </div>
                <button onClick={handlePrint} className="p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all shadow-lg">
                    <Printer size={20} />
                </button>
              </div>
            </div>

            {/* --- FILTERS & SUMMARY --- */}
            <div className="flex flex-col lg:flex-row gap-6 items-end border-t dark:border-zinc-800 pt-6">
                <div className="grid grid-cols-2 gap-4 w-full lg:w-1/3">
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-zinc-400 ml-1">Statement From</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-2 border-zinc-100 dark:border-zinc-700 text-xs font-bold focus:border-emerald-500 outline-none" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-zinc-400 ml-1">Statement To</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border-2 border-zinc-100 dark:border-zinc-700 text-xs font-bold focus:border-emerald-500 outline-none" />
                    </div>
                </div>

                {selectedParty && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 w-full animate-in fade-in zoom-in duration-500">
                        <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                            <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest mb-1">Total Credit (IN)</p>
                            <p className="text-xl font-black text-emerald-700 dark:text-emerald-400">₹{summary.totalIn.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30">
                            <p className="text-[9px] text-rose-600 font-black uppercase tracking-widest mb-1">Total Debit (OUT)</p>
                            <p className="text-xl font-black text-rose-700 dark:text-rose-400">₹{summary.totalOut.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-700 shadow-xl shadow-zinc-900/20">
                            <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest mb-1">Closing Net Balance</p>
                            <p className={`text-xl font-black ${summary.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                ₹{Math.abs(summary.balance).toLocaleString('en-IN')} {summary.balance >= 0 ? 'Cr' : 'Dr'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>

        {/* --- TRANSACTIONS TABLE --- */}
        {selectedParty ? (
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {loading ? (
              <div className="p-20 text-center flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-zinc-400 font-black uppercase text-[10px] tracking-widest animate-pulse">Synchronizing Ledger...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] border-b dark:border-zinc-800">
                      <th className="px-8 py-6">Date / Timestamp</th>
                      <th className="px-8 py-6">Transaction Description</th>
                      <th className="px-8 py-6 text-right">Credit (Cr)</th>
                      <th className="px-8 py-6 text-right">Debit (Dr)</th>
                      <th className="px-8 py-6 text-right bg-zinc-50/50 dark:bg-zinc-800/20">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                    {history.length > 0 ? history.map((item) => (
                      <tr key={item._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-zinc-800 dark:text-zinc-200">
                                {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">
                                {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                             <div className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 ${item.type === 'PAYMENT_IN' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                                {item.type === 'PAYMENT_IN' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                             </div>
                             <div>
                                <p className="text-xs font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-tight italic">{item.description || "Agro Business Voucher"}</p>
                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{item.paymentMode || 'CASH'}</p>
                             </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span className={`text-sm font-black tracking-tighter ${item.type === 'PAYMENT_IN' ? 'text-emerald-600' : 'text-zinc-200 dark:text-zinc-800'}`}>
                            {item.type === 'PAYMENT_IN' ? `+₹${item.amount.toLocaleString()}` : '—'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span className={`text-sm font-black tracking-tighter ${item.type === 'PAYMENT_OUT' ? 'text-rose-600' : 'text-zinc-200 dark:text-zinc-800'}`}>
                            {item.type === 'PAYMENT_OUT' ? `-₹${item.amount.toLocaleString()}` : '—'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right bg-zinc-50/20 dark:bg-zinc-800/10">
                           <p className={`text-sm font-black tracking-tighter ${item.runningBalance >= 0 ? 'text-zinc-900 dark:text-zinc-100' : 'text-rose-500'}`}>
                             ₹{Math.abs(item.runningBalance).toLocaleString()}
                             <span className="text-[8px] ml-1 opacity-50 uppercase">{item.runningBalance >= 0 ? 'Cr' : 'Dr'}</span>
                           </p>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" className="p-20 text-center">
                           <Info size={40} className="mx-auto mb-4 opacity-20" />
                           <p className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">No matching records found for this period.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-32 border-4 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[3rem] opacity-30">
              <Layers size={64} className="mb-6 text-zinc-300" />
              <p className="text-lg font-black text-zinc-400 uppercase tracking-[0.2em] italic text-center">Select a party to view <br/> the STRATOS ledger statement</p>
          </div>
        )}
      </div>

      {/* --- PRINT STYLES --- */}
      <style>{`
        @media print {
            .no-print { display: none !important; }
            body { background: white !important; padding: 0 !important; }
            .max-w-7xl { max-width: 100% !important; margin: 0 !important; }
            .rounded-[2.5rem] { border-radius: 0 !important; box-shadow: none !important; border: none !important; }
            table { font-size: 10px !important; }
            th { color: black !important; border-bottom: 2px solid #000 !important; }
            td { border-bottom: 1px solid #eee !important; color: black !important; }
        }
      `}</style>
    </div>
  );
};

export default TransactionHistory;