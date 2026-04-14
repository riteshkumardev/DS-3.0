import React, { useState, useEffect, useCallback } from "react";
import "./Sales.css";
// Modular API functions
import { getAllSales, deleteSale, getInvoicePDF } from "../../api/saleApi"; 
import { 
  Search, Trash2, Edit3, Check, X, 
  ChevronLeft, ChevronRight, Receipt, Calendar, Truck, MessageSquare, Printer 
} from "lucide-react";
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";
import axios from "axios";

/* =========================
    🔒 Helper (NaN Safe)
   ========================= */
const toSafeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const SalesTable = ({ user }) => {
  // ✅ FIX: Normalize role to UpperCase for reliable comparison
  const userRole = user?.role?.toUpperCase(); 
  const isAuthorized = userRole === "ADMIN" || userRole === "ACCOUNTANT" || userRole === "MANAGER";

  const [salesList, setSalesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("All");
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [freightMode, setFreightMode] = useState("-"); 
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const showMsg = (msg, type = "success") => setSnackbar({ open: true, message: msg, severity: type });

  // 1. Fetch Sales using modular API
  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllSales(); 
      if (res.data.success) {
        setSalesList(res.data.data);
      }
    } catch (err) { 
      showMsg("Server connection error.", "error"); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  // 2. Handle PDF Printing
  const handlePrint = async (id) => {
    try {
      showMsg("Generating PDF...", "info");
      const res = await getInvoicePDF(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bill_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showMsg("Failed to download PDF.", "error");
    }
  };

  /* =========================
      🧮 Enhanced Live Calculation
     ========================= */
  useEffect(() => {
    if (!editId || !editData.goods) return;

    const totalTaxable = editData.goods.reduce((sum, item) => {
        return sum + (toSafeNumber(item.quantity) * toSafeNumber(item.rate));
    }, 0);

    const freight = toSafeNumber(editData.logistics?.freight);
    const discAmount = toSafeNumber(editData.discount);
    const received = toSafeNumber(editData.amountPaid);
    
    const finalTotal = freightMode === "+" 
        ? (totalTaxable + freight - discAmount) 
        : (totalTaxable - freight - discAmount);
        
    const due = finalTotal - received;

    if (Math.abs(editData.grandTotal - finalTotal) > 0.01 || Math.abs(editData.balanceDue - due) > 0.01) {
        setEditData((prev) => ({
            ...prev,
            subTotal: totalTaxable,
            grandTotal: Math.round(finalTotal),
            balanceDue: Math.round(due),
        }));
    }
  }, [editId, editData.goods, editData.logistics?.freight, editData.discount, editData.amountPaid, freightMode]);

  const handleGoodsChange = (index, field, value) => {
    const updatedGoods = [...editData.goods];
    updatedGoods[index] = { ...updatedGoods[index], [field]: value };
    setEditData({ ...editData, goods: updatedGoods });
  };

  const handleLogisticsChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      logistics: { ...prev.logistics, [field]: value }
    }));
  };

  const getProcessedList = () => {
    let list = salesList.filter((s) => {
      const term = search.toLowerCase();
      const matchesSearch = 
        String(s.customerName || "").toLowerCase().includes(term) ||
        String(s.billNo || "").toLowerCase().includes(term) ||
        String(s.logistics?.vehicleNo || "").toLowerCase().includes(term);
      
      const matchesProduct = selectedProduct === "All" || 
        (s.goods && s.goods.some(g => g.productName === selectedProduct));
        
      return matchesSearch && matchesProduct;
    });

    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const processedList = getProcessedList();
  const currentRows = processedList.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalPages = Math.ceil(processedList.length / rowsPerPage);

  const handleDelete = async (id) => {
    if (!isAuthorized) return showMsg("Permission denied.", "error");
    if (!window.confirm("Are you sure? This will sync inventory back.")) return;
    try {
      setLoading(true);
      const res = await deleteSale(id);
      if (res.data.success) { 
        showMsg("Record Deleted!"); 
        fetchSales(); 
      }
    } catch { 
      showMsg("Delete operation failed.", "error"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await axios.put(`${process.env.REACT_APP_API_URL}/sales/${editId}`, editData);
      if (res.data.success) { 
        showMsg("Bill Updated Successfully!"); 
        setEditId(null); 
        fetchSales(); 
      }
    } catch { 
      showMsg("Update failed.", "error"); 
    } finally { 
      setLoading(false); 
    }
  };

  const startEdit = (sale) => {
    // Check if the current user has permission before opening the edit UI
    if (!isAuthorized) {
        return showMsg(`Access Denied! Your role: ${user?.role || 'Guest'}`, "warning");
    }
    setEditId(sale._id);
    setFreightMode(toSafeNumber(sale.logistics?.freight) < 0 ? "-" : "+"); 
    setEditData({ ...sale });
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-6 font-sans">
      <div className="max-w-screen-2xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* Header Section */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-wrap justify-between items-center gap-4">
          <h2 className="text-xl font-black text-zinc-800 dark:text-zinc-100 uppercase flex items-center gap-2 tracking-tighter">
            <Receipt className="text-emerald-600" /> Sales Ledger
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-zinc-400" size={14} />
              <input 
                placeholder="Search Bill/Customer..." 
                className="pl-9 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold outline-none w-64 border border-transparent focus:border-emerald-500" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
            <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-xl text-[10px] font-black uppercase outline-none cursor-pointer">
                <option value="All">All Products</option>
                <option value="Corn Grit">Corn Grit</option>
                <option value="Cattle Feed">Cattle Feed</option>
            </select>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1300px]">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] border-b">
                <th className="px-6 py-5 text-center">Date & Bill No</th>
                <th className="px-6 py-5">Customer & Logistics</th>
                <th className="px-6 py-5">Items (Qty @ Rate)</th>
                <th className="px-6 py-5">Summary (Tax/GST)</th>
                <th className="px-6 py-5">Grand Total</th>
                <th className="px-6 py-5">Due Status</th>
                <th className="px-6 py-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
              {currentRows.map((sale) => (
                <tr key={sale._id} className={`${editId === sale._id ? 'bg-emerald-50/20 dark:bg-emerald-900/10' : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20'}`}>
                  {editId === sale._id ? (
                    /* ✏️ EDIT MODE */
                    <td colSpan="7" className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-2">
                        <div className="space-y-3 bg-white dark:bg-zinc-800 p-4 rounded-2xl border">
                          <label className="text-[10px] font-black text-emerald-600 uppercase">1. General Info</label>
                          <input type="date" className="w-full border rounded-lg p-2 text-xs" value={editData.date?.split('T')[0] || ""} onChange={(e) => setEditData({ ...editData, date: e.target.value })} />
                          <div className="grid grid-cols-2 gap-2">
                            <input placeholder="Bill #" className="border rounded-lg p-2 text-xs" value={editData.billNo} onChange={(e) => setEditData({ ...editData, billNo: e.target.value })} />
                            <input placeholder="Vehicle" className="border rounded-lg p-2 text-xs" value={editData.logistics?.vehicleNo} onChange={(e) => handleLogisticsChange('vehicleNo', e.target.value.toUpperCase())} />
                          </div>
                          <input placeholder="Customer Name" className="w-full border rounded-lg p-2 text-xs font-bold" value={editData.customerName} onChange={(e) => setEditData({ ...editData, customerName: e.target.value })} />
                        </div>

                        <div className="space-y-3 bg-white dark:bg-zinc-800 p-4 rounded-2xl border">
                          <label className="text-[10px] font-black text-emerald-600 uppercase">2. Goods Details</label>
                          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                            {editData.goods.map((g, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-xl border">
                                <span className="text-[10px] font-bold w-24 truncate">{g.productName}</span>
                                <input type="number" className="w-full p-1.5 text-xs rounded border outline-none" value={g.quantity} onChange={(e) => handleGoodsChange(idx, 'quantity', e.target.value)} />
                                <span className="text-zinc-400">@</span>
                                <input type="number" className="w-full p-1.5 text-xs rounded border outline-none" value={g.rate} onChange={(e) => handleGoodsChange(idx, 'rate', e.target.value)} />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-100">
                           <div className="grid grid-cols-2 gap-4">
                             <div>
                               <label className="text-[9px] font-black uppercase">Freight (±)</label>
                               <div className="flex gap-1 mt-1">
                                 <button onClick={() => setFreightMode(p => p === "+" ? "-" : "+")} className={`w-8 rounded font-bold text-white ${freightMode === "+" ? 'bg-emerald-500' : 'bg-red-500'}`}>{freightMode}</button>
                                 <input type="number" className="w-full p-1.5 text-xs rounded border" value={editData.logistics?.freight} onChange={(e) => handleLogisticsChange('freight', e.target.value)} />
                               </div>
                             </div>
                             <div>
                               <label className="text-[9px] font-black uppercase">CD Amount</label>
                               <input type="number" className="w-full mt-1 p-1.5 text-xs rounded border" value={editData.discount} onChange={(e) => setEditData({ ...editData, discount: e.target.value })} />
                             </div>
                           </div>
                           <div>
                             <label className="text-[9px] font-black uppercase text-emerald-700">Amount Received</label>
                             <input type="number" className="w-full mt-1 p-2 text-sm font-black text-emerald-600 rounded-lg border-2 border-emerald-200" value={editData.amountPaid} onChange={(e) => setEditData({ ...editData, amountPaid: e.target.value })} />
                           </div>
                           <div className="flex justify-between items-center border-t border-emerald-200 pt-2">
                             <div className="text-xs font-bold text-red-500">Due: ₹{editData.balanceDue?.toLocaleString()}</div>
                             <div className="text-xl font-black text-zinc-900 tracking-tighter">Total: ₹{editData.grandTotal?.toLocaleString()}</div>
                           </div>
                           <div className="flex gap-2">
                             <button className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black" onClick={handleSave}><Check size={16} className="inline mr-2"/> SAVE</button>
                             <button className="px-4 py-3 bg-zinc-200 rounded-xl text-xs font-black" onClick={() => setEditId(null)}><X size={16}/></button>
                           </div>
                        </div>
                      </div>
                    </td>
                  ) : (
                    /* 📄 VIEW MODE */
                    <>
                      <td className="px-6 py-4">
                        <div className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5 mb-1"><Calendar size={12} /> {sale.date?.split('T')[0]}</div>
                        <div className="text-sm font-black text-zinc-800 dark:text-zinc-100 flex items-center gap-1"><Receipt size={12} className="text-emerald-500"/> {sale.billNo}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-black text-zinc-700 dark:text-zinc-200 uppercase mb-1">{sale.customerName}</div>
                        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-1">
                          <Truck size={10} /> {sale.logistics?.vehicleNo || "DIRECT"} 
                          {sale.logistics?.destination && ` → ${sale.logistics.destination}`}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          {sale.goods?.map((g, i) => (
                            <div key={i} className="text-[11px] font-bold text-zinc-500 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"/>
                              <span className="text-emerald-600">{g.quantity} {g.unit}</span> @ ₹{g.rate} 
                              <span className="opacity-40 uppercase ml-1">[{g.productName}]</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[10px] font-black text-zinc-400">
                        FREIGHT: <span className="text-emerald-500">₹{sale.logistics?.freight || 0}</span><br/>
                        GST TYPE: <span className="text-blue-500">{sale.gstType}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-base font-black text-zinc-900 dark:text-white tracking-tighter">₹{toSafeNumber(sale.grandTotal).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[9px] font-black uppercase text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full w-max mb-1">Rec: ₹{toSafeNumber(sale.amountPaid).toLocaleString()}</div>
                        <div className={`text-[12px] font-black italic ${toSafeNumber(sale.balanceDue) > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                          Due: ₹{toSafeNumber(sale.balanceDue).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handlePrint(sale._id)} className="p-2.5 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-blue-500 rounded-xl border border-zinc-200 dark:border-zinc-700 transition-colors"><Printer size={16}/></button>
                          <button onClick={() => startEdit(sale)} className="p-2.5 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-emerald-500 rounded-xl border border-zinc-200 dark:border-zinc-700 transition-colors"><Edit3 size={16}/></button>
                          <button onClick={() => handleDelete(sale._id)} className="p-2.5 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-red-500 rounded-xl border border-zinc-200 dark:border-zinc-700 transition-colors"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination/Footer */}
        <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Showing {currentRows.length} of {processedList.length}</span>
          <div className="flex items-center gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 bg-white dark:bg-zinc-800 border rounded-xl disabled:opacity-30 transition-all hover:border-emerald-500"><ChevronLeft size={16}/></button>
            <div className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 tracking-widest">Page {currentPage} of {totalPages || 1}</div>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 bg-white dark:bg-zinc-800 border rounded-xl disabled:opacity-30 transition-all hover:border-emerald-500"><ChevronRight size={16}/></button>
          </div>
        </div>
      </div>

      <CustomSnackbar 
        open={snackbar.open} 
        message={snackbar.message} 
        severity={snackbar.severity} 
        onClose={() => setSnackbar({ ...snackbar, open: false })} 
      />
    </div> 
  );
};

export default SalesTable;