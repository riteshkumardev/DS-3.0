import React, { useState, useEffect } from 'react';
import axios from "axios";
import { 
  Search, Trash2, Edit3, Check, X, 
  Package, History, Database, 
  Layers, Weight, ClipboardList, ShoppingBag, ArrowUpRight
} from "lucide-react";
import Loader from '../Core_Component/Loader/Loader';
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const StockManagement = ({ user }) => {
    const role=user.role
  const isAuthorized = role === "Admin" || role === "Accountant";

  const [stocks, setStocks] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/stocks`);
      if (res.data.success) {
        setStocks(res.data.data);
      }
    } catch (err) {
      showMsg("स्टॉक लोड करने में असमर्थ", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, [API_URL]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await axios.put(`${API_URL}/api/stocks/${editId}`, editData);
      if (res.data.success) {
        showMsg("Inventory updated successfully! ✅");
        setEditId(null);
        fetchStocks();
      }
    } catch (err) {
      showMsg("Update failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!isAuthorized || !window.confirm("क्या आप इसे डिलीट करना चाहते हैं?")) return;
    try {
      setLoading(true);
      const res = await axios.delete(`${API_URL}/api/stocks/${id}`);
      if (res.data.success) {
        showMsg("Item removed from inventory");
        fetchStocks();
      }
    } catch (err) {
      showMsg("Delete failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredStocks = stocks.filter(s => 
    s.productName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-[#f1f3f6] dark:bg-zinc-950 p-4 md:p-10 font-sans">
      
      {/* 📊 Summary Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {[
          { label: "Active Items", val: stocks.length, sub: "In Inventory", icon: <Database />, color: "border-emerald-500", bg: "text-emerald-600" },
          { label: "Stock Units", val: stocks.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0), sub: "Total Bags", icon: <ShoppingBag />, color: "border-indigo-500", bg: "text-indigo-600" },
          { label: "Gross Weight", val: (stocks.reduce((acc, s) => acc + (Number(s.totalQuantity) || 0), 0) / 1000).toFixed(1) + " MT", sub: "Metric Tons", icon: <Weight />, color: "border-amber-500", bg: "text-amber-600" }
        ].map((item, i) => (
          <div key={i} className={`bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border-l-[12px] ${item.color} flex items-center justify-between group hover:-translate-y-2 transition-all duration-500`}>
            <div className="text-left">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2">{item.label}</p>
              <h3 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">{item.val}</h3>
              <p className="text-[10px] font-bold text-zinc-400 mt-2 flex items-center gap-1 uppercase tracking-widest"><ArrowUpRight size={10} className={item.bg} /> {item.sub}</p>
            </div>
            <div className={`p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl ${item.bg} shadow-inner group-hover:rotate-[15deg] transition-transform duration-500`}>
              {React.cloneElement(item.icon, { size: 36 })}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.06)] border border-white dark:border-zinc-800 overflow-hidden">
        
        {/* Advanced Header Control */}
        <div className="p-10 border-b dark:border-zinc-800 flex flex-wrap justify-between items-center gap-8 bg-gradient-to-r from-zinc-50/50 to-white dark:from-zinc-800/20 dark:to-zinc-900 text-left">
          <div>
            <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter italic flex items-center gap-4">
              <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-500/30 rotate-3"><ClipboardList size={30} /></div> Live Inventory
            </h2>
            <p className="text-[11px] text-zinc-400 font-black uppercase tracking-[0.3em] mt-3 ml-1">Industrial Stock Monitoring Ecosystem</p>
          </div>
          
          <div className="relative group flex-1 max-w-lg">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-emerald-500 transition-all" size={22} />
            <input 
              placeholder="Search product code or name..." 
              className="w-full pl-14 pr-8 py-5 bg-[#f8fafc] dark:bg-zinc-800/50 border-2 border-transparent rounded-[2rem] text-sm font-bold outline-none focus:bg-white focus:border-emerald-500/20 focus:ring-[10px] focus:ring-emerald-500/5 shadow-inner transition-all"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-[#fcfdfe] dark:bg-zinc-800/50 text-zinc-400 text-[10px] font-black uppercase tracking-[0.4em] border-b dark:border-zinc-800">
                <th className="px-10 py-8">Product Identity</th>
                <th className="px-10 py-8">Available Weight</th>
                <th className="px-10 py-8 text-center">Unit Count</th>
                <th className="px-10 py-8">Properties</th>
                <th className="px-10 py-8 text-center">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredStocks.map((stock) => {
                const isEditing = editId === stock._id;
                const weight = Number(stock.totalQuantity) || 0;

                return (
                  <tr key={stock._id} className={`${isEditing ? 'bg-emerald-50/30' : 'hover:bg-[#f8fafc] dark:hover:bg-zinc-800/30'} transition-all duration-300`}>
                    
                    {/* Identity */}
                    <td className="px-10 py-6">
                      {isEditing ? (
                        <input className="edit-input-zinc" value={editData.productName} onChange={(e) => setEditData({...editData, productName: e.target.value})} />
                      ) : (
                        <div className="flex items-center gap-5 text-left">
                           <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-800 shadow-lg border border-zinc-100 dark:border-zinc-700 flex items-center justify-center text-emerald-600">
                              <Layers size={24} />
                           </div>
                           <div className="flex flex-col">
                              <span className="text-base font-black text-zinc-900 dark:text-zinc-100 uppercase italic tracking-tight leading-tight">{stock.productName}</span>
                              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1 opacity-60">{stock.remarks || "Standard Batch"}</span>
                           </div>
                        </div>
                      )}
                    </td>

                    {/* Stock Level (Weight) */}
                    <td className="px-10 py-6 text-left">
                      {isEditing ? (
                        <div className="relative max-w-[150px]">
                           <input type="number" className="edit-input-zinc" value={editData.totalQuantity} onChange={(e) => setEditData({...editData, totalQuantity: e.target.value})} />
                           <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black opacity-30">KG</span>
                        </div>
                      ) : (
                        <div className="flex flex-col text-left">
                           <div className={`text-2xl font-black tracking-tighter ${weight <= 0 ? 'text-rose-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                              {weight.toLocaleString()} <span className="text-xs font-bold opacity-30 uppercase ml-1 tracking-widest text-zinc-500">KG</span>
                           </div>
                           <div className={`w-24 h-1 mt-2 rounded-full bg-zinc-100 overflow-hidden`}>
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: weight > 1000 ? '100%' : `${weight/10}%` }}></div>
                           </div>
                        </div>
                      )}
                    </td>

                    {/* Unit Count (Bags) */}
                    <td className="px-10 py-6 text-center">
                      {isEditing ? (
                        <input type="number" className="edit-input-zinc max-w-[100px] text-center" value={editData.quantity} onChange={(e) => setEditData({...editData, quantity: e.target.value})} />
                      ) : (
                        <div className="inline-flex flex-col items-center">
                           <div className="px-4 py-1.5 bg-emerald-600 text-white text-[11px] font-black rounded-xl shadow-lg shadow-emerald-500/20 uppercase tracking-widest">
                             {stock.quantity || 0} Units
                           </div>
                        </div>
                      )}
                    </td>

                    {/* Bag Attributes */}
                    <td className="px-10 py-6">
                       {stock.bagType || stock.bagCondition ? (
                         <div className="flex flex-wrap gap-2 text-left">
                            <span className="px-3 py-1 bg-zinc-900 text-zinc-100 dark:bg-white dark:text-zinc-900 text-[9px] font-black rounded-lg uppercase tracking-widest">
                               {stock.bagType}
                            </span>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-black rounded-lg uppercase tracking-widest">
                               {stock.bagCondition}
                            </span>
                         </div>
                       ) : (
                         <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest bg-zinc-50 dark:bg-zinc-800/50 px-3 py-1 rounded-lg">Raw Product</span>
                       )}
                    </td>

                    {/* Actions */}
                    <td className="px-10 py-6">
                      {isEditing ? (
                        <div className="flex justify-center gap-3">
                          <button className="w-12 h-12 flex items-center justify-center bg-emerald-600 text-white rounded-2xl shadow-xl hover:bg-emerald-700 active:scale-90 transition-all" onClick={handleSave}><Check size={20}/></button> 
                          <button className="w-12 h-12 flex items-center justify-center bg-zinc-200 text-zinc-500 rounded-2xl hover:bg-zinc-300 active:scale-90 transition-all" onClick={() => setEditId(null)}><X size={20}/></button>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-4">
                          <button className="w-11 h-11 flex items-center justify-center bg-white dark:bg-zinc-800 text-zinc-400 hover:text-emerald-600 hover:shadow-xl hover:border-emerald-200 rounded-2xl transition-all border border-zinc-100 dark:border-zinc-700 shadow-sm" onClick={() => { setEditId(stock._id); setEditData({...stock}); }} disabled={!isAuthorized}><Edit3 size={18}/></button> 
                          <button className="w-11 h-11 flex items-center justify-center bg-white dark:bg-zinc-800 text-zinc-400 hover:text-rose-500 hover:shadow-xl hover:border-rose-200 rounded-2xl transition-all border border-zinc-100 dark:border-zinc-700 shadow-sm" onClick={() => handleDelete(stock._id)} disabled={!isAuthorized}><Trash2 size={18}/></button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />
      <style>{`
        .edit-input-zinc { 
          width: 100%; 
          background: #ffffff; 
          border: 2.5px solid #e2e8f0; 
          border-radius: 1.25rem; 
          padding: 1rem 1.25rem; 
          font-size: 0.9rem; 
          outline: none; 
          font-weight: 800; 
          color: #059669; 
          transition: all 0.3s;
        }
        .dark .edit-input-zinc { background: #09090b; border-color: #27272a; }
        .edit-input-zinc:focus { border-color: #10b981; box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.1); }
      `}</style>
    </div>
  );
};

export default StockManagement;