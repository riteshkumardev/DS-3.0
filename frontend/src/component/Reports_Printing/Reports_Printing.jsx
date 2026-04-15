import React, { useState, useEffect, useCallback } from 'react';
import { 
  Printer, FileSearch, Calendar, Hash, Download, FileSpreadsheet, Package, User, Tag 
} from "lucide-react";
import * as XLSX from 'xlsx';

// API Imports
import { getAllSales } from '../../api/saleApi';
import { getAllPurchases } from '../../api/purchaseApi';
import { getInventory } from '../../api/stockApi';
import { getAllProducts } from '../../api/productApi'; // Added
import axios from 'axios'; // For party list fetching

import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const Reports_Printing = () => {
    const [loading, setLoading] = useState(false);
    const [category, setCategory] = useState("sales"); 
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    
    // New Filter States
    const [partyFilter, setPartyFilter] = useState("All");
    const [productFilter, setProductFilter] = useState("All");
    
    const [rawData, setRawData] = useState([]);
    const [filteredData, setFilteredData] = useState([]); 
    const [parties, setParties] = useState([]); // Party list for dropdown
    const [products, setProducts] = useState([]); // Product list for dropdown
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

    const API_URL = process.env.REACT_APP_API_URL || "https://dharashakti30backend.vercel.app";

    // 1. Fetch Dropdown Data (Parties & Products)
    const fetchDropdowns = async () => {
        try {
            const [prodRes, partyRes] = await Promise.all([
                getAllProducts(),
                axios.get(`${API_URL}/api/parties`) // Adjust based on your partyApi
            ]);
            if (prodRes.data.success) setProducts(prodRes.data.data);
            if (partyRes.data.success) setParties(partyRes.data.data);
        } catch (err) {
            console.error("Dropdown fetch error", err);
        }
    };

    useEffect(() => { fetchDropdowns(); }, []);

    // 2. Fetch Transaction Data
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
            setSnackbar({ open: true, message: "Data Sync Failed!", severity: "error" });
        } finally {
            setLoading(false);
        }
    }, [category]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // 3. Complex Filtering Logic (Date + Party + Product)
    const handleFilter = () => {
        let temp = [...rawData];

        // Date Filter
        if (startDate && endDate && category !== "stock") {
            temp = temp.filter(item => {
                const itemDate = (item.date || item.purchaseDate || item.createdAt).split('T')[0];
                return itemDate >= startDate && itemDate <= endDate;
            });
        }

        // Party Filter
        if (partyFilter !== "All" && category !== "stock") {
            temp = temp.filter(item => 
                (item.customerName === partyFilter) || (item.supplierName === partyFilter)
            );
        }

        // Product Filter
        if (productFilter !== "All") {
            temp = temp.filter(item => {
                if (category === "stock") return item.name === productFilter;
                const items = item.goods || item.items || [];
                return items.some(g => g.productName === productFilter);
            });
        }
        
        // Sort Date Ascending for Ledger
        temp.sort((a, b) => new Date(a.date || a.purchaseDate) - new Date(b.date || b.purchaseDate));
        
        setFilteredData(temp);
        setSnackbar({ open: true, message: `${temp.length} Records Found`, severity: "success" });
    };

    const handlePrint = () => {
        const printContent = document.getElementById("printable-report").innerHTML;
        const printWindow = window.open('', '_blank', 'width=1000,height=800');
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>Dhara Shakti Ledger</title>
                    <style>
                        body { font-family: sans-serif; padding: 30px; color: #111; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; font-size: 10px; text-align: left; }
                        th { background-color: #f1f1f1; text-transform: uppercase; font-weight: bold; }
                        .text-right { text-align: right; }
                        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                        .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 10px; font-size: 9px; display: flex; justify-content: space-between; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2 style="margin:0">DHARA SHAKTI AGRO PRODUCTS</h2>
                        <p style="margin:5px 0; font-size: 12px; font-weight: bold; text-transform: uppercase;">${category} Report</p>
                    </div>
                    ${printContent}
                    <div class="footer">
                        <span>Printed: ${new Date().toLocaleString()}</span>
                        <span>Authorized Signature _________________</span>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 300);
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8">
            {loading && <Loader />}
            
            <div className="no-print max-w-7xl mx-auto bg-white dark:bg-zinc-900 rounded-[2rem] shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden mb-10">
                <div className="bg-emerald-600 p-5 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <FileSearch size={20} />
                        <h2 className="text-lg font-black uppercase tracking-tighter">Advanced Ledger Filters</h2>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* 1. Category */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-zinc-400">Ledger Type</label>
                            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl text-xs font-bold border-none outline-none">
                                <option value="sales">SALES REGISTER</option>
                                <option value="purchases">PURCHASE REGISTER</option>
                                <option value="stock">STOCK SUMMARY</option>
                            </select>
                        </div>

                        {/* 2. Party Filter */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-zinc-400 flex items-center gap-1"><User size={10}/> Select Party</label>
                            <select value={partyFilter} onChange={e => setPartyFilter(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl text-xs font-bold border-none outline-none" disabled={category === 'stock'}>
                                <option value="All">All Parties</option>
                                {parties.map(p => <option key={p._id} value={p.name}>{p.name}</option>)}
                            </select>
                        </div>

                        {/* 3. Product Filter */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-zinc-400 flex items-center gap-1"><Tag size={10}/> Select Product</label>
                            <select value={productFilter} onChange={e => setProductFilter(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl text-xs font-bold border-none outline-none">
                                <option value="All">All Products</option>
                                {products.map(p => <option key={p._id} value={p.name}>{p.name}</option>)}
                            </select>
                        </div>

                        {/* 4. Date Range */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-zinc-400">Date Range (Optional)</label>
                            <div className="flex gap-2">
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-1/2 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-xl text-[10px] font-bold border-none" />
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-1/2 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-xl text-[10px] font-bold border-none" />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t dark:border-zinc-800">
                        <button onClick={handleFilter} className="px-10 py-3 bg-zinc-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">Apply Filter</button>
                        <button onClick={handlePrint} disabled={filteredData.length === 0} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50"><Printer size={16}/> Print</button>
                    </div>
                </div>
            </div>

            {/* Printable Area */}
            <div id="printable-report" className="max-w-7xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                {filteredData.length > 0 ? (
                    <div className="p-8">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-black uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-700">
                                        <th className="px-4 py-4 w-12 text-center">S.N.</th>
                                        <th className="px-4 py-4">Transaction / Date</th>
                                        <th className="px-4 py-4">Party & Product Details</th>
                                        <th className="px-4 py-4 text-right">Taxable Value</th>
                                        <th className="px-4 py-4 text-right">GST (Net)</th>
                                        <th className="px-4 py-4 text-right bg-zinc-50 dark:bg-zinc-800/30">Net Total</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[11px]">
                                    {filteredData.map((item, i) => {
                                        const prodNames = (item.goods || item.items || []).map(g => g.productName).join(", ") || item.name;
                                        return (
                                            <tr key={item._id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/50">
                                                <td className="px-4 py-4 text-center font-bold text-zinc-400">{i + 1}</td>
                                                <td className="px-4 py-4">
                                                    <div className="font-black text-zinc-900 dark:text-white uppercase">{item.billNo || "INV-STOCK"}</div>
                                                    <div className="text-[9px] text-zinc-400 font-bold">{new Date(item.date || item.purchaseDate || item.createdAt).toLocaleDateString('en-GB')}</div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="font-bold text-zinc-700 dark:text-zinc-300 uppercase">{item.customerName || item.supplierName || 'Internal Inventory'}</div>
                                                    <div className="text-[9px] text-emerald-600 font-black italic">{prodNames}</div>
                                                </td>
                                                <td className="px-4 py-4 text-right font-bold">₹{(item.subTotal || item.minStockLevel || 0).toLocaleString()}</td>
                                                <td className="px-4 py-4 text-right font-bold text-zinc-500">₹{((item.cgst || 0) + (item.sgst || 0) + (item.igst || 0)).toFixed(2)}</td>
                                                <td className="px-4 py-4 text-right font-black text-zinc-900 dark:text-white">₹{(item.grandTotal || item.currentStock || 0).toLocaleString()}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="bg-zinc-950 text-white font-black text-[11px]">
                                    <tr>
                                        <td colSpan="3" className="px-4 py-6 text-right uppercase tracking-[0.2em]">Consolidated Total Amount:</td>
                                        <td colSpan="3" className="px-4 py-6 text-right text-base text-emerald-400 underline decoration-double">
                                            ₹{filteredData.reduce((sum, item) => sum + (item.grandTotal || item.currentStock || 0), 0).toLocaleString()}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="p-32 text-center text-zinc-400 font-black uppercase tracking-widest flex flex-col items-center gap-4">
                        <Package size={50} className="opacity-10" />
                        Select Filters to Load Report Data
                    </div>
                )}
            </div>

            <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({...snackbar, open: false})} />
        </div>
    );
};

export default Reports_Printing;