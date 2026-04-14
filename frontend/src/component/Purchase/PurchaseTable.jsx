import React, { useState, useEffect, useCallback } from 'react';
import { getAllPurchases, updatePurchase, deletePurchase } from "../../api/purchaseApi";
import { 
  Search, Trash2, Edit3, Check, X, 
  ChevronLeft, ChevronRight, Calendar, Truck, ShoppingCart, MessageSquare 
} from "lucide-react";
import Loader from '../Core_Component/Loader/Loader';
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const toSafeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const PurchaseTable = ({ user }) => {
  const userRole = user?.role?.toUpperCase();
  const isAuthorized = userRole === "ADMIN" || userRole === "ACCOUNTANT" || userRole === "MANAGER";

  const [purchaseData, setPurchaseData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null); 
  const [editData, setEditData] = useState({}); 
  const [currentPage, setCurrentPage] = useState(1);
  const [travelMode, setTravelMode] = useState("-"); 
  const rowsPerPage = 10;

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const showMsg = (msg, type = "success") => setSnackbar({ open: true, message: msg, severity: type });

  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllPurchases();
      if (res.data?.success) {
        setPurchaseData(res.data.data);
      }
    } catch (err) {
      showMsg("Data load karne mein fail", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);

  // 🧮 Live Calculation for Edit (Backend Keys mapping: grandTotal, balanceDue)
  useEffect(() => {
    if (editId) {
      const qty = toSafeNumber(editData.quantity);
      const rate = toSafeNumber(editData.rate);
      const travel = toSafeNumber(editData.travelingCost);
      const cdPercent = toSafeNumber(editData.cashDiscount);
      const paid = toSafeNumber(editData.amountPaid);

      const basePrice = qty * rate;
      const discountAmount = (basePrice * cdPercent) / 100;
      const travelEffect = travelMode === "+" ? travel : -travel;

      const total = Math.round(basePrice - discountAmount + travelEffect); 
      const balance = Math.round(total - paid);

      if (editData.grandTotal !== total || editData.balanceDue !== balance) {
        setEditData(prev => ({ ...prev, grandTotal: total, balanceDue: balance }));
      }
    }
  }, [editData.quantity, editData.rate, editData.cashDiscount, editData.amountPaid, editData.travelingCost, travelMode, editId, editData.grandTotal, editData.balanceDue]);

  const startEdit = (item) => {
    if (!isAuthorized) return showMsg("Permission Denied", "warning");
    setEditId(item._id);
    setTravelMode(item.logistics?.travelMode || "-"); 
    
    // Flattening items for easy editing (taking 1st item as per your simple form)
    const firstItem = item.items?.[0] || {};
    setEditData({ 
      ...item, 
      quantity: firstItem.quantity || 0,
      rate: firstItem.rate || 0,
      productName: firstItem.productName || "",
      travelingCost: item.logistics?.freight || 0,
      cashDiscount: item.discount || 0
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const payload = { 
        ...editData, 
        logistics: {
           vehicleNo: editData.vehicleNo,
           freight: toSafeNumber(editData.travelingCost),
           travelMode: travelMode
        },
        items: [{
           productId: editData.items?.[0]?.productId,
           productName: editData.productName,
           quantity: toSafeNumber(editData.quantity),
           rate: toSafeNumber(editData.rate),
           taxableAmount: toSafeNumber(editData.quantity) * toSafeNumber(editData.rate),
           unit: "KG"
        }],
        performedBy: user?._id 
      };
      
      const res = await updatePurchase(editId, payload);
      if (res.data.success) {
        showMsg("✅ Update Successful!");
        setEditId(null);
        fetchPurchases();
      }
    } catch (err) {
      showMsg("Update Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (userRole !== "ADMIN") return showMsg("Only ADMIN can delete!", "error");
    if (!window.confirm("क्या आप इस रिकॉर्ड को डिलीट करना चाहते हैं?")) return;

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
    String(item.items?.[0]?.productName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(item.supplierName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(item.billNo || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentRows = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-6 font-sans">
      <div className="max-w-screen-2xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* Toolbar Header */}
        <div className="p-6 border-b dark:border-zinc-800 flex flex-wrap justify-between items-center gap-4 text-white">
          <h2 className="text-xl font-black text-zinc-800 dark:text-zinc-100 flex gap-2 items-center tracking-tighter uppercase">
            <ShoppingCart className="text-emerald-500" /> Purchase Ledger
          </h2>
          <div className="relative group flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              placeholder="Search Supplier, Product or Bill..." 
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
                <th className="px-6 py-5">Disc / Travel</th>
                <th className="px-6 py-5">Grand Total</th>
                <th className="px-6 py-5">Paid / Balance</th>
                <th className="px-6 py-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
              {currentRows.map((item) => (
                <tr key={item._id} className={`${editId === item._id ? 'bg-emerald-50/20 dark:bg-emerald-900/10' : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20'} transition-all`}>
                  {editId === item._id ? (
                    <td colSpan="8" className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-top-2">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-emerald-600 uppercase">Basic Info</label>
                          <input type="date" className="edit-input-zinc" value={editData.purchaseDate?.split('T')[0]} onChange={e => setEditData({...editData, purchaseDate: e.target.value})} />
                          <input className="edit-input-zinc" value={editData.billNo} placeholder="Bill No" onChange={e => setEditData({...editData, billNo: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-emerald-600 uppercase">Details</label>
                          <input className="edit-input-zinc font-bold" value={editData.supplierName} readOnly />
                          <input className="edit-input-zinc" value={editData.productName} onChange={e => setEditData({...editData, productName: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-emerald-600 uppercase">Numbers</label>
                          <div className="flex gap-2">
                            <input type="number" className="edit-input-zinc" placeholder="Qty" value={editData.quantity} onChange={e => setEditData({...editData, quantity: e.target.value})} />
                            <input type="number" className="edit-input-zinc" placeholder="Rate" value={editData.rate} onChange={e => setEditData({...editData, rate: e.target.value})} />
                          </div>
                          <input type="number" className="edit-input-zinc" placeholder="Amount Paid" value={editData.amountPaid} onChange={e => setEditData({...editData, amountPaid: e.target.value})} />
                        </div>
                        <div className="flex flex-col justify-between items-end bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border dark:border-zinc-800">
                          <div className="text-right">
                            <div className="text-[10px] font-black text-zinc-400 uppercase">Balance Due</div>
                            <div className={`text-xl font-black ${editData.balanceDue > 0 ? 'text-red-500' : 'text-emerald-500'} tracking-tighter`}>₹{editData.balanceDue?.toLocaleString()}</div>
                          </div>
                          <div className="flex gap-2 w-full mt-4">
                            <button className="flex-1 py-2 bg-emerald-600 text-white rounded-xl shadow-lg font-bold" onClick={handleSave}><Check size={16} className="inline mr-1"/> Update</button>
                            <button className="p-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-500 rounded-xl" onClick={() => setEditId(null)}><X size={18}/></button>
                          </div>
                        </div>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-bold text-zinc-500 flex items-center gap-1.5"><Calendar size={14} className="text-emerald-500" /> {(item.purchaseDate || item.date)?.split('T')[0]}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-zinc-800 dark:text-zinc-100">{item.billNo || "N/A"}</span>
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter italic"><Truck size={10} className="inline mr-1"/>{item.logistics?.vehicleNo || "DIRECT"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-black text-zinc-700 dark:text-zinc-200 uppercase">{item.supplierName}</span>
                          {item.remarks && (
                            <div className="flex items-center gap-1 text-[9px] text-zinc-400 italic">
                              <MessageSquare size={10} /> <span className="truncate max-w-[150px]">{item.remarks}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                          <span className="text-emerald-600">{item.items?.[0]?.quantity || 0}</span> @ ₹{item.items?.[0]?.rate || 0}
                          <div className="text-[9px] text-zinc-400 uppercase font-black">{item.items?.[0]?.productName}</div>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[10px] font-black text-zinc-400 uppercase">
                          Disc: <span className="text-emerald-500">{item.discount || 0}</span><br/>
                          FR: <span className="text-red-400">₹{item.logistics?.freight || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-zinc-900 dark:text-white tracking-tighter">₹{toSafeNumber(item.grandTotal).toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="text-[9px] font-black uppercase text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full w-max">Paid: ₹{item.amountPaid?.toLocaleString()}</div>
                          <div className={`text-[12px] font-black ${toSafeNumber(item.balanceDue) > 0 ? 'text-red-500 underline' : 'text-emerald-600'}`}>
                            Bal: ₹{toSafeNumber(item.balanceDue).toLocaleString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => startEdit(item)} className="p-2.5 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-emerald-500 rounded-xl border dark:border-zinc-700"><Edit3 size={15}/></button>
                          <button onClick={() => handleDelete(item._id)} className="p-2.5 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-red-500 rounded-xl border dark:border-zinc-700"><Trash2 size={15}/></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination etc... code remains same */}
      </div>
      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />
    </div>
  );
};

export default PurchaseTable;