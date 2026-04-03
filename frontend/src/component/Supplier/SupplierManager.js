import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Search, Plus, List, Save, X, Edit3, Trash2, 
  Truck, Phone, MapPin, Receipt, Calendar, Wallet, CreditCard ,User
} from "lucide-react";
import Loader from '../Core_Component/Loader/Loader';
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const SupplierManager = () => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  
  const [formData, setFormData] = useState({
    name: "", address: "", phone: "", gstin: "",
    previousBalance: 0, lastBillNo: "", lastBillDate: ""
  });

  const [editId, setEditId] = useState(null);

  const showMsg = (msg, sev) => setSnackbar({ open: true, message: msg, severity: sev });

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/suppliers/list`);
      if (response.data.success) setSuppliers(response.data.data);
    } catch (error) {
      showMsg("सर्वर से सप्लायर लिस्ट लोड नहीं हो पाई", "error");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const filteredSuppliers = suppliers.filter((s) => {
    const search = searchTerm.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(search)) ||
      (s.gstin && s.gstin.toLowerCase().includes(search)) ||
      (s.phone && s.phone.includes(search))
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return showMsg("Supplier name is required", "error");
    setLoading(true);
    const submissionData = { ...formData, previousBalance: Number(formData.previousBalance) };

    try {
      if (editId) {
        await axios.put(`${API_BASE_URL}/api/suppliers/update/${editId}`, submissionData);
        showMsg("Supplier updated successfully!", "success");
      } else {
        await axios.post(`${API_BASE_URL}/api/suppliers/add`, submissionData);
        showMsg("Supplier saved successfully!", "success");
      }
      resetForm();
      fetchSuppliers();
    } catch (error) {
      showMsg(error.response?.data?.message || "Operation failed", "error");
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("क्या आप वाकई इस सप्लायर को हटाना चाहते हैं?")) {
      setLoading(true);
      try {
        await axios.delete(`${API_BASE_URL}/api/suppliers/delete/${id}`);
        setSuppliers(suppliers.filter(s => s._id !== id));
        showMsg("सप्लायर हटा दिया गया", "info");
      } catch (error) { showMsg("डिलीट फेल हो गया", "error"); } 
      finally { setLoading(false); }
    }
  };

  const handleEdit = (s) => {
    setEditId(s._id);
    setFormData({
      name: s.name, address: s.address || "", phone: s.phone || "", gstin: s.gstin || "",
      previousBalance: s.previousBalance || 0, lastBillNo: s.lastBillNo || "",
      lastBillDate: s.lastBillDate ? s.lastBillDate.substring(0, 10) : ""
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ name: "", address: "", phone: "", gstin: "", previousBalance: 0, lastBillNo: "", lastBillDate: "" });
    setEditId(null);
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-6 font-sans">
      {loading && suppliers.length === 0 && <Loader />}
      
      <div className="max-w-7xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* Header Section */}
        <div className="p-6 border-b dark:border-zinc-800 flex flex-wrap justify-between items-center gap-4 bg-zinc-50/50 dark:bg-zinc-800/20">
          <div>
            <h2 className="text-xl font-black text-zinc-800 dark:text-zinc-100 flex gap-2 items-center tracking-tighter uppercase">
              <Truck className="text-emerald-500" /> Supplier Management
            </h2>
            <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Manage vendor contacts and balances</p>
          </div>
          
          <div className="flex items-center gap-3">
            {!showForm && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input 
                  placeholder="Search supplier..." 
                  className="pl-10 pr-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/50 w-48 sm:w-64"
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </div>
            )}
            <button 
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg ${
                showForm ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20"
              }`}
              onClick={() => (showForm ? resetForm() : setShowForm(true))}
            >
              {showForm ? <><List size={16}/> View List</> : <><Plus size={16}/> Add New</>}
            </button>
          </div>
        </div>

        {/* Form View */}
        {showForm ? (
          <form className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-top-4" onSubmit={handleSubmit}>
            <div className="flex items-center gap-3 border-b pb-4 dark:border-zinc-800">
               <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600">
                  <Edit3 size={20} />
               </div>
               <h3 className="text-lg font-black text-zinc-800 dark:text-zinc-200">{editId ? "Update Existing Supplier" : "Register New Supplier"}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><User size={12}/> Name</label>
                <input placeholder="Ex: Rahul Enterprises" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="form-input-zinc" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><CreditCard size={12}/> GSTIN</label>
                <input placeholder="GST No." value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value})} className="form-input-zinc" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><Phone size={12}/> Mobile</label>
                <input placeholder="10 Digit Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="form-input-zinc" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><MapPin size={12}/> Address</label>
                <input placeholder="City, State" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="form-input-zinc" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><Receipt size={12}/> Last Bill No</label>
                <input placeholder="Optional" value={formData.lastBillNo} onChange={e => setFormData({...formData, lastBillNo: e.target.value})} className="form-input-zinc" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={12}/> Last Bill Date</label>
                <input type="date" value={formData.lastBillDate} onChange={e => setFormData({...formData, lastBillDate: e.target.value})} className="form-input-zinc" />
              </div>
              <div className="space-y-1.5 lg:col-span-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5"><Wallet size={12}/> Opening Balance (₹)</label>
                <input type="number" placeholder="0.00" value={formData.previousBalance} onChange={e => setFormData({...formData, previousBalance: e.target.value})} className="form-input-zinc font-black text-emerald-600" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t dark:border-zinc-800">
              <button type="button" className="px-8 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all" onClick={resetForm}>Cancel</button>
              <button type="submit" className="px-12 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2" disabled={loading}>
                <Save size={16}/> {loading ? "Processing..." : (editId ? "Update Supplier" : "Save Supplier")}
              </button>
            </div>
          </form>
        ) : (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] border-b dark:border-zinc-800">
                  <th className="px-6 py-5">Supplier Profile</th>
                  <th className="px-6 py-5">GSTIN Identification</th>
                  <th className="px-6 py-5">Last Transaction</th>
                  <th className="px-6 py-5 text-right">Outstanding Balance</th>
                  <th className="px-6 py-5 text-center">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                {filteredSuppliers.length > 0 ? (
                  filteredSuppliers.map((s) => (
                    <tr key={s._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-all">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-tighter italic">{s.name}</span>
                          <span className="text-[10px] text-zinc-400 font-bold flex items-center gap-1"><Phone size={10}/> {s.phone || "No Mobile"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-black text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border dark:border-zinc-700">{s.gstin || "URD / N/A"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                           <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 tracking-tight">#{s.lastBillNo || "N/A"}</span>
                           <span className="text-[10px] text-zinc-400 flex items-center gap-1"><Calendar size={10}/> {s.lastBillDate ? new Date(s.lastBillDate).toLocaleDateString('en-GB') : "No Date"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-black text-emerald-600 tracking-tighter">₹{Number(s.totalOwed || 0).toLocaleString('en-IN')}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleEdit(s)} className="p-2.5 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-emerald-500 rounded-xl transition-all border border-zinc-100 dark:border-zinc-800"><Edit3 size={16}/></button>
                          <button onClick={() => handleDelete(s._id)} className="p-2.5 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-red-500 rounded-xl transition-all border border-zinc-100 dark:border-zinc-800"><Trash2 size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-zinc-400 italic text-sm">
                       No matching suppliers found. Try searching with different keywords.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />
      
      <style>{`
        .form-input-zinc {
          width: 100%;
          background: #f4f4f5;
          border: 1px solid #e4e4e7;
          border-radius: 1rem;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
        }
        .dark .form-input-zinc {
          background: #18181b;
          border-color: #27272a;
          color: #f4f4f5;
        }
        .form-input-zinc:focus {
          border-color: #10b981;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }
        .dark .form-input-zinc:focus {
          background: #09090b;
        }
      `}</style>
    </div>
  );
};

export default SupplierManager;