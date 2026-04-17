import React, { useState, useEffect, useCallback } from "react";
import { getAllSales, deleteSale, getInvoicePDF } from "../../api/saleApi"; 
import { 
  Search, Trash2, Edit3, Receipt, Calendar, 
  Truck, MessageSquare, Printer, ChevronLeft, ChevronRight 
} from "lucide-react";
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const toSafeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const SalesTable = ({ user, onEdit }) => {
  const userRole = user?.role?.toUpperCase(); 
  const isAdmin = userRole === "ADMIN";

  const [salesList, setSalesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const showMsg = (msg, type = "success") => setSnackbar({ open: true, message: msg, severity: type });

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllSales(); 
      if (res.data.success) setSalesList(res.data.data);
    } catch (err) { 
      showMsg("Server connection error.", "error"); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { fetchSales(); }, [fetchSales]);

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

  const handleDelete = async (id) => {
    if (!isAdmin) return showMsg("Permission denied. Only ADMIN can delete.", "error");
    if (!window.confirm("क्या आप इस सेल रिकॉर्ड को डिलीट करना चाहते हैं? इससे इन्वेंट्री भी सिंक होगी।")) return;
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

  const filteredList = salesList.filter((s) => {
    const term = search.toLowerCase();
    return (
      String(s.customerName || "").toLowerCase().includes(term) ||
      String(s.billNo || "").toLowerCase().includes(term) ||
      String(s.logistics?.vehicleNo || "").toLowerCase().includes(term)
    );
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const currentRows = filteredList.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalPages = Math.ceil(filteredList.length / rowsPerPage);

  if (loading) return <Loader />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* Toolbar Header */}
        <div className="p-8 border-b dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl">
              <Receipt className="text-emerald-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-tighter">Sales History</h2>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Track your out-bound inventory</p>
            </div>
          </div>

          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input 
              placeholder="Search Bill, Customer, Vehicle..." 
              className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-emerald-500/50 rounded-2xl text-xs font-bold outline-none transition-all dark:text-white"
              value={search} 
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        {/* Unified Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-800/30 text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] border-b dark:border-zinc-800">
                <th className="px-8 py-6">Date & Bill No</th>
                <th className="px-8 py-6">Customer & Logistics</th>
                <th className="px-8 py-6">Items Detail</th>
                <th className="px-8 py-6">Summary</th>
                <th className="px-8 py-6">Status & Due</th>
                <th className="px-8 py-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {currentRows.map((sale) => (
                <tr key={sale._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-black text-zinc-800 dark:text-zinc-100 tracking-tighter">{sale.billNo}</span>
                      <span className="text-[10px] font-bold text-zinc-400 flex items-center gap-1">
                        <Calendar size={12} className="text-emerald-500" /> {new Date(sale.date).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-zinc-700 dark:text-zinc-200 uppercase">{sale.customerName}</span>
                      <span className="text-[9px] font-bold text-zinc-400 flex items-center gap-1 uppercase tracking-tighter italic">
                        <Truck size={10} /> {sale.logistics?.vehicleNo || "Direct"}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      {sale.goods?.map((g, i) => (
                        <div key={i} className="flex flex-col">
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase">{g.productName}</span>
                          <span className="text-[10px] font-bold text-zinc-400">{g.quantity} {g.unit} @ ₹{g.rate}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-zinc-900 dark:text-white tracking-tighter">₹{toSafeNumber(sale.grandTotal).toLocaleString()}</span>
                      <span className="text-[9px] font-black text-zinc-400 uppercase">GST: {sale.gstType}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1.5">
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-md w-fit uppercase tracking-widest ${
                        toSafeNumber(sale.balanceDue) <= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                      }`}>
                        {toSafeNumber(sale.balanceDue) <= 0 ? 'PAID' : 'DUE'}
                      </span>
                      <span className={`text-xs font-black tracking-tight ${toSafeNumber(sale.balanceDue) > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                        ₹{toSafeNumber(sale.balanceDue).toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handlePrint(sale._id)} className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-blue-500 rounded-2xl transition-all hover:shadow-lg"><Printer size={16}/></button>
                      <button onClick={() => onEdit(sale)} className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-emerald-500 rounded-2xl transition-all hover:shadow-lg"><Edit3 size={16}/></button>
                      <button onClick={() => handleDelete(sale._id)} className="p-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 hover:text-rose-500 rounded-2xl transition-all hover:shadow-lg"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-8 bg-zinc-50/50 dark:bg-zinc-800/30 flex justify-between items-center border-t dark:border-zinc-800">
           <p className="text-xs font-bold text-zinc-400 italic">Showing {currentRows.length} of {filteredList.length} invoices</p>
           <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-xl disabled:opacity-30"><ChevronLeft size={18}/></button>
              <div className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center">Page {currentPage} of {totalPages || 1}</div>
              <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 bg-white dark:bg-zinc-900 border dark:border-zinc-700 rounded-xl disabled:opacity-30"><ChevronRight size={18}/></button>
           </div>
        </div>
      </div>

      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />
    </div> 
  );
};

export default SalesTable;