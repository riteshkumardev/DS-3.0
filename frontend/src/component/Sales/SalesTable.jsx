import React, { useState, useEffect, useCallback } from "react";
import "./Sales.css";
// Modular API imports
import { getAllSales, deleteSale, getInvoicePDF } from "../../api/saleApi"; 
import axios from "axios"; // Still used for the PUT request until updateSale is added to API
import { 
  Search, Trash2, Edit3, Check, X, 
  ChevronLeft, ChevronRight, Receipt, Calendar, Truck, MessageSquare, Printer 
} from "lucide-react";
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const toSafeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const SalesTable = ({ user }) => {
  const role = user?.role;
  const isAuthorized = role === "Admin" || role === "Accountant";

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

  // Handle Printing
  const handlePrint = async (id) => {
    try {
      const res = await getInvoicePDF(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      showMsg("Failed to generate PDF", "error");
    }
  };

  /* =========================
      🧮 Live Calculation for Edit
     ========================= */
  useEffect(() => {
    if (!editId || !editData.goods) return;

    const totalTaxable = editData.goods.reduce((sum, item) => {
        return sum + (toSafeNumber(item.quantity) * toSafeNumber(item.rate));
    }, 0);

    const freight = toSafeNumber(editData.logistics?.freight || editData.freight);
    const discAmount = toSafeNumber(editData.discount);
    const received = toSafeNumber(editData.amountPaid);
    
    const finalTotal = freightMode === "+" 
        ? (totalTaxable + freight - discAmount) 
        : (totalTaxable - freight - discAmount);
        
    const due = finalTotal - received;

    setEditData((prev) => ({
        ...prev,
        subTotal: totalTaxable,
        grandTotal: finalTotal,
        balanceDue: due,
    }));
  }, [editId, editData.goods, editData.discount, editData.amountPaid, freightMode, editData.freight]);

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
        String(s.logistics?.vehicleNo || "").toLowerCase().includes(term);
      const matchesProduct = selectedProduct === "All" || (s.goods && s.goods.some(g => g.productName === selectedProduct));
      return matchesSearch && matchesProduct;
    });

    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const processedList = getProcessedList();
  const currentRows = processedList.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalPages = Math.ceil(processedList.length / rowsPerPage);

  const handleDelete = async (id) => {
    if (!isAuthorized) return showMsg("Permission denied.", "error");
    if (!window.confirm("Are you sure?")) return;
    try {
      setLoading(true);
      const res = await deleteSale(id);
      if (res.data.success) { 
        showMsg("Deleted!"); 
        fetchSales(); 
      }
    } catch { 
      showMsg("Delete failed.", "error"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await axios.put(`${process.env.REACT_APP_API_URL}/api/sales/${editId}`, editData);
      if (res.data.success) { 
        showMsg("Updated!"); 
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
    if (!isAuthorized) return showMsg("Unauthorized", "warning");
    setEditId(sale._id);
    setFreightMode(toSafeNumber(sale.logistics?.freight) < 0 ? "-" : "+"); 
    setEditData({ ...sale });
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-6 font-sans">
      <div className="max-w-screen-2xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex flex-wrap justify-between items-center gap-4">
          <h2 className="text-xl font-black text-zinc-800 dark:text-zinc-100 uppercase flex items-center gap-2 tracking-tighter">
            <Receipt className="text-emerald-600" /> Sales Ledger
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-zinc-400" size={14}/>
                <input placeholder="Search..." className="pl-9 pr-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold outline-none w-64" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-xl text-[10px] font-black uppercase outline-none">
                <option value="All">All Products</option>
                <option value="Corn Grit">Corn Grit</option>
                <option value="Cattle Feed">Cattle Feed</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1300px]">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] border-b">
                <th className="px-6 py-5">Record Details</th>
                <th className="px-6 py-5">Customer</th>
                <th className="px-6 py-5">Items</th>
                <th className="px-6 py-5">Financials</th>
                <th className="px-6 py-5">Grand Total</th>
                <th className="px-6 py-5">Due Status</th>
                <th className="px-6 py-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
              {currentRows.map((sale) => (
                <tr key={sale._id} className={`${editId === sale._id ? 'bg-emerald-50/20 dark:bg-emerald-900/10' : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20'}`}>
                  {editId === sale._id ? (
                    <td colSpan="7" className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                           <div className="space-y-3 bg-white dark:bg-zinc-800 p-4 rounded-2xl border">
                             <label className="text-[10px] font-black text-emerald-600">1. BASIC INFO</label>
                             <input type="date" className="w-full border rounded-lg p-2 text-xs" value={editData.date?.split('T')[0]} onChange={(e) => setEditData({ ...editData, date: e.target.value })} />
                             <input placeholder="Customer" className="w-full border rounded-lg p-2 text-xs font-bold" value={editData.customerName} onChange={(e) => setEditData({ ...editData, customerName: e.target.value })} />
                           </div>

                           <div className="space-y-3 bg-white dark:bg-zinc-800 p-4 rounded-2xl border">
                             <label className="text-[10px] font-black text-emerald-600">2. ITEMS</label>
                             {editData.goods?.map((g, idx) => (
                               <div key={idx} className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-xl border">
                                 <span className="text-[10px] font-bold w-24">{g.productName}</span>
                                 <input type="number" className="w-full p-1 text-xs rounded border" value={g.quantity} onChange={(e) => handleGoodsChange(idx, 'quantity', e.target.value)} />
                                 <input type="number" className="w-full p-1 text-xs rounded border" value={g.rate} onChange={(e) => handleGoodsChange(idx, 'rate', e.target.value)} />
                               </div>
                             ))}
                           </div>

                           <div className="space-y-4 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-100">
                              <div className="flex justify-between items-center pt-2">
                                <div className="text-xs font-bold text-red-500">Due: ₹{editData.balanceDue?.toLocaleString()}</div>
                                <div className="text-xl font-black text-zinc-900">₹{editData.grandTotal?.toLocaleString()}</div>
                              </div>
                              <div className="flex gap-2">
                                <button className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black" onClick={handleSave}>SAVE</button>
                                <button className="px-4 py-3 bg-zinc-200 rounded-xl" onClick={() => setEditId(null)}><X size={16}/></button>
                              </div>
                           </div>
                        </div>
                    </td>
                  ) : (
                    <>
                      <td className="px-6 py-4">
                        <div className="text-[11px] font-bold text-zinc-400 mb-1">{sale.date?.split('T')[0]}</div>
                        <div className="text-sm font-black text-zinc-800 flex items-center gap-1"><Receipt size={12} className="text-emerald-500"/> {sale.billNo}</div>
                        <div className="text-[10px] text-zinc-400 font-bold uppercase"><Truck size={10} className="inline mr-1"/> {sale.logistics?.vehicleNo || "N/A"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-black text-zinc-700 uppercase italic">{sale.customerName}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {sale.goods?.map((g, i) => (
                            <div key={i} className="text-[11px] font-bold text-zinc-500">
                              <span className="text-emerald-600">{g.quantity} {g.unit}</span> @ ₹{g.rate} <span className="opacity-50">({g.productName})</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[10px] font-black text-zinc-400">
                        FR: <span className="text-emerald-500">₹{sale.logistics?.freight || 0}</span><br/>
                        GST: <span className="text-blue-500">{sale.gstType}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-base font-black text-zinc-900 tracking-tighter">₹{toSafeNumber(sale.grandTotal).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full w-max mb-1">Paid: ₹{toSafeNumber(sale.amountPaid).toLocaleString()}</div>
                        <div className={`text-[12px] font-black ${toSafeNumber(sale.balanceDue) > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                          Due: ₹{toSafeNumber(sale.balanceDue).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handlePrint(sale._id)} className="p-2.5 bg-zinc-50 text-zinc-400 hover:text-blue-500 rounded-xl border"><Printer size={16}/></button>
                          <button onClick={() => startEdit(sale)} className="p-2.5 bg-zinc-50 text-zinc-400 hover:text-emerald-500 rounded-xl border"><Edit3 size={16}/></button>
                          <button onClick={() => handleDelete(sale._id)} className="p-2.5 bg-zinc-50 text-zinc-400 hover:text-red-500 rounded-xl border"><Trash2 size={16}/></button>
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
        <div className="p-6 bg-zinc-50 border-t flex justify-between items-center">
          <span className="text-[10px] font-black text-zinc-400 uppercase">Total Records: {processedList.length}</span>
          <div className="flex items-center gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 bg-white border rounded-xl disabled:opacity-30"><ChevronLeft size={16}/></button>
            <div className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black">Page {currentPage} of {totalPages || 1}</div>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 bg-white border rounded-xl disabled:opacity-30"><ChevronRight size={16}/></button>
          </div>
        </div>
      </div>
      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />
    </div> 
  );
};

export default SalesTable;