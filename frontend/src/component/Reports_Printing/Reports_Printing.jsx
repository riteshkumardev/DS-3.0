import React, { useState, useEffect, useCallback } from 'react';
import { 
  Printer, FileSearch, Calendar, Hash, Download, FileSpreadsheet, Package 
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
                setFilteredData([]); 
            }
        } catch (err) {
            setSnackbar({ open: true, message: "Sync Error!", severity: "error" });
        } finally {
            setLoading(false);
        }
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
        
        // Sorting: Latest Date First
        temp.sort((a, b) => new Date(b.date || b.purchaseDate || b.createdAt) - new Date(a.date || a.purchaseDate || a.createdAt));
        
        setFilteredData(temp);
        setSnackbar({ open: true, message: `${temp.length} Records Found`, severity: "success" });
    };

    const downloadExcel = () => {
        const excelData = filteredData.map((inv, index) => {
            if (category === "stock") {
                return {
                    "S.No": index + 1,
                    "Product": inv.name,
                    "HSN": inv.hsnCode,
                    "Opening": inv.minStockLevel || 0,
                    "Current Stock": inv.currentStock || 0,
                    "Unit": inv.unit || "KG"
                };
            }
            return {
                "Date": new Date(inv.date || inv.purchaseDate).toLocaleDateString('en-GB'),
                "Invoice No": inv.billNo,
                "Party": inv.customerName || inv.supplierName,
                "GST Type": inv.gstType,
                "Taxable": inv.subTotal || 0,
                "GST": (inv.cgst + inv.sgst + inv.igst).toFixed(2),
                "Total": inv.grandTotal
            };
        });

        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Report");
        XLSX.writeFile(wb, `${category}_report.xlsx`);
    };

    const handlePrint = () => {
        const printContent = document.getElementById("printable-report").innerHTML;
        const windowUrl = 'about:blank';
        const uniqueName = new Date();
        const windowName = 'Print' + uniqueName.getTime();
        const printWindow = window.open(windowUrl, windowName, 'left=0,top=0,width=900,height=900,toolbar=0,scrollbars=0,status=0');

        printWindow.document.write(`
            <html>
                <head>
                    <title>Dhara Shakti Report</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 10px; font-size: 11px; text-align: left; }
                        th { background-color: #f8f9fa; color: #000; font-weight: 800; text-transform: uppercase; }
                        .header { text-align: center; border-bottom: 3px solid #059669; padding-bottom: 15px; margin-bottom: 20px; }
                        .header h1 { margin: 0; font-size: 24px; color: #059669; }
                        .footer { margin-top: 30px; font-size: 10px; color: #777; display: flex; justify-content: space-between; }
                        .no-print { display: none; }
                        .text-right { text-align: right; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>DHARA SHAKTI AGRO PRODUCTS</h1>
                        <p style="text-transform: uppercase; letter-spacing: 2px; font-weight: bold; margin-top: 5px;">
                            ${category} Statement Ledger
                        </p>
                    </div>
                    ${printContent}
                    <div class="footer">
                        <span>Generated by ERP System • ${new Date().toLocaleString()}</span>
                        <span>Authorized Signatory _________________</span>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8">
            {loading && <Loader />}
            
            <div className="no-print max-w-7xl mx-auto bg-white dark:bg-zinc-900 rounded-[2rem] shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden mb-10">
                <div className="bg-emerald-600 p-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <FileSearch size={22} />
                        <h2 className="text-xl font-black uppercase tracking-tighter text-white">Ledger Reports</h2>
                    </div>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-zinc-400">Report Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl text-xs font-bold border-none">
                            <option value="sales">SALES REGISTER</option>
                            <option value="purchases">PURCHASE REGISTER</option>
                            <option value="stock">STOCK INVENTORY</option>
                        </select>
                    </div>

                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-zinc-400">From Date</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl text-xs font-bold border-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-zinc-400">To Date</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl text-xs font-bold border-none" />
                        </div>
                    </div>

                    <div className="md:col-span-3 flex justify-end gap-3 pt-4 border-t dark:border-zinc-800">
                        <button onClick={handleFilter} className="px-8 py-3 bg-zinc-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">Generate</button>
                        <button onClick={downloadExcel} disabled={filteredData.length === 0} className="flex items-center gap-2 px-6 py-3 bg-emerald-100 text-emerald-700 rounded-xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50"><FileSpreadsheet size={16}/> Excel</button>
                        <button onClick={handlePrint} disabled={filteredData.length === 0} className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest disabled:opacity-50"><Printer size={16}/> Print</button>
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
                                        <th className="px-4 py-4">S.No</th>
                                        <th className="px-4 py-4">{category === 'stock' ? 'Product' : 'Date / Invoice'}</th>
                                        <th className="px-4 py-4">{category === 'stock' ? 'Category' : 'Party Details'}</th>
                                        <th className="px-4 py-4 text-right">{category === 'stock' ? 'Min Lvl' : 'Taxable'}</th>
                                        <th className="px-4 py-4 text-right">{category === 'stock' ? 'Unit' : 'GST Amount'}</th>
                                        <th className="px-4 py-4 text-right bg-zinc-100/50 dark:bg-zinc-800/20">Total / Bal</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[11px]">
                                    {filteredData.map((item, i) => {
                                        const hsn = category === 'stock' ? item.hsnCode : getHSNCode(item.goods?.[0]?.productName || item.items?.[0]?.productName);
                                        const totalGst = (item.cgst || 0) + (item.sgst || 0) + (item.igst || 0);
                                        
                                        return (
                                            <tr key={item._id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/50 transition-colors">
                                                <td className="px-4 py-4 text-zinc-400 font-bold">{i + 1}</td>
                                                <td className="px-4 py-4">
                                                    <div className="font-black text-zinc-900 dark:text-white uppercase">{item.name || item.billNo}</div>
                                                    <div className="text-[9px] text-zinc-400">{item.date || item.purchaseDate ? new Date(item.date || item.purchaseDate).toLocaleDateString('en-GB') : 'N/A'}</div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="font-bold text-zinc-700 dark:text-zinc-300 uppercase">{item.customerName || item.supplierName || item.category}</div>
                                                    <div className="text-[9px] text-emerald-600 font-black">HSN: {hsn}</div>
                                                </td>
                                                <td className="px-4 py-4 text-right font-bold">₹{(item.subTotal || item.minStockLevel || 0).toLocaleString()}</td>
                                                <td className="px-4 py-4 text-right font-bold text-zinc-500">{category === 'stock' ? item.unit : `₹${totalGst.toFixed(2)}`}</td>
                                                <td className="px-4 py-4 text-right font-black text-zinc-900 dark:text-white bg-zinc-50/30">₹{(item.grandTotal || item.currentStock || 0).toLocaleString()}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="bg-zinc-900 text-white font-black text-[11px] print:bg-zinc-100 print:text-black">
                                    <tr>
                                        <td colSpan="3" className="px-4 py-6 text-right uppercase tracking-widest opacity-60">Report Summary:</td>
                                        <td colSpan="3" className="px-4 py-6 text-right text-base underline decoration-double">
                                            ₹{filteredData.reduce((sum, item) => sum + (item.grandTotal || item.currentStock || 0), 0).toLocaleString()}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="p-20 text-center text-zinc-400 font-black uppercase tracking-widest flex flex-col items-center gap-4">
                        <Package size={40} className="opacity-20" />
                        NO DATA GENERATED. SELECT FILTERS ABOVE.
                    </div>
                )}
            </div>

            <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />
        </div>
    );
};

export default Reports_Printing;