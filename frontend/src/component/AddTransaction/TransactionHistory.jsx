import React, { useState, useEffect, useCallback } from 'react';
import { fetchParties } from '../../api/partyApi'; 
import { getPartyStatement } from '../../api/ledgerApi';

import { 
  BookOpen, Search, Printer, Calendar, ArrowUpRight, 
  ArrowDownLeft, ShieldCheck, Layers, Info 
} from "lucide-react";
import Loader from '../Core_Component/Loader/Loader';

const TransactionHistory = () => {
  const [parties, setParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ totalDr: 0, totalCr: 0, balance: 0 });

  const loadParties = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchParties(); 
      if (res.data?.success) setParties(res.data.data);
    } catch (err) { 
      console.error("Auth Error:", err.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadParties(); }, [loadParties]);

  const fetchLedger = useCallback(async (partyId = selectedParty) => {
    if (!partyId) return;
    try {
      setLoading(true);
      const res = await getPartyStatement(partyId, startDate, endDate);
      if (res.data?.success) {
        const rawData = res.data.data || [];
        const sortedData = [...rawData].sort((a, b) => new Date(a.date) - new Date(b.date)); // Oldest first for correct flow

        const totals = rawData.reduce((acc, curr) => {
          acc.dr += (curr.debit || 0);
          acc.cr += (curr.credit || 0);
          return acc;
        }, { dr: 0, cr: 0 });

        setHistory([...sortedData].reverse()); // Reverse for UI display (newest top)
        const latestEntry = rawData[rawData.length - 1];
        setSummary({ 
          totalDr: totals.dr, 
          totalCr: totals.cr, 
          balance: latestEntry?.runningBalance || 0 
        });
      }
    } catch (err) { console.error("Sync Error:", err); }
    finally { setLoading(false); }
  }, [selectedParty, startDate, endDate]);

  useEffect(() => {
    if (selectedParty) fetchLedger();
  }, [selectedParty, fetchLedger]);

  // ✅ FIXED PRINT FUNCTION
  const handlePrint = () => {
    const tableContent = document.getElementById("printable-area").innerHTML;
    const partyName = parties.find(p => p._id === selectedParty)?.name || "Party";
    
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    printWindow.document.write(`
      <html>
        <head>
          <title>Statement - ${partyName}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #111; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; font-size: 11px; text-align: left; }
            th { background-color: #f4f4f4; text-transform: uppercase; font-weight: bold; }
            .text-right { text-align: right; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .summary-box { display: flex; justify-content: space-between; margin-bottom: 20px; border: 1px solid #000; padding: 10px; }
            .reversal { opacity: 0.5; font-style: italic; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin:0">DHARA SHAKTI AGRO PRODUCTS</h1>
            <p style="margin:5px 0">Ledger Account: <strong>${partyName.toUpperCase()}</strong></p>
            <p style="font-size:10px">Period: ${startDate || 'Start'} to ${endDate || 'Today'}</p>
          </div>
          <div class="summary-box">
             <span>Total Debit: ₹${summary.totalDr.toLocaleString()}</span>
             <span>Total Credit: ₹${summary.totalCr.toLocaleString()}</span>
             <span>Closing Balance: ₹${Math.abs(summary.balance).toLocaleString()} ${summary.balance >= 0 ? 'Cr' : 'Dr'}</span>
          </div>
          ${tableContent}
          <div style="margin-top:50px; display:flex; justify-content:space-between; font-size:10px">
             <span>Prepared on: ${new Date().toLocaleString()}</span>
             <span>Authorized Signatory _________________</span>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    // Use timeout to ensure content is rendered before print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  if (loading && parties.length === 0) return <Loader />;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden no-print">
          <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <h2 className="text-2xl font-black text-zinc-800 dark:text-zinc-100 flex items-center gap-3 uppercase tracking-tighter">
                <BookOpen className="text-emerald-600" size={28} /> Account Statement
              </h2>
              
              <div className="w-full md:w-1/2 flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <select 
                      className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700 rounded-2xl outline-none focus:border-emerald-500 font-black text-zinc-700 dark:text-zinc-200 text-xs appearance-none cursor-pointer"
                      value={selectedParty}
                      onChange={(e) => setSelectedParty(e.target.value)}
                    >
                      <option value="">-- Select Party / Ledger --</option>
                      {parties.map(p => (
                        <option key={p._id} value={p._id}>{p.name.toUpperCase()} (Bal: ₹{p.currentBalance || 0})</option>
                      ))}
                    </select>
                </div>
                <button onClick={handlePrint} disabled={!selectedParty} className="p-4 bg-zinc-900 text-white rounded-2xl hover:bg-black transition-all shadow-lg disabled:opacity-50"><Printer size={20}/></button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 border-t dark:border-zinc-800 pt-6">
                <div className="grid grid-cols-2 gap-4 w-full lg:w-1/3">
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 text-xs font-bold" />
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700 text-xs font-bold" />
                </div>
                {selectedParty && (
                    <div className="flex-1 grid grid-cols-3 gap-4">
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100">
                            <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Received (Cr)</p>
                            <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">₹{summary.totalCr.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100">
                            <p className="text-[9px] font-black text-rose-600 uppercase mb-1">Bills/Paid (Dr)</p>
                            <p className="text-lg font-black text-rose-700 dark:text-rose-400">₹{summary.totalDr.toLocaleString()}</p>
                        </div>
                        <div className="p-4 bg-zinc-900 rounded-2xl">
                            <p className="text-[9px] text-zinc-400 font-black uppercase mb-1">Closing</p>
                            <p className={`text-lg font-black ${summary.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                ₹{Math.abs(summary.balance).toLocaleString()} {summary.balance >= 0 ? 'Cr' : 'Dr'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>

        {selectedParty ? (
          <div id="printable-area" className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] border-b dark:border-zinc-800">
                      <th className="px-8 py-6">Date / Type</th>
                      <th className="px-8 py-6">Particulars</th>
                      <th className="px-8 py-6 text-right">Debit (Dr)</th>
                      <th className="px-8 py-6 text-right">Credit (Cr)</th>
                      <th className="px-8 py-6 text-right bg-zinc-100/30">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800 text-[11px]">
                    {history.map((item) => (
                      <tr key={item._id} className={`hover:bg-zinc-50/50 transition-colors ${item.type === 'REVERSAL' ? 'reversal grayscale opacity-50' : ''}`}>
                        <td className="px-8 py-5">
                            <p className="font-black text-zinc-800 dark:text-zinc-200">
                                {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                            <span className="text-[8px] font-black px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 uppercase">{item.type}</span>
                        </td>
                        <td className="px-8 py-5">
                            <p className="font-bold text-zinc-700 dark:text-zinc-300 uppercase leading-tight">{item.description}</p>
                            <span className="text-[9px] text-zinc-400 font-bold tracking-widest">{item.paymentMode}</span>
                        </td>
                        <td className="px-8 py-5 text-right font-black text-rose-500">
                            {item.debit > 0 ? `₹${item.debit.toLocaleString()}` : '—'}
                        </td>
                        <td className="px-8 py-5 text-right font-black text-emerald-600">
                            {item.credit > 0 ? `₹${item.credit.toLocaleString()}` : '—'}
                        </td>
                        <td className="px-8 py-5 text-right font-black bg-zinc-50/30">
                            ₹{Math.abs(item.runningBalance).toLocaleString()} 
                            <span className="ml-1 text-[8px] opacity-40 uppercase">{item.runningBalance >= 0 ? 'Cr' : 'Dr'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-32 border-4 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[3rem] opacity-30">
              <Layers size={64} className="mb-6 text-zinc-300" />
              <p className="text-lg font-black text-zinc-400 uppercase tracking-widest italic text-center">Select party to sync ledger</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;