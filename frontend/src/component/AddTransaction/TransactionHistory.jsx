import React, { useState, useEffect, useCallback } from 'react';
import { fetchParties } from '../../api/partyApi'; 
import { getPartyStatement } from '../../api/ledgerApi';

import { 
  BookOpen, Search, Printer, Calendar, ArrowUpRight, 
  ArrowDownLeft, ShieldCheck, Layers, Info, Package 
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
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { 
    loadParties(); 
  }, [loadParties]);

  const fetchLedger = useCallback(async (partyId = selectedParty) => {
    if (!partyId) return;
    try {
      setLoading(true); // 🚀 LOADER IS TRIGGERED IMMEDIATELY ON VALUE CHANGES
      const res = await getPartyStatement(partyId, startDate, endDate);
      if (res.data?.success) {
        const rawData = res.data.data || [];
        const sortedData = [...rawData].sort((a, b) => new Date(a.date) - new Date(b.date));

        const totals = rawData.reduce((acc, curr) => {
          acc.dr += (curr.debit || 0);
          acc.cr += (curr.credit || 0);
          return acc;
        }, { dr: 0, cr: 0 });

        setHistory([...sortedData].reverse()); 
        const latestEntry = rawData[rawData.length - 1];
        setSummary({ 
          totalDr: totals.dr, 
          totalCr: totals.cr, 
          balance: latestEntry?.runningBalance || 0 
        });
      }
    } catch (err) { 
      console.error("Sync Error:", err); 
    } finally { 
      setLoading(false); // 🚀 LOADER OFF ONLY AFTER CALCULATIONS SYNC
    }
  }, [selectedParty, startDate, endDate]);

  useEffect(() => {
    if (selectedParty) fetchLedger();
  }, [selectedParty, fetchLedger]);

  // Handle manual range reset button updates
  const handleRangeRefresh = () => {
    if (selectedParty) fetchLedger();
  };

  const handlePrint = () => {
    const partyName = parties.find(p => p._id === selectedParty)?.name || "Party";
    
    // 🚀 PRINT PIPELINE REFIX: Generate complete native rows including inner products cleanly
    let rowsHtml = "";
    history.forEach(item => {
      let goodsHtml = "";
      if (item.goods && item.goods.length > 0) {
        goodsHtml += `<div style="margin-top:5px; border:1px solid #eee; padding:5px; background:#fafafa;">
          <table style="margin:0; width:100%;">
            <tr style="background:#eee; font-weight:bold;">
              <td style="padding:3px;">Product</td>
              <td style="padding:3px;text-align:center;">Qty</td>
              <td style="padding:3px;text-align:right;">Rate</td>
            </tr>`;
        item.goods.forEach(g => {
          goodsHtml += `<tr>
            <td style="padding:3px;">${g.productName.toUpperCase()}</td>
            <td style="padding:3px;text-align:center;">${g.quantity} ${g.unit || ''}</td>
            <td style="padding:3px;text-align:right;">₹${g.rate}</td>
          </tr>`;
        });
        goodsHtml += `</table></div>`;
      }

      rowsHtml += `
        <tr class="${item.type === 'REVERSAL' ? 'grayscale' : ''}">
          <td>${new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}<br><small>${item.type}</small></td>
          <td><strong>${item.description.toUpperCase()}</strong><br><small>${item.paymentMode || ''}</small>${goodsHtml}</td>
          <td style="text-align:right;color:#ef4444;font-weight:bold;">${item.debit > 0 ? '₹' + item.debit.toLocaleString() : '—'}</td>
          <td style="text-align:right;color:#10b981;font-weight:bold;">${item.credit > 0 ? '₹' + item.credit.toLocaleString() : '—'}</td>
          <td style="text-align:right;font-weight:bold;">₹${Math.abs(item.runningBalance).toLocaleString()} ${item.runningBalance >= 0 ? 'Cr' : 'Dr'}</td>
        </tr>
      `;
    });

    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    printWindow.document.write(`
      <html>
        <head>
          <title>Statement - ${partyName}</title>
          <style>
            body { font-family: sans-serif; padding: 30px; color: #1c1917; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e7e5e4; padding: 10px; font-size: 11px; text-align: left; vertical-align: top; }
            th { background-color: #f5f5f4; text-transform: uppercase; font-weight: bold; font-size: 10px; }
            .header { text-align: center; border-bottom: 3px solid #10b981; padding-bottom: 15px; margin-bottom: 20px; }
            .summary-box { display: flex; justify-content: space-between; margin-bottom: 25px; border: 1px dashed #10b981; background:#f0fdf4; padding: 15px; font-size: 13px; font-weight: bold; border-radius:10px; }
            .grayscale { opacity: 0.4; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin:0;color:#059669;font-size:24px;font-weight:900;">DHARA SHAKTI AGRO PRODUCTS</h1>
            <p style="margin:5px 0;font-size:14px;">Ledger Statement: <strong>${partyName.toUpperCase()}</strong></p>
            <p style="font-size:11px;color:#666;">Period: ${startDate || 'Opening'} to ${endDate || 'Today'}</p>
          </div>
          <div class="summary-box">
             <span style="color:#dc2626;">Total Bills/Debit (Dr): ₹${summary.totalDr.toLocaleString()}</span>
             <span style="color:#059669;">Total Received/Credit (Cr): ₹${summary.totalCr.toLocaleString()}</span>
             <span>Closing Balance: ₹${Math.abs(summary.balance).toLocaleString()} ${summary.balance >= 0 ? 'Cr' : 'Dr'}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date / Type</th>
                <th>Particulars & Item Details</th>
                <th style="text-align:right;">Debit (Dr)</th>
                <th style="text-align:right;">Credit (Cr)</th>
                <th style="text-align:right;">Balance</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8 relative">
        
        {/* 🚀 SUB-LOADER ACTION BLOCK OVERLAY FOR STATEMENT RELOADING */}
        {loading && (
          <div className="fixed inset-0 bg-white/40 dark:bg-zinc-950/40 z-50 flex items-center justify-center backdrop-blur-sm transition-all duration-200">
            <Loader />
          </div>
        )}
        
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
                        <option key={p._id} value={p._id}>{p.name.toUpperCase()} (Bal: ₹{(p.currentBalance || 0).toLocaleString()})</option>
                      ))}
                    </select>
                </div>
                <button 
                  onClick={handlePrint} 
                  disabled={!selectedParty || history.length === 0} 
                  className="p-4 bg-zinc-900 text-white dark:bg-emerald-600 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-40"
                >
                  <Printer size={20}/>
                </button>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 border-t dark:border-zinc-800 pt-6">
                <div className="grid grid-cols-2 gap-4 w-full lg:w-1/3 items-center">
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-3 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-white rounded-xl border border-zinc-100 dark:border-zinc-700 text-xs font-bold outline-none focus:border-emerald-500" />
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-3 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-white rounded-xl border border-zinc-100 dark:border-zinc-700 text-xs font-bold outline-none focus:border-emerald-500" />
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
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] border-b dark:border-zinc-800">
                      <th className="px-8 py-6">Date / Type</th>
                      <th className="px-8 py-6">Particulars & Item Details</th>
                      <th className="px-8 py-6 text-right">Debit (Dr)</th>
                      <th className="px-8 py-6 text-right">Credit (Cr)</th>
                      <th className="px-8 py-6 text-right bg-zinc-100/10 dark:bg-zinc-800/30">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-[11px]">
                    {history.map((item) => (
                      <tr key={item._id} className={`hover:bg-zinc-50/40 dark:hover:bg-zinc-800/20 transition-colors ${item.type === 'REVERSAL' ? 'reversal grayscale opacity-40' : ''}`}>
                        <td className="px-8 py-5 align-top">
                            <p className="font-black text-zinc-800 dark:text-zinc-200">
                                {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                            <span className="text-[8px] font-black px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">{item.type}</span>
                        </td>
                        <td className="px-8 py-5">
                            <div className="mb-2">
                              <p className="font-bold text-zinc-700 dark:text-zinc-300 uppercase leading-tight">{item.description}</p>
                              <span className="text-[9px] text-zinc-400 font-bold tracking-widest uppercase">{item.paymentMode || 'INVOICE'}</span>
                            </div>

                            {/* ITEM DETAILS NESTED INSIDE ROW */}
                            {item.goods && item.goods.length > 0 && (
                              <div className="mt-3 overflow-hidden rounded-xl border border-zinc-100 dark:border-zinc-800 max-w-xl">
                                <table className="w-full text-[9px] text-zinc-500">
                                  <thead className="bg-zinc-50 dark:bg-zinc-800/40">
                                    <tr className="text-zinc-400 border-b dark:border-zinc-800">
                                      <th className="px-3 py-1.5 font-bold">PRODUCT</th>
                                      <th className="px-3 py-1.5 text-center font-bold">QTY</th>
                                      <th className="px-3 py-1.5 text-right font-bold">RATE</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                                    {item.goods.map((prod, idx) => (
                                      <tr key={idx} className="dark:text-zinc-400">
                                        <td className="px-3 py-1.5 font-black uppercase text-zinc-600 dark:text-zinc-300">{prod.productName}</td>
                                        <td className="px-3 py-1.5 text-center font-bold text-zinc-700 dark:text-zinc-400">{prod.quantity} {prod.unit || ''}</td>
                                        <td className="px-3 py-1.5 text-right font-bold">₹{(prod.rate || 0).toLocaleString()}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                        </td>
                        <td className="px-8 py-5 text-right font-black text-rose-500 align-top text-xs">
                            {item.debit > 0 ? `₹${item.debit.toLocaleString()}` : '—'}
                        </td>
                        <td className="px-8 py-5 text-right font-black text-emerald-600 align-top text-xs">
                            {item.credit > 0 ? `₹${item.credit.toLocaleString()}` : '—'}
                        </td>
                        <td className="px-8 py-5 text-right font-black bg-zinc-50/10 dark:bg-zinc-800/10 align-top text-xs">
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
          <div className="flex flex-col items-center justify-center p-32 border-4 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[3rem] opacity-40">
              <Layers size={64} className="mb-6 text-zinc-300 animate-pulse" />
              <p className="text-sm font-black text-zinc-400 uppercase tracking-widest text-center">Select party to sync ledger statement</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;