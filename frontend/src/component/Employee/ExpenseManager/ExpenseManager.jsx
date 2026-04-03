import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { 
  Landmark, Filter, Printer, Save, Wallet, User, 
  Calendar, Hash, Info, RotateCcw, MoreHorizontal,
  Pencil, Trash2, X, Search
} from "lucide-react";
import Loader from "../../Core_Component/Loader/Loader";
import CustomSnackbar from "../../Core_Component/Snackbar/CustomSnackbar";

const ExpenseManager = ({ user }) => {
    const isAuthorized = user.role === "Admin" || user.role === "Accountant";
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

    const [transactions, setTransactions] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    
    const initialForm = {
        date: new Date().toISOString().split('T')[0],
        partyName: '',
        otherDetail: '',
        type: 'Payment Out',
        amount: '',
        txnId: '',
        remark: ''
    };

    const [formData, setFormData] = useState(initialForm);
    
    // Filtering States
    const [searchQuery, setSearchQuery] = useState('');
    const [filterParty, setFilterParty] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/api/expenses`);
            if (res.data.success) {
                // Sorting by Date (Ascending for balance calculation)
                const sorted = res.data.data.sort((a, b) => new Date(a.date) - new Date(b.date));
                setTransactions(sorted);
                setFilteredData(sorted);
            }
        } catch (err) {
            setSnackbar({ open: true, message: "डेटा लोड करने में विफल!", severity: "error" });
        } finally { setLoading(false); }
    }, [API_URL]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Logic for Search and Filter Combined
    useEffect(() => {
        let temp = [...transactions];

        if (filterParty !== 'All') {
            temp = temp.filter(t => t.partyName === filterParty);
        }

        if (startDate && endDate) {
            temp = temp.filter(t => t.date >= startDate && t.date <= endDate);
        }

        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase();
            temp = temp.filter(t => 
                t.partyName?.toLowerCase().includes(query) || 
                t.remark?.toLowerCase().includes(query) || 
                t.txnId?.toLowerCase().includes(query)
            );
        }

        setFilteredData(temp);
    }, [searchQuery, filterParty, startDate, endDate, transactions]);

    const handlePrint = () => { window.print(); };

    const resetFilters = () => {
        setSearchQuery('');
        setFilterParty('All'); 
        setStartDate(''); 
        setEndDate('');
    };

    const handleEditClick = (txn) => {
        if (!isAuthorized) return;
        setIsEditing(true);
        setEditId(txn._id);
        const categories = ['Loading', 'Unloading', 'Rasan', 'Water', 'Medical', 'CA', 'Electrical', 'Hardware', 'Stationary', 'Construction'];
        const isStandardCategory = categories.includes(txn.partyName);

        setFormData({
            date: txn.date.split('T')[0],
            partyName: isStandardCategory ? txn.partyName : 'Other',
            otherDetail: !isStandardCategory ? txn.partyName : '',
            type: txn.type,
            amount: txn.amount,
            txnId: txn.txnId || '',
            remark: txn.remark || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!isAuthorized) return;
        if (!window.confirm("क्या आप वाकई इस ट्रांजेक्शन को डिलीट करना चाहते हैं?")) return;

        setLoading(true);
        try {
            const res = await axios.delete(`${API_URL}/api/expenses/${id}`);
            if (res.data.success) {
                setSnackbar({ open: true, message: "सफलतापूर्वक हटा दिया गया!", severity: "success" });
                fetchData();
            }
        } catch (err) {
            setSnackbar({ open: true, message: "डिलीट करने में विफल!", severity: "error" });
        } finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthorized) return;
        setLoading(true);
        try {
            const payload = {
                ...formData,
                partyName: formData.partyName === 'Other' ? formData.otherDetail : formData.partyName
            };

            let res;
            if (isEditing) {
                res = await axios.put(`${API_URL}/api/expenses/${editId}`, payload);
            } else {
                res = await axios.post(`${API_URL}/api/expenses`, payload);
            }

            if (res.data.success) {
                setFormData(initialForm);
                setIsEditing(false);
                setEditId(null);
                setSnackbar({ open: true, message: isEditing ? "सफलतापूर्वक अपडेट किया गया!" : "सफलतापूर्वक सहेजा गया!", severity: "success" });
                fetchData();
            }
        } catch (err) {
            setSnackbar({ open: true, message: "त्रुटि!", severity: "error" });
        } finally { setLoading(false); }
    };

    // Calculate Running Balance and Sort for Display
    const dataWithBalance = useMemo(() => {
        let runningBal = 0;
        // 1. Calculate balance on original sorted order (date asc)
        const withBal = transactions.map(txn => {
            const amt = Number(txn.amount) || 0;
            txn.type === 'Payment In' ? runningBal += amt : runningBal -= amt;
            return { ...txn, currentBalance: runningBal };
        });

        // 2. Filter this data
        let result = withBal.filter(item => filteredData.some(f => f._id === item._id));

        // 3. Sort for Display (Latest Date First)
        return result.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [filteredData, transactions]);

    const totals = useMemo(() => {
        const totalIn = filteredData.filter(t => t.type === 'Payment In').reduce((s, c) => s + Number(c.amount || 0), 0);
        const totalOut = filteredData.filter(t => t.type === 'Payment Out').reduce((s, c) => s + Number(c.amount || 0), 0);
        return { totalIn, totalOut, net: totalIn - totalOut };
    }, [filteredData]);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 font-sans">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { size: A4; margin: 1cm; }
                    body * { visibility: hidden !important; }
                    #printable-ledger, #printable-ledger * { visibility: visible !important; }
                    #printable-ledger {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        background: white !important;
                        color: black !important;
                        display: block !important;
                    }
                    .no-print, button, .lucide, footer { display: none !important; }
                    table { width: 100% !important; border-collapse: collapse !important; }
                    th, td { border: 1px solid #ddd !important; padding: 8px !important; color: black !important; }
                }
                .form-input-zinc { 
                    width: 100%; background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 0.75rem; 
                    padding: 0.6rem 0.8rem; font-size: 0.75rem; outline: none; transition: all 0.2s; 
                    font-weight: 700; color: #18181b; 
                }
                .dark .form-input-zinc { background: #18181b; border-color: #27272a; color: #f4f4f5; }
            `}} />

            {loading && <Loader />}
            
            <div className="no-print max-w-7xl mx-auto mb-8">
                <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                    <div className="w-full md:w-auto">
                        <h2 className="text-2xl font-black text-zinc-800 dark:text-zinc-100 flex items-center gap-3 uppercase tracking-tighter">
                            <Landmark className="text-emerald-600" size={28} /> Business Passbook
                        </h2>
                    </div>
                    <div className="flex flex-wrap gap-3 w-full md:w-auto">
                        <div className="flex-1 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm min-w-[120px]">
                            <p className="text-[9px] font-black text-emerald-600 uppercase">Cash In</p>
                            <h4 className="text-base font-black dark:text-white">₹{totals.totalIn.toLocaleString()}</h4>
                        </div>
                        <div className="flex-1 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm min-w-[120px]">
                            <p className="text-[9px] font-black text-red-500 uppercase">Cash Out</p>
                            <h4 className="text-base font-black dark:text-white">₹{totals.totalOut.toLocaleString()}</h4>
                        </div>
                        <div className={`flex-1 p-3 rounded-xl shadow-lg min-w-[120px] ${totals.net >= 0 ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>
                            <p className="text-[9px] font-black uppercase opacity-80">{totals.net >= 0 ? 'Balance' : 'Due'}</p>
                            <h4 className="text-base font-black">₹{Math.abs(totals.net).toLocaleString()}</h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* Entry Form */}
            <div className={`no-print max-w-7xl mx-auto p-6 rounded-3xl shadow-xl border mb-8 transition-colors ${isEditing ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        {isEditing ? '⚠️ Edit Transaction' : '📝 New Entry'}
                    </h3>
                    {isEditing && (
                        <button onClick={() => { setIsEditing(false); setFormData(initialForm); }} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full">
                            <X size={18} className="text-zinc-500" />
                        </button>
                    )}
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex gap-1"><Calendar size={12}/> Date</label>
                            <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="form-input-zinc" />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex gap-1"><User size={12}/> Category</label>
                            <select value={formData.partyName} onChange={e => setFormData({...formData, partyName: e.target.value})} required className="form-input-zinc">
                                <option value="">-- Select --</option>
                                <option value="Loading">Loading</option>
                                <option value="Unloading">Unloading</option>
                                <option value="Rasan">Rasan</option>
                                <option value="Water">Water</option>
                                <option value="Medical">Medical</option>
                                <option value="CA">CA</option>
                                <option value="Electrical">Electrical/Electronics</option>
                                <option value="Hardware">Hardware</option>
                                <option value="Stationary">Stationary</option>
                                <option value="Construction">Construction</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {formData.partyName === 'Other' && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex gap-1"><MoreHorizontal size={12}/> Detail</label>
                                <input type="text" value={formData.otherDetail} onChange={e => setFormData({...formData, otherDetail: e.target.value})} placeholder="Specify..." required className="form-input-zinc border-emerald-200" />
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex gap-1">Type</label>
                            <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="form-input-zinc">
                                <option value="Payment Out">Paid (Out)</option>
                                <option value="Payment In">Received (In)</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex gap-1"><Wallet size={12}/> Amount</label>
                            <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" required className="form-input-zinc font-black text-emerald-600" />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-3 space-y-1">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex gap-1"><Hash size={12}/> Txn Ref</label>
                            <input type="text" value={formData.txnId} onChange={e => setFormData({...formData, txnId: e.target.value})} placeholder="UTR / Ref No." className="form-input-zinc" />
                        </div>
                        <div className="md:col-span-7 space-y-1">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex gap-1"><Info size={12}/> Remark</label>
                            <input type="text" value={formData.remark} onChange={e => setFormData({...formData, remark: e.target.value})} placeholder="Narration..." className="form-input-zinc" />
                        </div>
                        <div className="md:col-span-2">
                            <button type="submit" disabled={loading || !isAuthorized} className={`w-full py-3 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all ${isEditing ? 'bg-amber-600' : 'bg-zinc-900 dark:bg-emerald-600'}`}>
                                {isEditing ? <><RotateCcw size={14} className="inline mr-1" /> Update</> : <><Save size={14} className="inline mr-1" /> Save</>}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Filter & Search Bar */}
            <div className="no-print max-w-7xl mx-auto bg-zinc-900 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex flex-wrap gap-3 items-center flex-1">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                        <input 
                            type="text" 
                            placeholder="SEARCH BY PARTY, REMARK, REF..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-800 text-white text-[10px] font-black uppercase pl-9 pr-3 py-2.5 rounded-lg border border-zinc-700 outline-none focus:border-emerald-500 transition-all"
                        />
                    </div>

                    <select value={filterParty} onChange={e => setFilterParty(e.target.value)} className="bg-zinc-800 text-white text-[10px] font-black uppercase px-3 py-2.5 rounded-lg border border-zinc-700 outline-none cursor-pointer">
                        <option value="All">All Categories</option>
                        <option value="Loading">Loading</option>
                        <option value="Unloading">Unloading</option>
                        <option value="Rasan">Rasan</option>
                        <option value="Water">Water</option>
                        <option value="Medical">Medical</option>
                        <option value="CA">CA</option>
                        <option value="Electrical">Electrical/Electronics</option>
                        <option value="Hardware">Hardware</option>
                        <option value="Stationary">Stationary</option>
                        <option value="Construction">Construction</option>
                        <option value="Other">Other</option>
                    </select>

                    <div className="flex items-center gap-2 bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700">
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-white text-[10px] font-bold outline-none invert dark:invert-0" />
                        <span className="text-zinc-600 text-[10px] font-black">TO</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-white text-[10px] font-bold outline-none invert dark:invert-0" />
                    </div>
                </div>

                <div className="flex gap-2">
                    <button onClick={resetFilters} className="p-2.5 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-all" title="Reset Filters"><RotateCcw size={16}/></button>
                    <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2.5 bg-white text-black rounded-lg text-[10px] font-black uppercase hover:bg-zinc-200 transition-all"><Printer size={16}/> Print</button>
                </div>
            </div>

            {/* Table Area */}
            <div id="printable-ledger" className="max-w-7xl mx-auto bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-sm border border-zinc-200 dark:border-zinc-800 transition-colors">
                <div className="hidden print:block p-8 border-b-4 border-black mb-4 bg-white">
                    <h1 className="text-2xl font-black text-black">DHARA SHAKTI AGRO PRODUCTS</h1>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold">Transaction Ledger Statement</p>
                    <div className="mt-4 flex justify-between text-[10px] font-bold border-t pt-2 text-black">
                        <span>Category: {filterParty} | Search: {searchQuery || 'None'}</span>
                        <span>Date: {new Date().toLocaleDateString('en-IN')}</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-100 dark:bg-zinc-800 text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-700">
                                <th className="px-4 py-4 w-12 text-center">S.No.</th>
                                <th className="px-4 py-4">Date</th>
                                <th className="px-4 py-4">Details</th>
                                <th className="px-4 py-4 text-right">In (Cr)</th>
                                <th className="px-4 py-4 text-right">Out (Dr)</th>
                                <th className="px-4 py-4 text-right">Balance</th>
                                <th className="px-4 py-4 text-center no-print">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-[11px]">
                            {dataWithBalance.length > 0 ? dataWithBalance.map((txn, i) => (
                                <tr key={txn._id || i} className="border-b border-zinc-50 dark:border-zinc-800 dark:text-zinc-300 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-4 py-3 text-center font-bold text-zinc-400">{i + 1}</td>
                                    <td className="px-4 py-3 font-bold">{new Date(txn.date).toLocaleDateString('en-GB')}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-black uppercase text-zinc-900 dark:text-white">{txn.partyName}</div>
                                        <div className="text-[9px] opacity-60 italic">{txn.remark || '-'} {txn.txnId && `| Ref: ${txn.txnId}`}</div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-emerald-600">
                                        {txn.type === 'Payment In' ? `₹${Number(txn.amount).toLocaleString()}` : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-red-500">
                                        {txn.type === 'Payment Out' ? `₹${Number(txn.amount).toLocaleString()}` : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right font-black">
                                        ₹{Math.abs(txn.currentBalance).toLocaleString()}
                                        <span className="ml-1 text-[8px] opacity-50">{txn.currentBalance >= 0 ? 'Cr' : 'Dr'}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center no-print">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => handleEditClick(txn)} className="p-2 text-zinc-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-all" title="Edit">
                                                <Pencil size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(txn._id)} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all" title="Delete">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="7" className="px-4 py-10 text-center text-zinc-500 font-bold uppercase tracking-widest">No transactions found</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot className="bg-zinc-900 text-white font-black text-[10px] print:bg-zinc-200 print:text-black">
                            <tr>
                                <td colSpan="3" className="px-4 py-4 text-right opacity-70 uppercase">Statement Totals:</td>
                                <td className="px-4 py-4 text-right text-emerald-400 print:text-emerald-700">₹{totals.totalIn.toLocaleString()}</td>
                                <td className="px-4 py-4 text-right text-red-400 print:text-red-700">₹{totals.totalOut.toLocaleString()}</td>
                                <td className="px-4 py-4 text-right text-base underline decoration-double">
                                    ₹{Math.abs(totals.net).toLocaleString()} {totals.net >= 0 ? 'Cr' : 'Dr'}
                                </td>
                                <td className="no-print"></td>
                            </tr>
                        </tfoot>
                    </table>
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

export default ExpenseManager;