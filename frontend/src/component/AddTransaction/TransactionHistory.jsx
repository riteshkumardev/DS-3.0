import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BookOpen, Search, User, IndianRupee, 
  ArrowUpRight, ArrowDownLeft, Calendar, 
  History, Info, Layers, ShieldCheck 
} from "lucide-react";
import Loader from '../Core_Component/Loader/Loader';

const TransactionHistory = () => {
  const [parties, setParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ totalIn: 0, totalOut: 0, balance: 0 });

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // 1. Fetch Parties List on Load
  useEffect(() => {
    const fetchParties = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/suppliers/list`); 
        if (res.data && res.data.success) {
          setParties(res.data.data);
        }
      } catch (err) { 
        console.error("Error fetching parties:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchParties();
  }, [API_BASE_URL]);

  // 2. Fetch History and Calculate Summary
  const fetchHistory = async (partyId) => {
    if (!partyId) {
      setHistory([]);
      setSummary({ totalIn: 0, totalOut: 0, balance: 0 });
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/transactions/history/${partyId}`);
      const rawData = Array.isArray(res.data) ? res.data : (res.data.data || []);
      
      const sortedData = rawData.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      const totals = rawData.reduce((acc, curr) => {
        if (curr.type === 'IN') acc.in += curr.amount;
        else acc.out += curr.amount;
        return acc;
      }, { in: 0, out: 0 });

      setHistory(sortedData);
      setSummary({ 
        totalIn: totals.in, 
        totalOut: totals.out, 
        balance: rawData[0]?.remainingBalance || 0 
      });
    } catch (err) { 
      console.error("History fetch error:", err); 
    } finally {
      setLoading(false);
    }
  };

  if (loading && parties.length === 0) return <Loader />;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* --- HEADER & SELECTION --- */}
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h2 className="text-2xl font-black text-zinc-800 dark:text-zinc-100 flex items-center gap-3 uppercase tracking-tighter">
                  <div className="p-2.5 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
                    <BookOpen size={24} />
                  </div>
                  Party Ledger Statement
                </h2>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-2 ml-1">Comprehensive transaction audit logs</p>
              </div>
              
              <div className="w-full md:w-1/2 relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <select 
                  className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700 rounded-2xl outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all font-black text-zinc-700 dark:text-zinc-200 text-sm appearance-none cursor-pointer"
                  value={selectedParty}
                  onChange={(e) => {
                    setSelectedParty(e.target.value);
                    fetchHistory(e.target.value);
                  }}
                >
                  <option value="">-- Search Party / Supplier --</option>
                  {parties && parties.map(p => (
                    <option key={p._id} value={p._id}>{p.name.toUpperCase()} (ID: {p._id.slice(-6)})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* --- SUMMARY RIBBON --- */}
            {selectedParty && !loading && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 animate-in fade-in slide-in-from-top-4">
                <div className="bg-emerald-50 dark:bg-emerald-950/20 p-5 rounded-3xl border border-emerald-100 dark:border-emerald-900/30">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Total Received (IN)</p>
                    <ArrowDownLeft size={16} className="text-emerald-500" />
                  </div>
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tighter">₹{summary.totalIn.toLocaleString('en-IN')}</p>
                </div>

                <div className="bg-rose-50 dark:bg-rose-950/20 p-5 rounded-3xl border border-rose-100 dark:border-rose-900/30">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px] text-rose-600 font-black uppercase tracking-widest">Total Bill/Paid (OUT)</p>
                    <ArrowUpRight size={16} className="text-rose-500" />
                  </div>
                  <p className="text-2xl font-black text-rose-700 dark:text-rose-400 tracking-tighter">₹{summary.totalOut.toLocaleString('en-IN')}</p>
                </div>

                <div className="bg-zinc-900 dark:bg-zinc-800 p-5 rounded-3xl shadow-2xl border border-zinc-700 flex flex-col justify-center">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Closing Balance</p>
                    <ShieldCheck size={16} className="text-emerald-500" />
                  </div>
                  <p className="text-2xl font-black text-white tracking-tighter">₹{summary.balance.toLocaleString('en-IN')}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- TRANSACTIONS TABLE --- */}
        {selectedParty ? (
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {loading ? (
              <div className="p-20 text-center flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-zinc-400 font-black uppercase text-xs tracking-widest animate-pulse">Fetching Ledger Records...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] border-b dark:border-zinc-800">
                      <th className="px-8 py-5">Date</th>
                      <th className="px-8 py-5">Transaction Details</th>
                      <th className="px-8 py-5">Type / Nature</th>
                      <th className="px-8 py-5 text-right">Amount (₹)</th>
                      <th className="px-8 py-5 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                    {history.length > 0 ? history.map((item) => (
                      <tr key={item._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-all group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2 text-zinc-500 font-bold text-xs">
                             <Calendar size={14} className="text-emerald-500/50" />
                             {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="text-sm font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-tight italic">
                            {item.description || "Agro Business Transaction"}
                          </div>
                          {item.txnId && <span className="text-[10px] font-bold text-zinc-400">Ref: {item.txnId}</span>}
                        </td>
                        <td className="px-8 py-5">
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full w-max border ${
                            item.type === 'IN' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20' 
                            : 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${item.type === 'IN' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                                {item.type === 'IN' ? 'Credit / IN' : 'Debit / OUT'}
                            </span>
                          </div>
                        </td>
                        <td className={`px-8 py-5 text-right text-sm font-black tracking-tighter ${item.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {item.type === 'IN' ? '+' : '-'} ₹{item.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-8 py-5 text-right">
                           <span className="text-sm font-black text-zinc-900 dark:text-white tracking-tighter">
                             ₹{item.remainingBalance.toLocaleString('en-IN')}
                           </span>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" className="p-20 text-center">
                           <Info size={40} className="mx-auto text-zinc-200 mb-4" />
                           <p className="text-zinc-400 font-bold uppercase text-xs tracking-widest">No transaction history found for this party.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-20 mt-10 border-4 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[3rem] opacity-40 grayscale">
              <Layers size={64} className="text-zinc-300 mb-6" />
              <p className="text-lg font-black text-zinc-400 uppercase tracking-[0.2em] italic">Select a party to generate statement</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;