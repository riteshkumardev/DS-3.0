import React, { useState, useEffect, useCallback } from 'react';
import { getAllPurchases, deletePurchase } from "../../api/purchaseApi";
import { 
  Search, Trash2, Edit3, ShoppingCart, Calendar, 
  Truck, MessageSquare, ChevronLeft, ChevronRight, Filter 
} from "lucide-react";
import Loader from '../Core_Component/Loader/Loader';
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const toSafeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const PurchaseTable = ({ user, onEdit }) => {
  const userRole = user?.role?.toUpperCase();
  const isAdmin = userRole === "ADMIN";

  const [purchaseData, setPurchaseData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const showMsg = (msg, type = "success") => setSnackbar({ open: true, message: msg, severity: type });

  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllPurchases();
      if (res.data?.success) setPurchaseData(res.data.data);
    } catch (err) {
      showMsg("Data load karne mein fail", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);

  const handleDelete = async (id) => {
    if (!isAdmin) return showMsg("Only ADMIN can delete!", "error");
    if (!window.confirm("क्या आप इस रिकॉर्ड को डिलीat करना चाहते हैं?")) return;

    try {
      setLoading(true);
      const res = await deletePurchase(id);
      if (res.data.success) {
        showMsg("🗑️ Deleted Successfully!");
        fetchPurchases();
      }
    } catch (err) {
      showMsg("Delete fail ho gaya", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = purchaseData.filter(item =>
    String(item.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(item.billNo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.goods?.some(g => g.productName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const currentRows = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  if (loading) return <Loader />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* Header Toolbar */}
        <div className="p-8 border-b dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl">
              <ShoppingCart className="text-emerald-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-tighter">Purchase History</h2>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Manage your stock procurement</p>
            </div>
          </div>

          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input 
              placeholder="Search Bill, Supplier, Product..." 
              className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-emerald-500/50 rounded-2xl text-xs font-bold outline-none transition-all dark:text-white"
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        {/* Table Area */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-800/30 text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] border-b dark:border-zinc-800">
                <th className="px-8 py-6">Date & Bill</th>
                <th className="px-8 py-6">Supplier Info</th>
                <th className="px-8 py-6">Goods Detail</th>
                <th className="px-8 py-6">Financials</th>
                <th className="px-8 py-6">Status & Balance</th>
                <th className="px-8 py-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {currentRows.map((item) => (
                <tr key={item._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-black text-zinc-800 dark:text-zinc-100 tracking-tighter">{item.billNo}</span>
                      <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                        <Calendar size={12} className="text-emerald-500" /> {new Date(item.date).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-zinc-700 dark:text-zinc-200 uppercase">{item.customerName}</span>
                      <span className="text-[9px] font-bold text-zinc-400 flex items-center gap-1 uppercase tracking-tighter">
                        <Truck size={10} /> {item.logistics?.vehicleNo || "Direct"}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {item.goods?.map((g, i) => (
                      <div key={i} className="flex flex-col">
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase">{g.productName}</span>
                        <span className="text-[10px] font-bold text-zinc-400">{g.quantity} {g.unit} @ ₹{g.rate}</span>
                      </div>
                    ))}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-zinc-900 dark:text-white">₹{toSafeNumber(item.grandTotal).toLocaleString()}</span>
                      <span className="text-[9px] font-bold text-rose-500 uppercase">Freight: ₹{item.logistics?.freight}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1.5">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-md w-fit uppercase tracking-widest ${
                        item.status === 'PAID' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                      }`}>
                        {item.status}
                      </span>
                      <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 tracking-tight">
                        Due: ₹{toSafeNumber(item.balanceDue).toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-center gap-3">
                      <button 
                        onClick={() => onEdit(item)} 
                        className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-emerald-500 rounded-2xl transition-all hover:shadow-lg"
                      >
                        <Edit3 size={16}/>
                      </button>
                      <button 
                        onClick={() => handleDelete(item._id)} 
                        className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-rose-500 rounded-2xl transition-all hover:shadow-lg"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-8 bg-zinc-50/50 dark:bg-zinc-800/30 flex justify-between items-center border-t dark:border-zinc-800">
           <p className="text-xs font-bold text-zinc-400">Showing {currentRows.length} of {filteredData.length} records</p>
           <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-xl disabled:opacity-30"><ChevronLeft size={18}/></button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-xl disabled:opacity-30"><ChevronRight size={18}/></button>
           </div>
        </div>
      </div>
      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />
    </div>
  );
};

export default PurchaseTable;