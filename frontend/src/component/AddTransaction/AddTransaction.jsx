import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Calendar, User, Info, 
  ArrowUpRight, ArrowDownLeft, ShieldCheck, 
  Save, RotateCcw, Landmark 
} from "lucide-react";
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const AddTransaction = () => {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    partyId: '',
    amount: '',
    description: '',
    linkTo: 'sale',
    date: today 
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const onTransactionAdded = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };
  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  const fetchParties = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/suppliers/list`); 
      if (res.data?.success) {
        setParties(res.data.data);
      }
    } catch (err) {
      console.error("Suppliers load error:", err);
      showMsg("सप्लायर लिस्ट लोड नहीं हो पाई", "error");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(formData.amount);
    if (!formData.partyId || amt <= 0) return showMsg("कृपया सही पार्टी और राशि भरें", "warning");

    const transactionType = formData.linkTo === 'sale' ? 'IN' : 'OUT';

    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/transactions/add-with-sync`, {
        ...formData,
        type: transactionType,
        amount: amt
      });

      if (response.data.success) {
        showMsg(`सफलता! ${formData.linkTo.toUpperCase()} सिंक हो गया।`);
        setFormData({ partyId: '', amount: '', description: '', linkTo: 'sale', date: today });
        fetchParties(); 
        if (onTransactionAdded) onTransactionAdded();
      }
    } catch (err) {
      showMsg(err.response?.data?.message || "सिंकिंग विफल रही", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 font-sans">
      {loading && <Loader />}
      
      <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all duration-300">
        
        {/* --- HEADER --- */}
        <div className="bg-emerald-600 p-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <ShieldCheck size={24} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-tighter italic">Transaction Smart Sync</h2>
          </div>
          <span className="text-[10px] font-black bg-zinc-900/20 px-3 py-1 rounded-full uppercase tracking-widest border border-white/10">Ledger-Safe</span>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar size={12}/> Transaction Date
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
              <User size={12}/> Choose Recipient / Payer
            </label>
            <select 
              name="partyId"
              className="form-input-zinc font-bold cursor-pointer"
              value={formData.partyId}
              onChange={handleInputChange}
              required
            >
              <option value="">-- Select Registered Party --</option>
              {parties.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name} (Current Bal: ₹{p.totalOwed || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Transaction Category (Modern Radio Replacement) */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Adjustment Link</label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={() => setFormData(prev => ({...prev, linkTo: 'sale'}))}
                className={`flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all font-black text-xs uppercase tracking-widest ${
                    formData.linkTo === 'sale' 
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-600 dark:bg-emerald-950/20 shadow-lg shadow-emerald-500/10' 
                    : 'bg-zinc-50 border-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:border-zinc-700'
                }`}
              >
                <ArrowDownLeft size={18} /> Sales (Money IN)
              </button>
              <button 
                type="button"
                onClick={() => setFormData(prev => ({...prev, linkTo: 'purchase'}))}
                className={`flex items-center justify-center gap-2 py-4 rounded-2xl border-2 transition-all font-black text-xs uppercase tracking-widest ${
                    formData.linkTo === 'purchase' 
                    ? 'bg-red-50 border-red-500 text-red-600 dark:bg-red-950/20 shadow-lg shadow-red-500/10' 
                    : 'bg-zinc-50 border-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:border-zinc-700'
                }`}
              >
                <ArrowUpRight size={18} /> Purchase (Money OUT)
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
              <Info size={12}/> Narration / Remark
            </label>
            <input 
              name="description"
              type="text" 
              className="form-input-zinc"
              placeholder="Ex: Payment for Invoice #102 via PhonePe"
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-4 pt-6 border-t dark:border-zinc-800">
            <button 
              type="submit" 
              disabled={loading}
              className="group relative flex items-center justify-center gap-3 py-4 bg-emerald-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50"
            >
              <Save size={18} />
              {loading ? 'PROCESSING SYNC...' : 'CONFIRM TRANSACTION'}
            </button>
            <button 
                type="button"
                onClick={() => setFormData({ partyId: '', amount: '', description: '', linkTo: 'sale', date: today })}
                className="flex items-center justify-center gap-2 py-2 text-zinc-400 hover:text-zinc-600 text-[10px] font-black uppercase tracking-widest transition-all"
            >
                <RotateCcw size={14} /> Clear Form
            </button>
          </div>
        </form>
      </div>

      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />

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