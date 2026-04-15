import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, User, Info, 
  ArrowUpRight, ArrowDownLeft, ShieldCheck, 
  Save, RotateCcw, Landmark, Search, CreditCard
} from "lucide-react";

// API Imports
import { postTransaction } from '../../api/ledgerApi';
import axios from 'axios';

import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const AddTransaction = () => {
  const API_BASE_URL = process.env.REACT_APP_API_URL || "https://dharashakti30backend.vercel.app";
  
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  
  const today = new Date().toISOString().split('T')[0];

  const initialForm = {
    partyId: '',
    amount: '',
    description: '',
    type: 'PAYMENT_IN', // Changed to match ledgerApi format
    paymentMode: 'CASH',
    date: today 
  };

  const [formData, setFormData] = useState(initialForm);

  // 1. Fetch all Parties (Customers/Suppliers)
  const fetchParties = useCallback(async () => {
    try {
      setLoading(true);
      // Fetching from your parties master endpoint
      const res = await axios.get(`${API_BASE_URL}/parties`); 
      if (res.data?.success) {
        setParties(res.data.data);
      }
    } catch (err) {
      console.error("Parties load error:", err);
      setSnackbar({ open: true, message: "पार्टी लिस्ट लोड नहीं हो पाई", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchParties();
  }, [fetchParties]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 2. Submit Transaction using ledgerApi
  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(formData.amount);
    
    if (!formData.partyId || amt <= 0) {
      setSnackbar({ open: true, message: "कृपया सही पार्टी और राशि भरें", severity: "warning" });
      return;
    }

    try {
      setLoading(true);
      // Using your new ledgerApi helper
      const response = await postTransaction({
        ...formData,
        amount: amt
      });

      if (response.data.success) {
        setSnackbar({ open: true, message: "ट्रांजैक्शन सफलतापूर्वक सिंक हो गया!", severity: "success" });
        setFormData(initialForm);
        fetchParties(); // Refresh balances
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "सिंकिंग विफल रही";
      setSnackbar({ open: true, message: errMsg, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Find selected party to show current balance
  const selectedPartyData = parties.find(p => p._id === formData.partyId);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 font-sans">
      {loading && <Loader />}
      
      <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all duration-300">
        
        {/* --- HEADER --- */}
        <div className="bg-zinc-900 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                <ShieldCheck size={24} className="text-emerald-500" />
            </div>
            <div>
                <h2 className="text-xl font-black uppercase tracking-tighter">Finance Hub</h2>
                <p className="text-[8px] font-bold text-zinc-500 tracking-[0.2em] uppercase">Voucher Entry System</p>
            </div>
          </div>
          <span className="text-[10px] font-black bg-emerald-600/10 text-emerald-500 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-500/20">Active</span>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* Quick Stats (Selected Party) */}
          {selectedPartyData && (
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 flex justify-between items-center animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-black text-zinc-500">{selectedPartyData.name[0]}</div>
                    <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase">Selected Party</p>
                        <p className="text-xs font-black text-zinc-800 dark:text-zinc-200 uppercase">{selectedPartyData.name}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-zinc-400 uppercase">Current Ledger Bal</p>
                    <p className={`text-sm font-black ${selectedPartyData.currentBalance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        ₹{Math.abs(selectedPartyData.currentBalance || 0).toLocaleString()} {selectedPartyData.currentBalance >= 0 ? 'Cr' : 'Dr'}
                    </p>
                </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar size={12}/> Date
              </label>
              <input 
                name="date"
                type="date"
                className="form-input-zinc"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Amount Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <Landmark size={12}/> Amount (₹)
              </label>
              <input 
                name="amount"
                type="number" 
                className="form-input-zinc font-black text-emerald-600 text-lg"
                placeholder="0.00"
                value={formData.amount}
                onChange={handleInputChange}
                required 
              />
            </div>
          </div>

          {/* Party Selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
              <User size={12}/> Select Customer / Supplier
            </label>
            <select 
              name="partyId"
              className="form-input-zinc font-bold cursor-pointer"
              value={formData.partyId}
              onChange={handleInputChange}
              required
            >
              <option value="">-- Choose Party --</option>
              {parties.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name.toUpperCase()} (Bal: ₹{p.currentBalance || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Transaction Type (Credit/Debit logic) */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Transaction Nature</label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={() => setFormData(prev => ({...prev, type: 'PAYMENT_IN'}))}
                className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-widest ${
                    formData.type === 'PAYMENT_IN' 
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-600 dark:bg-emerald-950/20 shadow-lg' 
                    : 'bg-zinc-50 border-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:border-zinc-700'
                }`}
              >
                <ArrowDownLeft size={20} />
                Payment In (Received)
              </button>
              <button 
                type="button"
                onClick={() => setFormData(prev => ({...prev, type: 'PAYMENT_OUT'}))}
                className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all font-black text-[10px] uppercase tracking-widest ${
                    formData.type === 'PAYMENT_OUT' 
                    ? 'bg-red-50 border-red-500 text-red-600 dark:bg-red-950/20 shadow-lg' 
                    : 'bg-zinc-50 border-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:border-zinc-700'
                }`}
              >
                <ArrowUpRight size={20} />
                Payment Out (Paid)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Payment Mode */}
             <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <CreditCard size={12}/> Mode
                </label>
                <select name="paymentMode" value={formData.paymentMode} onChange={handleInputChange} className="form-input-zinc font-bold">
                    <option value="CASH">CASH</option>
                    <option value="BANK">BANK / NEFT</option>
                    <option value="ONLINE">UPI / ONLINE</option>
                    <option value="CHEQUE">CHEQUE</option>
                </select>
             </div>
             {/* Description */}
             <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Info size={12}/> Description
                </label>
                <input 
                    name="description"
                    type="text" 
                    className="form-input-zinc"
                    placeholder="Ref or Remark..."
                    value={formData.description}
                    onChange={handleInputChange}
                />
             </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-4 pt-6 border-t dark:border-zinc-800">
            <button 
              type="submit" 
              disabled={loading}
              className="group relative flex items-center justify-center gap-3 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
            >
              <Save size={18} />
              {loading ? 'POSTING...' : 'SAVE TRANSACTION'}
            </button>
            <button 
                type="button"
                onClick={() => setFormData(initialForm)}
                className="flex items-center justify-center gap-2 py-2 text-zinc-400 hover:text-zinc-600 text-[10px] font-black uppercase tracking-widest transition-all"
            >
                <RotateCcw size={14} /> Clear Form
            </button>
          </div>
        </form>
      </div>

      <CustomSnackbar 
        open={snackbar.open} 
        message={snackbar.message} 
        severity={snackbar.severity} 
        onClose={() => setSnackbar({ ...snackbar, open: false })} 
      />

      <style>{`
        .form-input-zinc {
          width: 100%;
          background: #f4f4f5;
          border: 1px solid #e4e4e7;
          border-radius: 1rem;
          padding: 0.85rem 1.25rem;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .dark .form-input-zinc {
          background: #18181b;
          border-color: #27272a;
          color: #f4f4f5;
        }
        .form-input-zinc:focus {
          border-color: #10b981;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }
        .dark .form-input-zinc:focus {
          background: #09090b;
        }
      `}</style>
    </div>
  );
};

export default AddTransaction;