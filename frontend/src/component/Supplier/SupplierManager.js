import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { 
  Search, Plus, List, Save, Edit3, Trash2, 
  Truck, Phone, MapPin, Wallet, CreditCard, User
} from "lucide-react";
import Loader from '../Core_Component/Loader/Loader';
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const SupplierManager = ({ user }) => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  
  // Initial Form State
  const initialFormState = {
    name: "", 
    street: "", // Backend 'address.street' ke liye
    phone: "", 
    gstin: "",
    openingBalance: 0, 
    city: "Samastipur", 
    partyType: "SUPPLIER"
  };

  const [formData, setFormData] = useState(initialFormState);
  const [editId, setEditId] = useState(null);

  const getAuthHeader = useCallback(() => {
    const token = user?.token || JSON.parse(localStorage.getItem("userInfo"))?.token;
    return { headers: { Authorization: `Bearer ${token}` } };
  }, [user]);

  const showMsg = (msg, sev = "success") => setSnackbar({ open: true, message: msg, severity: sev });

  const fetchSuppliers = useCallback(async () => {
    const token = user?.token || JSON.parse(localStorage.getItem("userInfo"))?.token;
    if (!token) return;

    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/parties?type=SUPPLIER`, getAuthHeader());
      const result = response.data.data || response.data;
      setSuppliers(Array.isArray(result) ? result : []);
    } catch (error) {
      showMsg("सप्लायर लिस्ट लोड नहीं हो पाई", "error");
    } finally { setLoading(false); }
  }, [user, getAuthHeader]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  // Handle Create / Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return showMsg("Supplier name is required", "error");
    
    setLoading(true);
    // Data mapping as per your new Controller logic
    const submissionData = { 
        ...formData, 
        name: formData.name.toUpperCase(),
        gstin: formData.gstin.toUpperCase(),
        openingBalance: Number(formData.openingBalance) || 0,
        address: formData.street, // Controller 'address' ko 'street' mein map karta hai
        city: formData.city || "Samastipur"
    };

    try {
      if (editId) {
        await axios.put(`${API_BASE_URL}/api/parties/${editId}`, submissionData, getAuthHeader());
        showMsg("Supplier updated successfully!");
      } else {
        await axios.post(`${API_BASE_URL}/api/parties`, submissionData, getAuthHeader());
        showMsg("Supplier saved successfully!");
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
        await axios.delete(`${API_BASE_URL}/api/parties/${id}`, getAuthHeader());
        setSuppliers(prev => prev.filter(s => s._id !== id));
        showMsg("सप्लायर हटा दिया गया", "info");
      } catch (error) { 
        showMsg(error.response?.data?.message || "डिलीट फेल हो गया", "error"); 
      } finally { setLoading(false); }
    }
  };

  const handleEdit = (s) => {
    setEditId(s._id);
    setFormData({
      name: s.name, 
      street: s.address?.street || "", // Nested se nikal kar flat state mein
      phone: s.phone || "", 
      gstin: s.gstin || "",
      openingBalance: s.openingBalance || 0,
      city: s.address?.city || s.city || "Samastipur",
      partyType: "SUPPLIER"
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setEditId(null);
    setShowForm(false);
  };

  const filteredSuppliers = suppliers.filter((s) => {
    const search = searchTerm.toLowerCase();
    return (
      s.name?.toLowerCase().includes(search) ||
      s.gstin?.toLowerCase().includes(search) ||
      s.phone?.includes(search)
    );
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-6 font-sans">
      {loading && suppliers.length === 0 && <Loader />}
      
      <div className="max-w-7xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b dark:border-zinc-800 flex flex-wrap justify-between items-center gap-4 bg-zinc-50/50 dark:bg-zinc-800/20">
          <div>
            <h2 className="text-xl font-black text-zinc-800 dark:text-zinc-100 flex gap-2 items-center tracking-tighter uppercase">
              <Truck className="text-emerald-500" /> Supplier Control
            </h2>
            <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Vendor Management • {suppliers.length} Records</p>
          </div>
          
          <div className="flex items-center gap-3">
            {!showForm && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input 
                  placeholder="Search vendor..." 
                  className="pl-10 pr-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/50 w-48 sm:w-64 text-zinc-800 dark:text-zinc-200"
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
              {showForm ? <><List size={16}/> View List</> : <><Plus size={16}/> Add Vendor</>}
            </button>
          </div>
        </div>

        {showForm ? (
          <form className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-top-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <label className="label-style"><User size={12}/> Company Name</label>
                <input placeholder="Ex: Dharashakti Agro" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="form-input-zinc" required />
              </div>
              <div className="space-y-1.5">
                <label className="label-style"><CreditCard size={12}/> GSTIN</label>
                <input placeholder="GST No." value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value})} className="form-input-zinc" />
              </div>
              <div className="space-y-1.5">
                <label className="label-style"><Phone size={12}/> Phone</label>
                <input placeholder="Mobile Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="form-input-zinc" />
              </div>
              <div className="space-y-1.5">
                <label className="label-style"><MapPin size={12}/> City / Location</label>
                <input placeholder="City Name" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="form-input-zinc" />
              </div>
              <div className="space-y-1.5 lg:col-span-2">
                <label className="label-style"><MapPin size={12}/> Street Address</label>
                <input placeholder="Street / Village" value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} className="form-input-zinc" />
              </div>
              <div className="space-y-1.5 lg:col-span-2">
                <label className="label-style"><Wallet size={12}/> Opening Balance (₹)</label>
                <input type="number" value={formData.openingBalance} onChange={e => setFormData({...formData, openingBalance: e.target.value})} className="form-input-zinc font-black text-emerald-600" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t dark:border-zinc-800">
              <button type="button" className="px-8 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all" onClick={resetForm}>Discard</button>
              <button type="submit" className="px-12 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2" disabled={loading}>
                <Save size={16}/> {loading ? "Saving..." : (editId ? "Update Vendor" : "Add Vendor")}
              </button>
            </div>
          </form>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] border-b dark:border-zinc-800">
                  <th className="px-6 py-5">Supplier Profile</th>
                  <th className="px-6 py-5">GSTIN Identification</th>
                  <th className="px-6 py-5">Location</th>
                  <th className="px-6 py-5 text-right">Current Balance</th>
                  <th className="px-6 py-5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
                {filteredSuppliers.length > 0 ? (
                  filteredSuppliers.map((s) => (
                    <tr key={s._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-all">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[13px] font-black text-zinc-800 dark:text-zinc-100 uppercase italic tracking-tighter">{s.name}</span>
                          <span className="text-[10px] text-zinc-400 font-bold flex items-center gap-1"><Phone size={10}/> {s.phone || "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[11px] font-black text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg border dark:border-zinc-700">{s.gstin || "UNREGISTERED"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                          <MapPin size={12} className="text-emerald-500" />
                          <span className="text-[11px] font-bold">{s.address?.city || s.city || "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-sm font-black tracking-tighter ${s.currentBalance > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                          ₹{Number(s.currentBalance || 0).toLocaleString('en-IN')}
                        </span>
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
                    <td colSpan="5" className="px-6 py-12 text-center text-zinc-400 italic text-sm">No suppliers found in registry.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />
      
      <style>{`
        .label-style { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #71717a; margin-bottom: 4px; display: flex; align-items: center; gap: 4px; }
        .form-input-zinc { width: 100%; background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 1rem; padding: 0.75rem 1rem; font-size: 0.875rem; outline: none; transition: all 0.2s; font-weight: 600; }
        .dark .form-input-zinc { background: #18181b; border-color: #27272a; color: #f4f4f5; }
        .form-input-zinc:focus { border-color: #10b981; background: #fff; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1); }
      `}</style>
    </div>
  );
};

export default SupplierManager;