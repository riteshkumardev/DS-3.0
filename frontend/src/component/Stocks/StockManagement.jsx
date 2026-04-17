import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Trash2, Edit3, Check, X, Database, Weight, 
  ShoppingBag, ArrowUpRight, Layers, ClipboardList, Filter
} from "lucide-react";
import { getInventory, updateStock } from "../../api/stockApi";
import API from "../../api/apiConfig"; 
import Loader from '../Core_Component/Loader/Loader';
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const StockManagement = ({ user }) => {
  const role = user?.role?.toUpperCase();
  const isAdmin = role === "ADMIN";

  const [stocks, setStocks] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showMsg = (msg, type = "success") => setSnackbar({ open: true, message: msg, severity: type });

  const fetchStocks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getInventory();
      if (res.data.success) setStocks(res.data.data);
    } catch (err) { showMsg("स्टॉक लोड करने में असमर्थ", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchStocks(); }, [fetchStocks]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const payload = {
        ...editData,
        name: editData.name || editData.productName,
        currentStock: Number(editData.currentStock),
        hsnCode: editData.hsnCode
      };
      const res = await updateStock(editId, payload);
      if (res.data.success) {
        showMsg("Inventory Master Updated! ✅");
        setEditId(null);
        fetchStocks();
      }
    } catch (err) { showMsg(err.response?.data?.message || "Server Error", "error"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!isAdmin) return showMsg("Only ADMIN can delete products!", "error");
    if (!window.confirm("क्या आप इसे मास्टर लिस्ट से हटाना चाहते हैं?")) return;
    try {
      setLoading(true);
      const res = await API.delete(`/stocks/${id}`);
      if (res.data.success) { showMsg("Product removed"); fetchStocks(); }
    } catch (err) { showMsg("Delete failed", "error"); }
    finally { setLoading(false); }
  };

  const filteredStocks = stocks.filter(s => {
    const term = searchTerm.toLowerCase();
    return (s.name || s.productName || "").toLowerCase().includes(term) || (s.hsnCode || "").toLowerCase().includes(term);
  });

  if (loading && stocks.length === 0) return <Loader />;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 md:p-10 font-sans text-left">
      
      {/* 📊 SUMMARY HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        {[
          { label: "Total Catalog", val: stocks.length, icon: <Database />, color: "border-emerald-500", text: "text-emerald-500" },
          { label: "Active Stock", val: stocks.filter(s => s.currentStock > 0).length, icon: <ShoppingBag />, color: "border-indigo-500", text: "text-indigo-500" },
          { label: "Gross Inventory", val: stocks.reduce((acc, s) => acc + (Number(s.currentStock) || 0), 0).toLocaleString() + " KG", icon: <Weight />, color: "border-amber-500", text: "text-amber-500" }
        ].map((item, i) => (
          <div key={i} className={`bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-xl border-l-[10px] ${item.color} flex justify-between items-center group transition-all duration-500 hover:-translate-y-1`}>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{item.label}</p>
              <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter mt-1">{item.val}</h3>
            </div>
            <div className={`p-5 bg-zinc-50 dark:bg-zinc-800 rounded-3xl ${item.text} group-hover:rotate-12 transition-transform`}>
              {React.cloneElement(item.icon, { size: 30 })}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {/* Toolbar */}
        <div className="p-10 border-b dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-600 rounded-2xl text-white rotate-3 shadow-lg shadow-emerald-500/20"><ClipboardList size={28} /></div>
            <div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter italic">Live Inventory Master</h2>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Product Ecosystem Tracking</p>
            </div>
          </div>
          
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
            <input 
              placeholder="Search by HSN or Name..." 
              className="w-full pl-14 pr-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-2 border-transparent focus:border-emerald-500/20 rounded-[1.5rem] text-sm font-bold outline-none transition-all shadow-inner dark:text-white"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-800/50 text-zinc-400 text-[10px] font-black uppercase tracking-[0.3em] border-b dark:border-zinc-800">
                <th className="px-10 py-8">Product Identity</th>
                <th className="px-10 py-8 text-center">Current Balance</th>
                <th className="px-10 py-8">Category & Status</th>
                <th className="px-10 py-8 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredStocks.map((stock) => {
                const isEditing = editId === stock._id;
                const balance = Number(stock.currentStock) || 0;

                return (
                  <tr key={stock._id} className={`${isEditing ? 'bg-emerald-500/5' : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20'} transition-all`}>
                    <td className="px-10 py-6">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input className="edit-input-zinc" value={editData.name || editData.productName} onChange={(e) => setEditData({...editData, name: e.target.value})} />
                          <input className="edit-input-zinc text-[10px]" value={editData.hsnCode} onChange={(e) => setEditData({...editData, hsnCode: e.target.value})} placeholder="HSN" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                           <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-emerald-600"><Layers size={20} /></div>
                           <div className="flex flex-col">
                              <span className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase italic tracking-tight">{stock.name || stock.productName}</span>
                              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-0.5">HSN: {stock.hsnCode || "---"}</span>
                           </div>
                        </div>
                      )}
                    </td>

                    <td className="px-10 py-6">
                      {isEditing ? (
                        <div className="flex justify-center">
                          <input type="number" className="edit-input-zinc w-32 text-center" value={editData.currentStock} onChange={(e) => setEditData({...editData, currentStock: e.target.value})} />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                           <div className={`text-xl font-black ${balance <= 50 ? 'text-rose-500' : 'text-emerald-600'}`}>
                              {balance.toLocaleString()} <span className="text-[10px] uppercase ml-1 opacity-40">{stock.unit || "KG"}</span>
                           </div>
                           <div className="w-24 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full mt-2 overflow-hidden">
                              <div className={`h-full ${balance <= 50 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(balance, 100)}%` }}></div>
                           </div>
                        </div>
                      )}
                    </td>

                    <td className="px-10 py-6">
                        <div className="flex gap-2">
                          <span className="px-3 py-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[9px] font-black rounded-lg uppercase">{stock.category || "GRAINS"}</span>
                          <span className={`px-3 py-1 text-[9px] font-black rounded-lg uppercase ${balance > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            {balance > 0 ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                    </td>

                    <td className="px-10 py-6">
                      {isEditing ? (
                        <div className="flex justify-center gap-3">
                          <button className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg" onClick={handleSave}><Check size={18}/></button> 
                          <button className="p-3 bg-zinc-200 text-zinc-500 rounded-xl" onClick={() => setEditId(null)}><X size={18}/></button>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-3">
                          <button className="p-3 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-emerald-600 rounded-2xl border dark:border-zinc-700 transition-all shadow-sm" onClick={() => { setEditId(stock._id); setEditData({...stock}); }} disabled={!isAdmin}><Edit3 size={16}/></button> 
                          <button className="p-3 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-rose-500 rounded-2xl border dark:border-zinc-700 transition-all shadow-sm" onClick={() => handleDelete(stock._id)} disabled={!isAdmin}><Trash2 size={16}/></button>
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

      <style>{`
        .edit-input-zinc { width: 100%; background: #ffffff; border: 2px solid #e2e8f0; border-radius: 1rem; padding: 0.6rem 1rem; font-size: 0.85rem; outline: none; font-weight: 800; color: #059669; }
        .dark .edit-input-zinc { background: #09090b; border-color: #27272a; }
        .edit-input-zinc:focus { border-color: #10b981; }
      `}</style>
      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />
    </div>
  );
};

export default StockManagement;