import React, { useState, useEffect } from 'react';
import axios from "axios";
import { 
  Search, Trash2, Edit3, Check, X, 
  ChevronLeft, ChevronRight, Calendar, Truck, ShoppingCart, MessageSquare, Plus, Minus
} from "lucide-react";
import Loader from '../Core_Component/Loader/Loader';
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const toSafeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const PurchaseTable = ({ user }) => {
  const role=user.role
  const isAuthorized = role === "Admin" || role === "Accountant";

  const [purchaseData, setPurchaseData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null); 
  const [editData, setEditData] = useState({}); 
  const [currentPage, setCurrentPage] = useState(1);
  const [travelMode, setTravelMode] = useState("-"); 
  const rowsPerPage = 10;

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/purchases`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setPurchaseData(res.data.data);
      } else {
        setPurchaseData([]);
        showMsg("Data खाली है", "warning");
      }
    } catch (err) {
      setPurchaseData([]);
      showMsg("सर्वर कनेक्शन फेल", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPurchases(); }, [API_URL]);

  /* =========================================
      🧮 Live Calculation Logic (With Remarks Sync)
  ========================================== */
  useEffect(() => {
    if (editId) {
      const qty = Number(editData.quantity) || 0;
      const rate = Number(editData.rate) || 0;
      const cdPercent = Number(editData.cashDiscount) || 0;
      const travel = Number(editData.travelingCost) || 0;

      const basePrice = qty * rate;
      const discountAmount = (basePrice * cdPercent) / 100;
      const travelEffect = travelMode === "+" ? travel : -travel;
      const total = basePrice - discountAmount + travelEffect; 
      const balance = total - (Number(editData.paidAmount) || 0);

      if (Math.abs(editData.totalAmount - total) > 0.01 || Math.abs(editData.balanceAmount - balance) > 0.01) {
        setEditData((prev) => ({ 
          ...prev, 
          totalAmount: total, 
          balanceAmount: balance 
        }));
      }
    }
  }, [editData.quantity, editData.rate, editData.cashDiscount, editData.paidAmount, editData.travelingCost, travelMode, editId]);

  const startEdit = (item) => {
    if (!isAuthorized) { showMsg("अनुमति नहीं है", "warning"); return; }
    setEditId(item._id);
    setTravelMode(item.travelMode || "-"); 
    setEditData({ ...item, remarks: item.remarks || "" });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const payload = { ...editData, travelMode };
      const res = await axios.put(`${API_URL}/api/purchases/${editId}`, payload);
      if (res.data.success) {
        showMsg("Record Updated! ✅");
        setEditId(null);
        fetchPurchases();
      }
    } catch (err) { showMsg("Update फेल हो गया", "error"); } 
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!isAuthorized) { showMsg("Permission Denied", "error"); return; }
    if (window.confirm("क्या आप इसे डिलीट करना चाहते हैं?")) {
      try {
        setLoading(true);
        const res = await axios.delete(`${API_URL}/api/purchases/${id}`);
        if (res.data.success) { showMsg("डिलीट हो गया! 🗑️"); fetchPurchases(); }
      } catch (err) { showMsg("डिलीट फेल हो गया", "error"); } 
      finally { setLoading(false); }
    }
  };

  const filteredData = purchaseData.filter(item =>
    String(item.productName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(item.supplierName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(item.vehicleNo || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentRows = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-6 font-sans">
      <div className="max-w-screen-2xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* Toolbar Header */}
        <div className="p-6 border-b dark:border-zinc-800 flex flex-wrap justify-between items-center gap-4">
          <h2 className="text-xl font-black text-zinc-800 dark:text-zinc-100 flex gap-2 items-center tracking-tighter uppercase">
            <ShoppingCart className="text-emerald-500" /> Purchase Ledger
          </h2>
          <div className="relative group flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              placeholder="Search Supplier, Product or Vehicle..." 
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-xs font-bold outline-none border-none focus:ring-2 focus:ring-emerald-500/50"
              value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1300px]">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] border-b dark:border-zinc-800">
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5">Bill / Vehicle</th>
                <th className="px-6 py-5">Supplier & Remarks</th>
                <th className="px-6 py-5">Qty / Rate</th>
                <th className="px-6 py-5">CD / Travel</th>
                <th className="px-6 py-5">Total Bill</th>
                <th className="px-6 py-5">Paid / Balance</th>
                <th className="px-6 py-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
              {currentRows.map((item) => (
                <tr key={item._id} className={`${editId === item._id ? 'bg-emerald-50/20 dark:bg-emerald-900/10' : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20'} transition-all`}>
                  {editId === item._id ? (
                    /* ✏️ INLINE EDIT MODE */
                    <td colSpan="8" className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-top-2">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-emerald-600 uppercase">Basic</label>
                          <input type="date" className="edit-input-zinc" value={editData.date} onChange={e => setEditData({...editData, date: e.target.value})} />
                          <input className="edit-input-zinc" value={editData.billNo} placeholder="Bill No" onChange={e => setEditData({...editData, billNo: e.target.value})} />
                          <input className="edit-input-zinc" value={editData.vehicleNo} placeholder="Vehicle No" onChange={e => setEditData({...editData, vehicleNo: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-emerald-600 uppercase">Details & Remarks</label>
                          <input className="edit-input-zinc font-bold" value={editData.supplierName} placeholder="Supplier" onChange={e => setEditData({...editData, supplierName: e.target.value})} />
                          <input className="edit-input-zinc" value={editData.productName} placeholder="Product" onChange={e => setEditData({...editData, productName: e.target.value})} />
                          <textarea className="edit-input-zinc min-h-[60px]" value={editData.remarks} placeholder="Remarks..." onChange={e => setEditData({...editData, remarks: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-emerald-600 uppercase">Numbers</label>
                          <div className="flex gap-2">
                            <input type="number" className="edit-input-zinc" placeholder="Qty" value={editData.quantity} onChange={e => setEditData({...editData, quantity: e.target.value})} />
                            <input type="number" className="edit-input-zinc" placeholder="Rate" value={editData.rate} onChange={e => setEditData({...editData, rate: e.target.value})} />
                          </div>
                          <div className="flex gap-1">
                            <button type="button" onClick={() => setTravelMode(prev => prev === "+" ? "-" : "+")} className={`w-10 rounded-lg font-black text-white ${travelMode === "+" ? 'bg-emerald-500' : 'bg-red-500'}`}>{travelMode}</button>
                            <input type="number" className="edit-input-zinc" placeholder="Travel" value={editData.travelingCost} onChange={e => setEditData({...editData, travelingCost: e.target.value})} />
                          </div>
                          <input type="number" className="edit-input-zinc" placeholder="Paid Amount" value={editData.paidAmount} onChange={e => setEditData({...editData, paidAmount: e.target.value})} />
                        </div>
                        <div className="flex flex-col justify-between items-end bg-white dark:bg-zinc-950 p-4 rounded-2xl border dark:border-zinc-800">
                          <div className="text-right">
                            <div className="text-[10px] font-black text-zinc-400 uppercase">Current Balance</div>
                            <div className="text-xl font-black text-red-500 tracking-tighter">₹{editData.balanceAmount?.toLocaleString()}</div>
                          </div>
                          <div className="flex gap-2 w-full mt-4">
                            <button className="flex-1 py-2 bg-emerald-600 text-white rounded-xl shadow-lg font-bold" onClick={handleSave}><Check size={16} className="inline mr-1"/> Save</button>
                            <button className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-xl" onClick={() => setEditId(null)}><X size={18}/></button>
                          </div>
                        </div>
                      </div>
                    </td>
                  ) : (
                    /* 📄 VIEW MODE */
                    <>
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-bold text-zinc-500 flex items-center gap-1.5"><Calendar size={14} className="text-emerald-500" /> {item.date}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-zinc-800 dark:text-zinc-100 tracking-tight">{item.billNo || "No Bill"}</span>
                          <span className="text-[10px] text-zinc-400 font-bold uppercase flex items-center gap-1"><Truck size={10}/> {item.vehicleNo || "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-black text-zinc-700 dark:text-zinc-200 uppercase tracking-tighter italic">{item.supplierName}</span>
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{item.productName}</span>
                          {item.remarks && (
                            <div className="flex items-center gap-1.5 text-[9px] bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-lg text-zinc-500 border dark:border-zinc-700 max-w-[180px]">
                              <MessageSquare size={10} className="text-emerald-500 shrink-0" />
                              <span className="truncate">{item.remarks}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400"><span className="text-emerald-600">{item.quantity}</span> @ ₹{item.rate}</span>
                      </td>
                      <td className="px-6 py-4">
                         <div className="text-[10px] font-black text-zinc-400 uppercase">
                           CD: <span className="text-emerald-500">{item.cashDiscount || 0}%</span><br/>
                           Travel: <span className="text-red-400">₹{item.travelingCost || 0}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-zinc-900 dark:text-white tracking-tighter">₹{toSafeNumber(item.totalAmount).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="text-[9px] font-black uppercase text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full w-max">Paid: ₹{item.paidAmount?.toLocaleString()}</div>
                          <div className={`text-[12px] font-black italic underline decoration-2 ${toSafeNumber(item.balanceAmount) > 0 ? 'text-red-500 decoration-red-200' : 'text-emerald-500 decoration-emerald-200'}`}>
                            Bal: ₹{toSafeNumber(item.balanceAmount).toLocaleString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => startEdit(item)} className="p-2.5 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-emerald-500 rounded-xl transition-all border border-zinc-100 dark:border-zinc-800"><Edit3 size={15}/></button>
                          <button onClick={() => handleDelete(item._id)} className="p-2.5 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-red-500 rounded-xl transition-all border border-zinc-100 dark:border-zinc-800"><Trash2 size={15}/></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Improved Pagination */}
        <div className="p-6 bg-zinc-50 dark:bg-zinc-800/30 border-t dark:border-zinc-800 flex justify-between items-center">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Showing {currentRows.length} of {filteredData.length}</span>
          <div className="flex items-center gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 rounded-xl bg-white dark:bg-zinc-800 border dark:border-zinc-700 disabled:opacity-30 hover:bg-emerald-50 transition-all shadow-sm"><ChevronLeft size={16}/></button>
            <div className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20">Page {currentPage} of {totalPages || 1}</div>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 rounded-xl bg-white dark:bg-zinc-800 border dark:border-zinc-700 disabled:opacity-30 hover:bg-emerald-50 transition-all shadow-sm"><ChevronRight size={16}/></button>
          </div>
        </div>
      </div>

      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />
      <style>{`
        .edit-input-zinc { width: 100%; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 0.75rem; padding: 0.5rem 0.75rem; font-size: 0.75rem; outline: none; transition: all 0.2s; }
        .dark .edit-input-zinc { background: #09090b; border-color: #27272a; color: #f4f4f5; }
        .edit-input-zinc:focus { border-color: #10b981; }
      `}</style>
    </div>
  );
};

export default PurchaseTable;