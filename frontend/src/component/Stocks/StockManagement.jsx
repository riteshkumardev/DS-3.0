import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Trash2, Edit3, Check, X, 
  Database, Weight, ClipboardList, ShoppingBag, ArrowUpRight, Layers
} from "lucide-react";

// ✅ Importing Centralized API services
import { getInventory, updateStock } from "../../api/stockApi";
import API from "../../api/apiConfig"; 

import Loader from '../Core_Component/Loader/Loader';
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const StockManagement = ({ user }) => {
  const role = user?.role?.toUpperCase();
  const isAuthorized = role === "ADMIN" || role === "ACCOUNTANT";

  const [stocks, setStocks] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  // 🔄 Fetch Inventory
  const fetchStocks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getInventory();
      if (res.data.success) {
        // Backend data mapping to ensure UI compatibility
        setStocks(res.data.data);
      }
    } catch (err) {
      showMsg("स्टॉक लोड करने में असमर्थ", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const payload = {
        ...editData,
        // Backend keys sync
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
    } catch (err) {
      showMsg("Update failed: " + (err.response?.data?.message || "Server Error"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!isAuthorized || !window.confirm("क्या आप इस उत्पाद को मास्टर लिस्ट से हटाना चाहते हैं?")) return;
    try {
      setLoading(true);
      const res = await API.delete(`/stocks/${id}`);
      if (res.data.success) {
        showMsg("Product removed successfully");
        fetchStocks();
      }
    } catch (err) {
      showMsg(err.response?.data?.message || "Delete failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredStocks = stocks.filter(s => {
    const name = (s.name || s.productName || "").toLowerCase();
    const hsn = (s.hsnCode || "").toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || hsn.includes(searchTerm.toLowerCase());
  });

  if (loading && stocks.length === 0) return <Loader />;

  return (
    <div className="min-h-screen bg-[#f1f3f6] dark:bg-zinc-950 p-4 md:p-10 font-sans">
      
      {/* 📊 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
        {[
          { label: "Total Products", val: stocks.length, sub: "Items in Master", icon: <Database />, color: "border-emerald-500", bg: "text-emerald-600" },
          { label: "Active Inventory", val: stocks.filter(s => s.currentStock > 0).length, sub: "Available Items", icon: <ShoppingBag />, color: "border-indigo-500", bg: "text-indigo-600" },
          { label: "Total Stock Value", val: (stocks.reduce((acc, s) => acc + (Number(s.currentStock) || 0), 0)).toLocaleString() + " " + (stocks[0]?.unit || "KG"), sub: "Gross Quantity", icon: <Weight />, color: "border-amber-500", bg: "text-amber-600" }
        ].map((item, i) => (
          <div key={i} className={`bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-xl border-l-[12px] ${item.color} flex items-center justify-between group hover:-translate-y-2 transition-all duration-500`}>
            <div className="text-left">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">{item.label}</p>
              <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">{item.val}</h3>
              <p className="text-[10px] font-bold text-zinc-400 mt-2 flex items-center gap-1 uppercase tracking-widest"><ArrowUpRight size={10} className={item.bg} /> {item.sub}</p>
            </div>
            <div className={`p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl ${item.bg} shadow-inner group-hover:rotate-[15deg] transition-transform duration-500`}>
              {React.cloneElement(item.icon, { size: 36 })}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-[3.5rem] shadow-2xl border border-white dark:border-zinc-800 overflow-hidden">
        
        {/* Header Control */}
        <div className="p-10 border-b dark:border-zinc-800 flex flex-wrap justify-between items-center gap-8 bg-gradient-to-r from-zinc-50/50 to-white dark:from-zinc-800/20 dark:to-zinc-900 text-left">
          <div>
            <h2 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter italic flex items-center gap-4">
              <div className="p-3 bg-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-500/30 rotate-3"><ClipboardList size={30} /></div> Live Inventory
            </h2>
            <p className="text-[11px] text-zinc-400 font-black uppercase tracking-[0.3em] mt-3 ml-1">Master Product Data Ecosystem</p>
          </div>
          
          <div className="relative group flex-1 max-w-lg">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-emerald-500 transition-all" size={22} />
            <input 
              placeholder="Search by HSN or Product Name..." 
              className="w-full pl-14 pr-8 py-5 bg-[#f8fafc] dark:bg-zinc-800/50 border-2 border-transparent rounded-[2rem] text-sm font-bold outline-none focus:bg-white focus:border-emerald-500/20 focus:ring-[10px] focus:ring-emerald-500/5 shadow-inner transition-all"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-[#fcfdfe] dark:bg-zinc-800/50 text-zinc-400 text-[10px] font-black uppercase tracking-[0.4em] border-b dark:border-zinc-800">
                <th className="px-10 py-8">Identity & HSN</th>
                <th className="px-10 py-8">Current Balance</th>
                <th className="px-10 py-8">Category & Type</th>
                <th className="px-10 py-8 text-center">Master Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredStocks.length > 0 ? filteredStocks.map((stock) => {
                const isEditing = editId === stock._id;
                const balance = Number(stock.currentStock) || 0;
                const pName = stock.name || stock.productName;

                return (
                  <tr key={stock._id} className={`${isEditing ? 'bg-emerald-50/30' : 'hover:bg-[#f8fafc] dark:hover:bg-zinc-800/30'} transition-all duration-300`}>
                    
                    {/* Identity & HSN */}
                    <td className="px-10 py-6">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input className="edit-input-zinc" value={editData.name || editData.productName} onChange={(e) => setEditData({...editData, name: e.target.value})} placeholder="Product Name" />
                          <input className="edit-input-zinc text-xs" value={editData.hsnCode} onChange={(e) => setEditData({...editData, hsnCode: e.target.value})} placeholder="HSN Code" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-5 text-left">
                           <div className="w-14 h-14 rounded-2xl bg-white dark:bg-zinc-800 shadow-lg border border-zinc-100 dark:border-zinc-700 flex items-center justify-center text-emerald-600">
                              <Layers size={24} />
                           </div>
                           <div className="flex flex-col">
                              <span className="text-base font-black text-zinc-900 dark:text-zinc-100 uppercase italic tracking-tight leading-tight">{pName}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded font-black tracking-widest uppercase">HSN: {stock.hsnCode || "N/A"}</span>
                              </div>
                           </div>
                        </div>
                      )}
                    </td>

                    {/* Balance */}
                    <td className="px-10 py-6">
                      {isEditing ? (
                        <div className="relative max-w-[150px]">
                           <input type="number" className="edit-input-zinc" value={editData.currentStock} onChange={(e) => setEditData({...editData, currentStock: e.target.value})} />
                           <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black opacity-30">{stock.unit}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col text-left">
                           <div className={`text-2xl font-black tracking-tighter ${balance <= 10 ? 'text-rose-500' : 'text-emerald-600'}`}>
                              {balance.toLocaleString()} <span className="text-xs font-bold opacity-40 uppercase ml-1 tracking-widest">{stock.unit || "KG"}</span>
                           </div>
                           <div className={`w-24 h-1 mt-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden`}>
                              <div className={`h-full ${balance <= 10 ? 'bg-rose-500' : 'bg-emerald-500'} rounded-full`} style={{ width: balance > 100 ? '100%' : `${balance}%` }}></div>
                           </div>
                        </div>
                      )}
                    </td>

                    {/* Properties */}
                    <td className="px-10 py-6">
                        <div className="flex flex-wrap gap-2 text-left">
                          <span className="px-3 py-1 bg-zinc-900 text-zinc-100 dark:bg-white dark:text-zinc-900 text-[9px] font-black rounded-lg uppercase tracking-widest">
                              {stock.category || "GRAINS"}
                          </span>
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-black rounded-lg uppercase tracking-widest">
                              {stock.productType || "BOTH"}
                          </span>
                        </div>
                    </td>

                    {/* Controls */}
                    <td className="px-10 py-6">
                      {isEditing ? (
                        <div className="flex justify-center gap-3">
                          <button className="w-12 h-12 flex items-center justify-center bg-emerald-600 text-white rounded-2xl shadow-xl hover:bg-emerald-700 transition-all" onClick={handleSave}><Check size={20}/></button> 
                          <button className="w-12 h-12 flex items-center justify-center bg-zinc-200 text-zinc-500 rounded-2xl hover:bg-zinc-300 transition-all" onClick={() => setEditId(null)}><X size={20}/></button>
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
              }) : (
                <tr>
                  <td colSpan="4" className="px-10 py-20 text-center text-zinc-400 font-bold italic uppercase tracking-widest">No Products Found In Database</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />
      <style>{`
        .edit-input-zinc { 
          width: 100%; 
          background: #ffffff; 
          border: 2px solid #e2e8f0; 
          border-radius: 1rem; 
          padding: 0.8rem 1rem; 
          font-size: 0.85rem; 
          outline: none; 
          font-weight: 800; 
          color: #059669; 
          transition: all 0.3s;
        }
        .dark .edit-input-zinc { background: #09090b; border-color: #27272a; }
        .edit-input-zinc:focus { border-color: #10b981; }
      `}</style>
    </div>
  );
};

export default StockManagement;