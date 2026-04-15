import React, { useState, useEffect, useCallback } from 'react';
import { 
  Printer, FileSearch, Calendar, Hash, Download, FileSpreadsheet 
} from "lucide-react";
import * as XLSX from 'xlsx';

// API Imports
import { getAllSales } from '../../api/saleApi';
import { getAllPurchases } from '../../api/purchaseApi';
import { getInventory } from '../../api/stockApi';

import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const Reports_Printing = () => {
    const [loading, setLoading] = useState(false);
    const [category, setCategory] = useState("sales"); 
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [rawData, setRawData] = useState([]);
    const [filteredData, setFilteredData] = useState([]); 
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

    // HSN Mapping Logic
    const getHSNCode = (productName) => {
        const name = productName?.toUpperCase() || "";
        if (name.includes("CATTLE FEED")) return "23099010";
        if (name.includes("CORN GRIT")) return "11031300";
        if (name.includes("MAIZE") || name === "CORN") return "10059000";
        if (name.includes("RICE")) return "10064000";
        return "00000000";
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            let res;
            if (category === "sales") res = await getAllSales();
            else if (category === "purchases") res = await getAllPurchases();
            else res = await getInventory();

            if (res.data.success) {
                setRawData(res.data.data);
                setFilteredData([]); // Clear previous filters
            }
        } catch (err) {
            setSnackbar({ open: true, message: "डेटा लोड करने में विफल!", severity: "error" });
        } finally {
            setLoading(false);
        }
    }, [category]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleFilter = () => {
        let temp = [...rawData];
        if (startDate && endDate && category !== "stock") {
            temp = temp.filter(item => item.date >= startDate && item.date <= endDate);
        }
        
        // Ledger Sorting (Date Wise)
        temp.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        setFilteredData(temp);
        setSnackbar({ open: true, message: `${temp.length} रिकॉर्ड मिले!`, severity: "success" });
    };

    const downloadExcel = () => {
        const excelData = filteredData.map((inv, index) => {
            if (category === "stock") {
                return {
                    "S.No": index + 1,
                    "Product Name": inv.productName,
                    "HSN": getHSNCode(inv.productName),
                    "Opening": inv.openingStock || 0,
                    "Stock In (Cr)": inv.stockIn || 0,
                    "Stock Out (Dr)": inv.stockOut || 0,
                    "Closing Balance": inv.balance || 0,
                    "Unit": inv.unit || "KGS"
                };
            }
            return {
                "Date": new Date(inv.date).toLocaleDateString('en-GB'),
                "Invoice No": inv.billNo || inv.invoiceNo,
                "Party Name": inv.customerName || inv.supplierName,
                "GSTIN": inv.gstin || "URD",
                "Product Detail": inv.goods?.map(g => g.product).join(", ") || inv.productName,
                "Taxable Value": inv.taxableAmount || inv.taxableValue,
                "GST Amount": (inv.cgst + inv.sgst + inv.igst).toFixed(2),
                "Total Amount": inv.totalAmount
            };
        });

        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Report");
        XLSX.writeFile(wb, `${category}_report.xlsx`);
    };

    const handlePrint = () => window.print();

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8">
            {loading && <Loader />}
            
            {/* Control Panel */}
            <div className="no-print max-w-7xl mx-auto bg-white dark:bg-zinc-900 rounded-[2rem] shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden mb-10">
                <div className="bg-emerald-600 p-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <FileSearch size={22} />
                        <h2 className="text-xl font-black uppercase tracking-tighter">Report & Ledger Center</h2>
                    </div>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-zinc-400">Report Type</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl text-xs font-bold outline-none border-none">
                            <option value="sales">Sales Ledger (Sales Register)</option>
                            <option value="purchases">Purchase Ledger (Purchase Register)</option>
                            <option value="stock">Inventory & Stock Statement</option>
                        </select>
                    </div>

                    {category !== "stock" && (
                        <div className="md:col-span-2 grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-zinc-400">From Date</label>
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl text-xs font-bold outline-none border-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-zinc-400">To Date</label>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl text-xs font-bold outline-none border-none" />
                            </div>
                        </div>
                    )}

                    <div className="md:col-span-3 flex justify-end gap-3 pt-4 border-t dark:border-zinc-800">
                        <button onClick={handleFilter} className="px-8 py-3 bg-zinc-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">Generate Ledger</button>
                        <button onClick={downloadExcel} disabled={filteredData.length === 0} className="flex items-center gap-2 px-6 py-3 bg-emerald-100 text-emerald-700 rounded-xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50"><FileSpreadsheet size={16}/> Excel</button>
                        <button onClick={handlePrint} disabled={filteredData.length === 0} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50"><Printer size={16}/> Print</button>
                    </div>
                </div>
            </div>

            {/* Ledger Table Section */}
            <div id="printable-report" className="max-w-7xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                {filteredData.length > 0 ? (
                    <div className="p-8">
                        <div className="hidden print:block border-b-2 border-zinc-900 mb-8 pb-4">
                            <h1 className="text-3xl font-black text-zinc-900">DHARA SHAKTI AGRO PRODUCTS</h1>
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">{category.toUpperCase()} LEDGER STATEMENT</p>
                            <p className="text-[10px] mt-2">Period: {startDate || 'All'} to {endDate || 'Today'}</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-[10px] font-black uppercase tracking-widest border-b border-zinc-200 dark:border-zinc-700">
                                        <th className="px-4 py-4">S.No</th>
                                        <th className="px-4 py-4">Date / Invoice</th>
                                        <th className="px-4 py-4">Details / Party</th>
                                        <th className="px-4 py-4 text-right">Taxable</th>
                                        <th className="px-4 py-4 text-right">GST</th>
                                        <th className="px-4 py-4 text-right bg-zinc-100/50 dark:bg-zinc-800/20">Net Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[11px]">
                                    {filteredData.map((item, i) => (
                                        <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/50 transition-colors">
                                            <td className="px-4 py-4 text-zinc-400 font-bold">{i + 1}</td>
                                            <td className="px-4 py-4">
                                                <div className="font-bold">{item.date ? new Date(item.date).toLocaleDateString('en-GB') : '-'}</div>
                                                <div className="text-[9px] text-zinc-500 font-black">#{item.billNo || item.invoiceNo || 'N/A'}</div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="font-black uppercase text-zinc-900 dark:text-zinc-100">{item.customerName || item.supplierName || item.productName}</div>
                                                <div className="text-[9px] text-emerald-600 font-bold uppercase">HSN: {getHSNCode(item.goods?.[0]?.product || item.productName)}</div>
                                            </td>
                                            <td className="px-4 py-4 text-right font-bold text-zinc-600">₹{(item.taxableAmount || item.taxableValue || 0).toLocaleString()}</td>
                                            <td className="px-4 py-4 text-right font-bold text-zinc-600">₹{( (item.cgst || 0) + (item.sgst || 0) + (item.igst || 0) ).toFixed(2)}</td>
                                            <td className="px-4 py-4 text-right font-black text-zinc-900 dark:text-white bg-zinc-50/30">₹{(item.totalAmount || item.balance || 0).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-zinc-900 text-white font-black text-[11px] print:bg-zinc-100 print:text-black">
                                    <tr>
                                        <td colSpan="3" className="px-4 py-6 text-right uppercase tracking-widest opacity-60">Grand Total Amount:</td>
                                        <td colSpan="3" className="px-4 py-6 text-right text-base underline decoration-double">
                                            ₹{filteredData.reduce((sum, item) => sum + (item.totalAmount || item.balance || 0), 0).toLocaleString()}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="p-20 text-center text-zinc-400 font-black uppercase tracking-widest">
                        फिल्टर सेट करें और डेटा जेनरेट करें
                    </div>
                )}
            </div>

            <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />
        </div>
    );
};

export default Reports_Printing;