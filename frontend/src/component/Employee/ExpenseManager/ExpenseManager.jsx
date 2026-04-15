import React, { useState, useEffect, useCallback, useMemo } from 'react';
// 1. Expense API import karein
import { 
    getAllExpenses, 
    createExpense, 
    updateExpense, 
    deleteExpense 
} from '../../../api/expenseApi'; 

import { 
    Landmark, Filter, Printer, Save, Wallet, User, 
    Calendar, Hash, Info, RotateCcw, MoreHorizontal,
    Pencil, Trash2, X, Search 
} from "lucide-react";


import CustomSnackbar from "../../Core_Component/Snackbar/CustomSnackbar";
import Loader from '../../Core_Component/Loader/Loader';

const ExpenseManager = ({ user }) => {
    // Role handling based on backend routes
    const isAuthorized = user.role === "ADMIN" || user.role === "ACCOUNTANT";
    const canModify = user.role === "ADMIN" || user.role === "MANAGER";

    const [transactions, setTransactions] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    
    const initialForm = {
        date: new Date().toISOString().split('T')[0],
        category: "",
        otherDetail: "",
        title: '',
        type: 'PAYMENT_OUT',
        amount: "",
        txnId: "",
        remark: ""
    };

    const [formData, setFormData] = useState(initialForm);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterParty, setFilterParty] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // 2. Optimized Fetch using expenseApi
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getAllExpenses(); // API helper used here
            if (res.data.success) {
                const sorted = res.data.data.sort((a, b) => new Date(a.date) - new Date(b.date));
                setTransactions(sorted);
                setFilteredData(sorted);
            }
        } catch (err) {
            setSnackbar({ open: true, message: "डेटा लोड करने में विफल!", severity: "error" });
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Filtering logic (same as before)
    useEffect(() => {
        let temp = [...transactions];
        if (filterParty !== 'All') temp = temp.filter(t => t.category === filterParty);
        if (startDate && endDate) temp = temp.filter(t => t.date >= startDate && t.date <= endDate);
        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase();
            temp = temp.filter(t => 
                t.category?.toLowerCase().includes(query) || 
                t.remark?.toLowerCase().includes(query) || 
                t.txnId?.toLowerCase().includes(query)
            );
        }
        setFilteredData(temp);
    }, [searchQuery, filterParty, startDate, endDate, transactions]);

    const handlePrint = () => { window.print(); };

    const resetFilters = () => {
        setSearchQuery(''); setFilterParty('All'); setStartDate(''); setEndDate('');
    };

    const handleEditClick = (txn) => {
        // Backend logic allows ADMIN and MANAGER to update
        if (!canModify) {
            setSnackbar({ open: true, message: "आपको बदलाव करने की अनुमति नहीं है!", severity: "warning" });
            return;
        }
        setIsEditing(true);
        setEditId(txn._id);
        const categories = ['Loading', 'Unloading', 'Rasan', 'Water', 'Medical', 'CA', 'Electrical', 'Hardware', 'Stationary', 'Construction'];
        const isStandardCategory = categories.includes(txn.category);

        setFormData({
            date: txn.date.split('T')[0],
            category: isStandardCategory ? txn.category : 'Other',
            otherDetail: !isStandardCategory ? txn.category : '',
            type: txn.type,
            amount: txn.amount,
            txnId: txn.txnId || '',
            remark: txn.remark || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // 3. Delete using expenseApi (Admin only check)
    const handleDelete = async (id) => {
        if (user.role !== "ADMIN") {
            setSnackbar({ open: true, message: "सिर्फ एडमिन ही डिलीट कर सकते हैं!", severity: "error" });
            return;
        }
        if (!window.confirm("क्या आप वाकई इसे डिलीट करना चाहते हैं?")) return;

        setLoading(true);
        try {
            const res = await deleteExpense(id); // API helper used here
            if (res.data.success) {
                setSnackbar({ open: true, message: "सफलतापूर्वक हटा दिया गया!", severity: "success" });
                fetchData();
            }
        } catch (err) {
            setSnackbar({ open: true, message: "डिलीट करने में विफल!", severity: "error" });
        } finally { setLoading(false); }
    };

    // 4. Submit using expenseApi (Create/Update)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                category: formData.category === 'Other' ? formData.otherDetail : formData.category
            };

            let res;
            if (isEditing) {
                res = await updateExpense(editId, payload); // API helper
            } else {
                res = await createExpense(payload); // API helper
            }

            if (res.data.success) {
                setFormData(initialForm);
                setIsEditing(false);
                setEditId(null);
                setSnackbar({ open: true, message: isEditing ? "सफलतापूर्वक अपडेट किया गया!" : "सफलतापूर्वक सहेजा गया!", severity: "success" });
                fetchData();
            }
        } catch (err) {
            setSnackbar({ open: true, message: "सर्वर त्रुटि!", severity: "error" });
        } finally { setLoading(false); }
    };

    // Memoized Balance Calculation
    const dataWithBalance = useMemo(() => {
        let runningBal = 0;
        const withBal = transactions.map(txn => {
            const amt = Number(txn.amount) || 0;
            txn.type === 'PAYMENT_IN' ? runningBal += amt : runningBal -= amt;
            return { ...txn, currentBalance: runningBal };
        });
        let result = withBal.filter(item => filteredData.some(f => f._id === item._id));
        return result.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [filteredData, transactions]);

    const totals = useMemo(() => {
        const totalIn = filteredData.filter(t => t.type === 'PAYMENT_IN').reduce((s, c) => s + Number(c.amount || 0), 0);
        const totalOut = filteredData.filter(t => t.type === 'PAYMENT_OUT').reduce((s, c) => s + Number(c.amount || 0), 0);
        return { totalIn, totalOut, net: totalIn - totalOut };
    }, [filteredData]);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 font-sans">
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { size: A4; margin: 0.3cm ; }
                    body * { visibility: hidden !important; }
                    #printable-ledger, #printable-ledger * { visibility: visible !important; }
                    #printable-ledger { position: absolute !important; left: 0; top: 0; width: 100%; display: block !important; }
                    .no-print { display: none !important; }
                    table { width: 100% !important; border-collapse: collapse; }
                    th, td { border: 1px solid #ddd; padding: 8px; color: black !important; }
                }
                .form-input-zinc { 
                    width: 100%; background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 0.75rem; 
                    padding: 0.6rem 0.8rem; font-size: 0.75rem; outline: none; transition: all 0.2s; 
                    font-weight: 700; color: #18181b; 
                }
                .dark .form-input-zinc { background: #18181b; border-color: #27272a; color: #f4f4f5; }
            `}} />

            {loading && <Loader />}
            
            {/* Header & Stats */}
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

            {/* Entry Form - Controlled by canModify */}
            {isAuthorized && (
                <div className={`no-print max-w-7xl mx-auto p-6 rounded-3xl shadow-xl border mb-8 transition-all ${isEditing ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}>
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
                                <select defaultValue={formData.category} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required className="form-input-zinc">
                                    <option value="">-- Select --</option>
                                    <option value="LOADING">Loading</option>
                                    <option value="UNLOADING">Unloading</option>
                                    <option value="RASAN">Rasan</option>
                                    <option value="WATER">Water</option>
                                    <option value="MEDICAL">Medical</option>
                                    <option value="CA">CA</option>
                                    <option value="ELECTRICAL">Electrical/Electronics</option>
                                    <option value="HARDWARE">Hardware</option>
                                    <option value="STATIONARY">Stationary</option>
                                    <option value="CONSTRUCTION">Construction</option>
                                    <option value="FUEL">Fuel</option>
                                    <option value="SALARY">Salary</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            {formData.category === 'Other' && (
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
                                <button type="submit" disabled={loading} className={`w-full py-3 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all ${isEditing ? 'bg-amber-600' : 'bg-zinc-900 dark:bg-emerald-600'}`}>
                                    {isEditing ? <><RotateCcw size={14} className="inline mr-1" /> Update</> : <><Save size={14} className="inline mr-1" /> Save</>}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="no-print max-w-7xl mx-auto bg-zinc-900 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex flex-wrap gap-3 items-center flex-1">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                        <input type="text" placeholder="SEARCH..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-zinc-800 text-white text-[10px] font-black uppercase pl-9 pr-3 py-2.5 rounded-lg border border-zinc-700 outline-none" />
                    </div>
                    <select value={filterParty} onChange={e => setFilterParty(e.target.value)} className="bg-zinc-800 text-white text-[10px] font-black uppercase px-3 py-2.5 rounded-lg border border-zinc-700 outline-none">
                        <option value="All">All Categories</option>
                        {/* Categories List same as form */}
                    </select>
                    <div className="flex items-center gap-2 bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700">
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-white text-[10px] font-bold outline-none invert dark:invert-0" />
                        <span className="text-zinc-600 text-[10px] font-black">TO</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-white text-[10px] font-bold outline-none invert dark:invert-0" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={resetFilters} className="p-2.5 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600"><RotateCcw size={16}/></button>
                    <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2.5 bg-white text-black rounded-lg text-[10px] font-black uppercase hover:bg-zinc-200"><Printer size={16}/> Print</button>
                </div>
            </div>

            {/* Table */}
            <div 
    id="printable-ledger" 
    className="mx-auto bg-white dark:bg-zinc-900 transition-all 
               /* Screen Style */ 
               max-w-7xl rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 
               /* Print Style Fixes (Aggressive) */
               print:max-w-none print:m-0 print:p-0 print:border-none print:shadow-none print:rounded-none"
>
    {/* Minimalist Professional Header for Print */}
    <div className="hidden print:block p-8 border-b-2 border-black mb-6 bg-white">
        <div className="flex justify-between items-end">
            <div className="space-y-1">
                <h1 className="text-4xl font-black tracking-tighter text-black leading-none">
                    DHARA SHAKTI AGRO PRODUCTS
                </h1>
                <p className="text-[12px] font-black uppercase tracking-[0.4em] text-zinc-500">
                    Business Transaction Ledger
                </p>
            </div>
            <div className="text-right border-l-2 border-zinc-200 pl-6">
                <p className="text-[9px] font-black uppercase text-zinc-400 leading-none">Statement Date</p>
                <p className="text-sm font-bold text-black">
                    {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
            </div>
        </div>
    </div>

    <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full text-left border-collapse print:text-black">
            <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50 print:bg-zinc-100 text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b-2 border-zinc-200 dark:border-zinc-700 print:border-black">
                    <th className="px-6 py-4 text-center w-16">S.No.</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4 text-right">Credit (In)</th>
                    <th className="px-6 py-4 text-right">Debit (Out)</th>
                    <th className="px-6 py-4 text-right bg-zinc-100/30 dark:bg-zinc-800/20 print:bg-zinc-50">Balance</th>
                    <th className="px-6 py-4 text-center no-print">Actions</th>
                </tr>
            </thead>
            <tbody className="text-[11px]">
                {dataWithBalance.map((txn, i) => (
                    <tr key={txn._id} className="border-b border-zinc-100 dark:border-zinc-800 print:border-zinc-300 group">
                        <td className="px-6 py-4 text-center font-bold text-zinc-400 print:text-zinc-600">{i + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-zinc-700 dark:text-zinc-300">
                            {new Date(txn.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">
                            <div className="font-black uppercase text-zinc-900 dark:text-zinc-100">{txn.title || txn.category}</div>
                            <div className="flex gap-2 items-center mt-1">
                                <span className="text-[8px] font-black px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded uppercase border border-zinc-200 dark:border-zinc-700">
                                    {txn.category}
                                </span>
                                <span className="text-[9px] text-zinc-400 italic truncate max-w-[250px]">{txn.remarks}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-emerald-600">
                            {txn.type === 'PAYMENT_IN' ? `₹${txn.amount.toLocaleString('en-IN')}` : <span className="opacity-20">—</span>}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-red-500">
                            {txn.type === 'PAYMENT_OUT' ? `₹${txn.amount.toLocaleString('en-IN')}` : <span className="opacity-20">—</span>}
                        </td>
                        <td className="px-6 py-4 text-right font-black bg-zinc-50/30 dark:bg-zinc-800/10 print:bg-zinc-50">
                            ₹{Math.abs(txn.currentBalance).toLocaleString('en-IN')}
                            <span className="ml-1 text-[8px] opacity-40">{txn.currentBalance >= 0 ? 'CR' : 'DR'}</span>
                        </td>
                        <td className="px-6 py-4 text-center no-print">
                            <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditClick(txn)} className="p-2 hover:text-amber-600"><Pencil size={14} /></button>
                                <button onClick={() => handleDelete(txn._id)} className="p-2 hover:text-red-500"><Trash2 size={14} /></button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
            <tfoot className="bg-zinc-900 text-white font-black text-[11px] print:bg-black print:text-white">
                <tr>
                    <td colSpan="3" className="px-6 py-6 text-right uppercase tracking-[0.2em] opacity-60">Net Statement Summary:</td>
                    <td className="px-6 py-6 text-right text-emerald-400">₹{totals.totalIn.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-6 text-right text-red-400">₹{totals.totalOut.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-6 text-right text-base border-l-4 border-emerald-500">
                        ₹{Math.abs(totals.net).toLocaleString('en-IN')}
                        <span className="text-[8px] ml-1 opacity-50">{totals.net >= 0 ? 'TOTAL CR' : 'TOTAL DR'}</span>
                    </td>
                    <td className="no-print"></td>
                </tr>
            </tfoot>
        </table>
    </div>

    {/* Elegant Footer for Print */}
    <div className="hidden print:flex justify-between items-end mt-16 px-8 pb-12">
        <div className="text-[9px] text-zinc-400 max-w-[300px] leading-relaxed">
            * This document is a computer-generated summary of business transactions recorded in the Dharashakti ERP system.
        </div>
        <div className="w-48 text-center">
            <div className="border-b-2 border-black mb-2"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-black">Authorized Personnel</p>
        </div>
    </div>
</div>

            <CustomSnackbar 
                open={snackbar.open} message={snackbar.message} severity={snackbar.severity} 
                onClose={() => setSnackbar({ ...snackbar, open: false })} 
            />
        </div>
    );
};

export default ExpenseManager;