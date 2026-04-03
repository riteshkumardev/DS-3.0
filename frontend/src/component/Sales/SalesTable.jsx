import React, { useState, useEffect } from "react";
import "./Sales.css";
import axios from "axios";
import { 
  Search, Trash2, Edit3, Check, X, 
  ChevronLeft, ChevronRight, Receipt, Calendar, Truck, MessageSquare 
} from "lucide-react";
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

/* =========================
    🔒 Helper (NaN Safe)
   ========================= */
const toSafeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const SalesTable = ({ user }) => {
  const role=user.role
  const isAuthorized = role === "Admin" || role === "Accountant";

  const [salesList, setSalesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("All");
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [freightMode, setFreightMode] = useState("-"); 
  const [sortBy, setSortBy] = useState("dateNewest");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const showMsg = (msg, type = "success") => setSnackbar({ open: true, message: msg, severity: type });

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/sales`);
      if (res.data.success) setSalesList(res.data.data);
    } catch { showMsg("Server connection error.", "error"); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSales(); }, [API_URL]);

  /* =========================
      🧮 Enhanced Live Calculation
     ========================= */
  useEffect(() => {
    if (!editId || !editData.goods) return;

    const totalTaxable = editData.goods.reduce((sum, item) => {
        return sum + (toSafeNumber(item.quantity) * toSafeNumber(item.rate));
    }, 0);

    const freight = toSafeNumber(editData.freight);
    const cdPercent = toSafeNumber(editData.cashDiscount);
    const received = toSafeNumber(editData.amountReceived);
    const discount = (totalTaxable * cdPercent) / 100;
    
    const finalTotal = freightMode === "+" 
        ? (totalTaxable + freight - discount) 
        : (totalTaxable - freight - discount);
        
    const due = finalTotal - received;

    if (Math.abs(editData.totalAmount - finalTotal) > 0.01 || Math.abs(editData.paymentDue - due) > 0.01) {
        setEditData((prev) => ({
            ...prev,
            taxableValue: totalTaxable,
            totalAmount: finalTotal,
            paymentDue: due,
        }));
    }
  }, [editId, editData.goods, editData.freight, editData.cashDiscount, editData.amountReceived, freightMode]);

  const handleGoodsChange = (index, field, value) => {
    const updatedGoods = [...editData.goods];
    updatedGoods[index] = { ...updatedGoods[index], [field]: value };
    setEditData({ ...editData, goods: updatedGoods });
  };

  const getProcessedList = () => {
    let list = salesList.filter((s) => {
      const term = search.toLowerCase();
      const matchesSearch = 
        String(s.customerName || "").toLowerCase().includes(term) ||
        String(s.billNo || "").toLowerCase().includes(term) ||
        String(s.vehicleNo || "").toLowerCase().includes(term);
      const matchesProduct = selectedProduct === "All" || (s.goods && s.goods.some(g => g.product === selectedProduct));
      return matchesSearch && matchesProduct;
    });

    list.sort((a, b) => {
      if (sortBy === "dateNewest") return new Date(b.date) - new Date(a.date);
      if (sortBy === "dateOldest") return new Date(a.date) - new Date(b.date);
      return String(b.billNo).localeCompare(String(a.billNo), undefined, { numeric: true });
    });
    return list;
  };

  const processedList = getProcessedList();
  const currentRows = processedList.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalPages = Math.ceil(processedList.length / rowsPerPage);

  const handleDelete = async (id) => {
    if (!isAuthorized) return showMsg("Permission denied.", "error");
    if (!window.confirm("Are you sure?")) return;
    try {
      setLoading(true);
      const res = await axios.delete(`${API_URL}/api/sales/${id}`);
      if (res.data.success) { showMsg("Deleted!"); fetchSales(); }
    } catch { showMsg("Delete failed.", "error"); } 
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const payload = {
        ...editData,
        freightMeta: freightMode, 
        goods: editData.goods.map(g => ({
            ...g,
            quantity: toSafeNumber(g.quantity),
            rate: toSafeNumber(g.rate),
            taxableAmount: toSafeNumber(g.quantity) * toSafeNumber(g.rate)
        }))
      };
      const res = await axios.put(`${API_URL}/api/sales/${editId}`, payload);
      if (res.data.success) { showMsg("Updated!"); setEditId(null); fetchSales(); }
    } catch { showMsg("Update failed.", "error"); } 
    finally { setLoading(false); }
  };

  const startEdit = (sale) => {
    if (!isAuthorized) return showMsg("Unauthorized", "warning");
    setEditId(sale._id);
    setFreightMode(toSafeNumber(sale.freight) < 0 ? "-" : "+"); 
    setEditData({
      ...sale,
      goods: sale.goods ? [...sale.goods] : [],
      freight: Math.abs(toSafeNumber(sale.freight)),
      cashDiscount: toSafeNumber(sale.cashDiscount),
      amountReceived: toSafeNumber(sale.amountReceived),
      remarks: sale.remarks || "",
    });
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
            <input placeholder="Search bill/customer..." className="pl-4 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold outline-none w-64" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-xl text-[10px] font-black uppercase outline-none">
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
                <th className="px-6 py-5">Record Details</th>
                <th className="px-6 py-5">Customer & Remarks</th>
                <th className="px-6 py-5">Items (Qty @ Rate)</th>
                <th className="px-6 py-5">Financials (Fr/CD)</th>
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
                        {/* Column 1: Basic Info */}
                        <div className="space-y-3 bg-white dark:bg-zinc-800 p-4 rounded-2xl border">
                          <label className="text-[10px] font-black text-emerald-600 uppercase">1. General Info</label>
                          <input type="date" className="w-full border rounded-lg p-2 text-xs" value={editData.date?.split('T')[0] || ""} onChange={(e) => setEditData({ ...editData, date: e.target.value })} />
                          <div className="grid grid-cols-2 gap-2">
                            <input placeholder="Bill #" className="border rounded-lg p-2 text-xs" value={editData.billNo} onChange={(e) => setEditData({ ...editData, billNo: e.target.value })} />
                            <input placeholder="Vehicle" className="border rounded-lg p-2 text-xs" value={editData.vehicleNo} onChange={(e) => setEditData({ ...editData, vehicleNo: e.target.value })} />
                          </div>
                          <input placeholder="Customer Name" className="w-full border rounded-lg p-2 text-xs font-bold" value={editData.customerName} onChange={(e) => setEditData({ ...editData, customerName: e.target.value })} />
                          <textarea placeholder="Remarks..." className="w-full border rounded-lg p-2 text-xs" rows="2" value={editData.remarks} onChange={(e) => setEditData({...editData, remarks: e.target.value})} />
                        </div>

                        {/* Column 2: Goods */}
                        <div className="space-y-3 bg-white dark:bg-zinc-800 p-4 rounded-2xl border">
                          <label className="text-[10px] font-black text-emerald-600 uppercase">2. Goods Details</label>
                          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                            {editData.goods.map((g, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-xl border">
                                <span className="text-[10px] font-bold w-24 truncate">{g.product}</span>
                                <input type="number" className="w-full p-1.5 text-xs rounded border" value={g.quantity} onChange={(e) => handleGoodsChange(idx, 'quantity', e.target.value)} />
                                <span className="text-zinc-400">@</span>
                                <input type="number" className="w-full p-1.5 text-xs rounded border" value={g.rate} onChange={(e) => handleGoodsChange(idx, 'rate', e.target.value)} />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Column 3: Finance & Save */}
                        <div className="space-y-4 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-100">
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-[9px] font-black uppercase">Freight (±)</label>
                                <div className="flex gap-1 mt-1">
                                  <button onClick={() => setFreightMode(p => p === "+" ? "-" : "+")} className={`w-8 rounded font-bold text-white ${freightMode === "+" ? 'bg-emerald-500' : 'bg-red-500'}`}>{freightMode}</button>
                                  <input type="number" className="w-full p-1.5 text-xs rounded border" value={editData.freight} onChange={(e) => setEditData({ ...editData, freight: e.target.value })} />
                                </div>
                              </div>
                              <div>
                                <label className="text-[9px] font-black uppercase">CD (%)</label>
                                <input type="number" className="w-full mt-1 p-1.5 text-xs rounded border" value={editData.cashDiscount} onChange={(e) => setEditData({ ...editData, cashDiscount: e.target.value })} />
                              </div>
                           </div>
                           <div>
                              <label className="text-[9px] font-black uppercase text-emerald-700">Amount Received</label>
                              <input type="number" className="w-full mt-1 p-2 text-sm font-black text-emerald-600 rounded-lg border-2 border-emerald-200" value={editData.amountReceived} onChange={(e) => setEditData({ ...editData, amountReceived: e.target.value })} />
                           </div>
                           <div className="flex justify-between items-center border-t border-emerald-200 pt-2">
                              <div className="text-xs font-bold text-red-500">Due: ₹{editData.paymentDue?.toLocaleString()}</div>
                              <div className="text-xl font-black text-zinc-900 tracking-tighter">Total: ₹{editData.totalAmount?.toLocaleString()}</div>
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
                        <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest"><Truck size={10} className="inline mr-1"/> {sale.vehicleNo || "DIRECT"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-black text-zinc-700 dark:text-zinc-200 uppercase mb-1.5 italic">{sale.customerName}</div>
                        {sale.remarks ? (
                          <div className="flex items-start gap-1.5 text-[10px] bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg text-zinc-500 border max-w-[200px]">
                            <MessageSquare size={12} className="shrink-0 text-emerald-500 mt-0.5" />
                            <span className="leading-tight">{sale.remarks}</span>
                          </div>
                        ) : (
                          <span className="text-[9px] text-zinc-300 font-bold italic uppercase tracking-widest">No Remarks</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          {sale.goods?.map((g, i) => (
                            <div key={i} className="text-[11px] font-bold text-zinc-500 flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-emerald-400"/>
                              <span className="text-emerald-600">{g.quantity}kg</span> @ ₹{g.rate} <span className="opacity-40 lowercase">({g.product})</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[10px] font-black text-zinc-400">
                        FR: <span className={sale.freight < 0 ? "text-red-400" : "text-emerald-500"}>₹{Math.abs(sale.freight)}</span><br/>
                        CD: <span className="text-blue-500">{sale.cashDiscount}%</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-base font-black text-zinc-900 dark:text-white tracking-tighter">₹{toSafeNumber(sale.totalAmount).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[9px] font-black uppercase text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full w-max mb-1">Rec: ₹{toSafeNumber(sale.amountReceived).toLocaleString()}</div>
                        <div className={`text-[12px] font-black italic ${toSafeNumber(sale.paymentDue) > 0 ? 'text-red-500 underline underline-offset-4 decoration-red-100' : 'text-emerald-600'}`}>
                          Due: ₹{toSafeNumber(sale.paymentDue).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => startEdit(sale)} className="p-2.5 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-emerald-500 rounded-xl border"><Edit3 size={16}/></button>
                          <button onClick={() => handleDelete(sale._id)} className="p-2.5 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-red-500 rounded-xl border"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 border-t flex justify-between items-center">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Showing {currentRows.length} of {processedList.length}</span>
          <div className="flex items-center gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 bg-white dark:bg-zinc-800 border rounded-xl disabled:opacity-30"><ChevronLeft size={16}/></button>
            <div className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/20 tracking-widest">Page {currentPage} of {totalPages || 1}</div>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 bg-white dark:bg-zinc-800 border rounded-xl disabled:opacity-30"><ChevronRight size={16}/></button>
          </div>
        </div>
      </div>

      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />
    </div> 
  );
};

export default SalesTable;