import React, { useState, useEffect, useCallback } from 'react';
import { 
  Printer, FileSearch, Calendar, Download, FileSpreadsheet, Package, User, Tag, ArrowDownCircle, ArrowUpCircle 
} from "lucide-react";
import * as XLSX from 'xlsx';

// API Imports
import { getAllSales } from '../../api/saleApi';
import { getAllPurchases } from '../../api/purchaseApi';
import { getInventory } from '../../api/stockApi';
import { getAllProducts } from '../../api/productApi';
import axios from 'axios';

import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const Reports_Printing = () => {
    const [loading, setLoading] = useState(false);
    const [category, setCategory] = useState("sales"); 
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [partyFilter, setPartyFilter] = useState("All");
    const [productFilter, setProductFilter] = useState("All");
    
    const [rawData, setRawData] = useState([]);
    const [filteredData, setFilteredData] = useState([]); 
    const [parties, setParties] = useState([]); 
    const [products, setProducts] = useState([]); 
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

    const API_URL = process.env.REACT_APP_API_URL || "https://dharashakti30backend.vercel.app";

    const fetchDropdowns = async () => {
        try {
            const [prodRes, partyRes] = await Promise.all([
                getAllProducts(),
                axios.get(`${API_URL}/api/parties`)
            ]);
            if (prodRes.data.success) setProducts(prodRes.data.data);
            if (partyRes.data.success) setParties(partyRes.data.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchDropdowns(); }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            let res;
            if (category === "sales") res = await getAllSales();
            else if (category === "purchases") res = await getAllPurchases();
            else res = await getInventory();

            if (res.data.success) {
                setRawData(res.data.data);
                setFilteredData([]); 
            }
        } catch (err) {
            setSnackbar({ open: true, message: "Sync Error!", severity: "error" });
        } finally { setLoading(false); }
    }, [category]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleFilter = () => {
        let temp = [...rawData];

        if (startDate && endDate && category !== "stock") {
            temp = temp.filter(item => {
                const itemDate = (item.date || item.purchaseDate || item.createdAt).split('T')[0];
                return itemDate >= startDate && itemDate <= endDate;
            });
        }

        if (partyFilter !== "All" && category !== "stock") {
            temp = temp.filter(item => (item.customerName === partyFilter) || (item.supplierName === partyFilter));
        }

        if (productFilter !== "All") {
            temp = temp.filter(item => {
                if (category === "stock") return item.name === productFilter;
                const items = item.goods || item.items || [];
                return items.some(g => g.productName === productFilter);
            });
        }
        
        // Ledger logic: Sort by date
        temp.sort((a, b) => new Date(a.date || a.purchaseDate) - new Date(b.date || b.purchaseDate));
        
        // Calculate Running Balance for this filtered set
        let currentBal = 0;
        const processed = temp.map(item => {
            // Debit: Bill Amount (Gaya Paisa/Udhaari)
            // Credit: Amount Paid (Aaya Paisa)
            const debit = item.grandTotal || 0;
            const credit = item.amountPaid || 0;
            currentBal += (debit - credit);
            return { ...item, debit, credit, runningBalance: currentBal };
        });

        setFilteredData(processed);
        setSnackbar({ open: true, message: `${processed.length} Records Generated`, severity: "success" });
    };

    const handlePrint = () => {
        const printContent = document.getElementById("printable-report").innerHTML;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <style>
                        body { font-family: sans-serif; padding: 20px; font-size: 10px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                        th, td { border: 1px solid #000; padding: 5px; text-align: left; }
                        th { background: #eee; }
                        .text-right { text-align: right; }
                        .header { text-align: center; border-bottom: 2px solid #000; margin-bottom: 10px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>DHARA SHAKTI AGRO PRODUCTS</h2>
                        <p>${category.toUpperCase()} LEDGER STATEMENT</p>
                    </div>
                    ${printContent}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8">
            {loading && <Loader />}
            
            <div className="no-print max-w-7xl mx-auto bg-white dark:bg-zinc-900 rounded-[2rem] shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden mb-10">
                <div className="bg-zinc-900 p-5 flex justify-between items-center text-white">
                    <h2 className="text-lg font-black uppercase tracking-tighter">Finance Ledger Center</h2>
                    <div className="flex gap-2">
                        <button onClick={handleFilter} className="px-6 py-2 bg-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Generate Data</button>
                        <button onClick={handlePrint} disabled={filteredData.length === 0} className="px-6 py-2 bg-zinc-700 rounded-lg text-[10px] font-black uppercase tracking-widest disabled:opacity-50">Print PDF</button>
                    </div>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-zinc-400">Type</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl text-xs font-bold border-none">
                            <option value="sales">Sales (Receivables)</option>
                            <option value="purchases">Purchases (Payables)</option>
                            <option value="stock">Stock Report</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-zinc-400">Party</label>
                        <select value={partyFilter} onChange={e => setPartyFilter(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl text-xs font-bold border-none">
                            <option value="All">All Parties</option>
                            {parties.map(p => <option key={p._id} value={p.name}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-zinc-400">Product</label>
                        <select value={productFilter} onChange={e => setProductFilter(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl text-xs font-bold border-none">
                            <option value="All">All Products</option>
                            {products.map(p => <option key={p._id} value={p.name}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-zinc-400">Date From - To</label>
                        <div className="flex gap-2">
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-1/2 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-xl text-[10px] font-bold border-none" />
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-1/2 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-xl text-[10px] font-bold border-none" />
                        </div>
                    </div>
                </div>
            </div>

            <div id="printable-report" className="max-w-7xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                {filteredData.length > 0 ? (
                    <div className="p-8">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-black uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-700">
                                        <th className="px-4 py-4 w-12 text-center">#</th>
                                        <th className="px-4 py-4">Date / Ref</th>
                                        <th className="px-4 py-4">Description / Product</th>
                                        <th className="px-4 py-4 text-right text-red-500">Debit (Dr)</th>
                                        <th className="px-4 py-4 text-right text-emerald-600">Credit (Cr)</th>
                                        <th className="px-4 py-4 text-right bg-zinc-100/50 dark:bg-zinc-800/20">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[11px]">
                                    {filteredData.map((item, i) => {
                                        const prodNames = (item.goods || item.items || []).map(g => g.productName).join(", ");
                                        return (
                                            <tr key={item._id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/50">
                                                <td className="px-4 py-4 text-center text-zinc-400 font-bold">{i + 1}</td>
                                                <td className="px-4 py-4">
                                                    <div className="font-black text-zinc-900 dark:text-white">{new Date(item.date || item.purchaseDate).toLocaleDateString('en-GB')}</div>
                                                    <div className="text-[9px] text-zinc-400 font-bold">{item.billNo}</div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="font-bold text-zinc-700 dark:text-zinc-300 uppercase">{item.customerName || item.supplierName}</div>
                                                    <div className="text-[9px] text-emerald-600 font-black italic">{prodNames}</div>
                                                </td>
                                                <td className="px-4 py-4 text-right font-black text-red-500">₹{item.debit.toLocaleString()}</td>
                                                <td className="px-4 py-4 text-right font-black text-emerald-600">₹{item.credit.toLocaleString()}</td>
                                                <td className="px-4 py-4 text-right font-black text-zinc-900 dark:text-white bg-zinc-50/20">₹{item.runningBalance.toLocaleString()}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="bg-zinc-950 text-white font-black text-[11px]">
                                    <tr>
                                        <td colSpan="3" className="px-4 py-6 text-right uppercase tracking-widest">Summary Ledger Totals:</td>
                                        <td className="px-4 py-6 text-right text-red-400">₹{filteredData.reduce((s, i) => s + i.debit, 0).toLocaleString()}</td>
                                        <td className="px-4 py-6 text-right text-emerald-400">₹{filteredData.reduce((s, i) => s + i.credit, 0).toLocaleString()}</td>
                                        <td className="px-4 py-6 text-right text-base underline text-cyan-400">₹{filteredData[filteredData.length - 1].runningBalance.toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="p-32 text-center text-zinc-400 font-black uppercase tracking-widest flex flex-col items-center gap-4">
                        <Package size={50} className="opacity-10" />
                        Enter Filters to View Detailed Ledger
                    </div>
                )}
            </div>

            <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({...snackbar, open: false})} />
        </div>
    );
};

export default Reports_Printing;