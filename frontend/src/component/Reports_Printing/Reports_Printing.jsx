import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx'; // Import Excel Library
import { 
  Printer, FileSearch, Calendar, Hash,
  User, Package, Table as TableIcon, Download, FileSpreadsheet 
} from "lucide-react";

import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";
import ReportTable from './ReportTable';

const Reports_Printing = () => {
    const [loading, setLoading] = useState(false);
    const [category, setCategory] = useState("sales"); 
    const [productFilter, setProductFilter] = useState("All");
    const [selectedPerson, setSelectedPerson] = useState("All"); 
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [sortMode, setSortMode] = useState("date"); 
    const [rawData, setRawData] = useState([]);
    const [filteredData, setFilteredData] = useState([]); 
    const [personList, setPersonList] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
    const COMPANY_GSTIN = process.env.REACT_APP_GSTIN || "10ABCDE1234F1Z5";

    const productCategories = [
        "Corn", "Corn Grit", "Corn Grit 3mm", "Cattle Feed", 
        "Rice Grit", "Rice Flour", "Packing Bag", "Rice Broken"
    ];

    // ✅ HSN Logic for both Table and Excel
    const getHSNCode = (productName) => {
        const name = productName?.toUpperCase().trim() || "";
        if (name.includes("CATTLE FEED")) return "23099010";
        if (name.includes("CORN GRIT")) return "11031300";
        if (name.includes("CORN FLOUR")) return "11022000";
        if (name === "CORN" || name.includes("MAIZE")) return "10059000";
        if (name.includes("RICE GRIT")) return "10064000";
        if (name.includes("RICE FLOUR")) return "11022000";
        if (name.includes("RICE BROKEN")) return "10064010";
        if (name.includes("BAG")) return "63053300";
        return "00000000";
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const endpoint = category === "stock" ? "stocks" : category;
            const res = await axios.get(`${API_URL}/api/${endpoint}`);
            if (res.data.success) {
                const list = res.data.data;
                setRawData(list);
                setFilteredData([]);
                generatePersonList(list, category);
            }
        } catch (err) {
            setSnackbar({ open: true, message: "डेटा लोड करने में त्रुटि!", severity: "error" });
        } finally {
            setTimeout(() => setLoading(false), 400);
        }
    }, [category, API_URL]);

    useEffect(() => {
        fetchData();
        setProductFilter("All");
        setSelectedPerson("All");
    }, [fetchData]);

    const generatePersonList = (data, cat) => {
        if (cat === "stock") {
            setPersonList([]);
            return;
        }
        let names = [];
        if (cat === "sales") names = [...new Set(data.map(item => item.customerName))];
        if (cat === "purchases") names = [...new Set(data.map(item => item.supplierName))];
        setPersonList(names.filter(Boolean).sort());
    };

    const handleFilter = () => {
        let temp = [...rawData];
        if (startDate && endDate && category !== "stock") {
            temp = temp.filter(item => item.date >= startDate && item.date <= endDate);
        }
        if (selectedPerson !== "All" && category !== "stock") {
            temp = temp.filter(item => item.customerName === selectedPerson || item.supplierName === selectedPerson);
        }
        if (productFilter !== "All") {
            temp = temp.filter(item => {
                const pName = item.productName || "";
                const inGoods = item.goods && item.goods.some(g => g.product.toLowerCase().includes(productFilter.toLowerCase()));
                return pName.toLowerCase().includes(productFilter.toLowerCase()) || inGoods;
            });
        }
        temp.sort((a, b) => {
            if (sortMode === 'hsn') {
                const hsnA = getHSNCode(category === "sales" ? a.goods?.[0]?.product : (a.productName || ""));
                const hsnB = getHSNCode(category === "sales" ? b.goods?.[0]?.product : (b.productName || ""));
                return hsnA.localeCompare(hsnB);
            }
            return new Date(a.date) - new Date(b.date);
        });
        setFilteredData(temp);
        setSnackbar({ open: true, message: `${temp.length} रिकॉर्ड मिले!`, severity: "success" });
    };

  // ✅ UPDATED EXCEL DOWNLOAD FUNCTION
const downloadExcel = () => {
    if (filteredData.length === 0) return;

    // Helper to prevent .toUpperCase() errors on non-string values
    const safeHSNLookup = (val) => {
        if (!val) return "";
        return String(val).toUpperCase(); 
    };

    const excelData = filteredData.map(inv => {
        // --- STOCK CATEGORY LOGIC ---
        if (category === "stock") {
            return {
                "Product Name": inv.productName || "N/A",
                "HSN Code": safeHSNLookup(inv.productName),
                "Stock In": Number(inv.stockIn || 0),
                "Stock Out": Number(inv.stockOut || 0),
                "Current Balance": Number(inv.balance || 0),
                "Unit": inv.unit || "KGS"
            };
        }
        
        // --- INVOICE/BILLING LOGIC ---
        
        // 1. Get first item safely for HSN/Rate lookups
        const firstItem = inv.goods?.[0] || {};
        
        // 2. Format Product Names list
        const productNames = inv.goods?.map(g => g.product).filter(Boolean).join(", ") 
                             || inv.productName 
                             || "";

        // 3. Fix: Extract HSN only for the product, use raw values for numbers
        const primaryHSN = getHSNCode(inv.goods?.[0]?.product || inv.productName);
        const rateValue = Number(firstItem.rate || 0);
        const quantityValue = Number(firstItem.quantity || 0);

        return {
            "Date": inv.date || "",
            "Bill No": inv.billNo || "",
            "Party Name": inv.customerName || inv.supplierName || "URD/Cash",
            "GSTIN": inv.gstin || "URD",
            "Product": productNames,
            "HSN Code": primaryHSN,
            "Taxable Value": Number(inv.taxableValue || inv.taxableAmount || 0),
            "CGST": Number(inv.cgst || 0),
            "SGST": Number(inv.sgst || 0),
            "IGST": Number(inv.igst || 0),
            "RATE": rateValue,
            "QUANTITY": quantityValue,
            "Total Amount": Number(inv.totalAmount || 0)
        };
    });

    // Generate Excel File
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "GST_Report");

    // Auto-adjust column widths
    if (excelData.length > 0) {
        worksheet['!cols'] = Object.keys(excelData[0]).map(() => ({ wch: 18 }));
    }

    // Trigger Download
    const fileName = `${category}_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    setSnackbar({ 
        open: true, 
        message: "Excel report generated successfully!", 
        severity: "success" 
    });
};

    // ✅ FIXED JSON DOWNLOAD FUNCTION (FOR GSTR-1 UPLOAD)
    const downloadJSON = () => {
        if (filteredData.length === 0) return;
        
        const getReturnPeriod = () => {
            const d = new Date();
            return `${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear()}`;
        };

        const b2bMap = {};
        const b2cs = [];
        const hsnSummary = [];

        filteredData.forEach(inv => {
            // Fix POS Logic: If invalid, use Company State Code
            let pos = inv.gstin && inv.gstin.length >= 2 ? inv.gstin.substring(0, 2) : COMPANY_GSTIN.substring(0, 2);
            if(isNaN(pos)) pos = COMPANY_GSTIN.substring(0, 2);

            const isInterstate = pos !== COMPANY_GSTIN.substring(0, 2);
            const itemsList = inv.goods || [{ product: inv.productName, taxableAmount: inv.taxableValue, hsn: getHSNCode(inv.productName) }];

            const processedItems = itemsList.map((g, index) => {
                const txval = parseFloat(g.taxableAmount || 0);
                const rt = 5; // Default 5% as per your requirement
                
                // Calculate Tax if missing
                let iamt = 0, camt = 0, samt = 0;
                if (isInterstate) {
                    iamt = parseFloat((txval * rt / 100).toFixed(2));
                } else {
                    camt = parseFloat((txval * (rt/2) / 100).toFixed(2));
                    samt = parseFloat((txval * (rt/2) / 100).toFixed(2));
                }

                // Collect for HSN Summary
                hsnSummary.push({
                    hsn_sc: g.hsn || getHSNCode(g.product),
                    desc: "FOOD PRODUCTS",
                    uqc: "KGS",
                    qty: g.quantity || 0,
                    rt: rt,
                    txval: txval,
                    iamt: iamt,
                    camt: camt,
                    samt: samt,
                    csamt: 0
                });

                return {
                    num: index + 1,
                    itm_det: {
                        txval: txval,
                        rt: rt,
                        iamt: iamt,
                        camt: camt,
                        samt: samt,
                        csamt: 0
                    }
                };
            });

            const invoiceObj = {
                inum: String(inv.billNo),
                idt: new Date(inv.date).toLocaleDateString('en-GB').replace(/\//g, '-'),
                val: parseFloat(inv.totalAmount),
                pos: pos,
                rchrg: "N",
                inv_typ: "R",
                itms: processedItems
            };

            // Categorize into B2B or B2CS
            if (inv.gstin && inv.gstin.length === 15 && !inv.gstin.includes("URD")) {
                if (!b2bMap[inv.gstin]) b2bMap[inv.gstin] = { ctin: inv.gstin, inv: [] };
                b2bMap[inv.gstin].inv.push(invoiceObj);
            } else {
                processedItems.forEach(item => {
                    b2cs.push({
                        sply_ty: isInterstate ? "INTER" : "INTRA",
                        pos: pos,
                        rt: item.itm_det.rt,
                        txval: item.itm_det.txval,
                        iamt: item.itm_det.iamt,
                        camt: item.itm_det.camt,
                        samt: item.itm_det.samt,
                        csamt: 0
                    });
                });
            }
        });

        const finalJSON = {
            gstin: COMPANY_GSTIN,
            fp: getReturnPeriod(),
            gt: 0, cur_gt: 0,
            version: "GST2.2.4",
            b2b: Object.values(b2bMap),
            b2cs: b2cs,
            hsn: { data: hsnSummary }
        };

        const blob = new Blob([JSON.stringify(finalJSON, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `GSTR1_FIXED_${getReturnPeriod()}.json`;
        link.click();
        setSnackbar({ open: true, message: "Corrected JSON Downloaded!", severity: "success" });
    };

    const handlePrint = () => {
        const element = document.getElementById("printable-report");
        if (!element) return;
        const printContents = element.innerHTML;
        const newWindow = window.open("", "_blank");
        newWindow.document.write(`
            <html>
                <head>
                    <title>Dhara Shakti - Report</title>
                    <style>
                        body { font-family: sans-serif; padding: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; font-size: 11px; text-align: left; }
                        th { background-color: #f4f4f4; font-weight: bold; }
                        .print-header { text-align: center; border-bottom: 2px solid #059669; padding-bottom: 10px; }
                    </style>
                </head>
                <body>
                    <div class="print-header">
                        <h2>Dhara Shakti Agro Industries</h2>
                        <p>Report: ${category.toUpperCase()} | Date: ${new Date().toLocaleDateString()}</p>
                    </div>
                    ${printContents}
                </body>
            </html>
        `);
        newWindow.document.close();
        newWindow.print();
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8">
            {loading && <Loader />}
            
            <div className="no-print max-w-7xl mx-auto bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden mb-10">
                <div className="bg-emerald-600 p-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <FileSearch size={22} />
                        <h2 className="text-xl font-black uppercase tracking-tighter">Report Center</h2>
                    </div>
                    
                    <div className="flex bg-emerald-700/50 p-1 rounded-xl">
                        <button onClick={() => setSortMode('date')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${sortMode === 'date' ? 'bg-white text-emerald-700 shadow-lg' : 'text-emerald-100'}`}>
                            <Calendar size={14} className="inline mr-1"/> Date Wise
                        </button>
                        <button onClick={() => setSortMode('hsn')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${sortMode === 'hsn' ? 'bg-white text-emerald-700 shadow-lg' : 'text-emerald-100'}`}>
                            <Hash size={14} className="inline mr-1"/> HSN Wise
                        </button>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-zinc-400">Category</label>
                            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl text-xs font-bold border-none outline-none focus:ring-2 focus:ring-emerald-500/50">
                                <option value="sales">Sales Ledger</option>
                                <option value="purchases">Purchases Ledger</option>
                                <option value="stock">Inventory Summary</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-zinc-400">Product</label>
                            <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl text-xs font-bold border-none outline-none focus:ring-2 focus:ring-emerald-500/50">
                                <option value="All">All Items</option>
                                {productCategories.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>

                        {category !== "stock" && (
                            <>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-zinc-400">Party</label>
                                    <select value={selectedPerson} onChange={(e) => setSelectedPerson(e.target.value)} className="w-full bg-zinc-100 dark:bg-zinc-800 p-3 rounded-xl text-xs font-bold border-none outline-none focus:ring-2 focus:ring-emerald-500/50">
                                        <option value="All">All Parties</option>
                                        {personList.map((name, i) => <option key={i} value={name}>{name}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-zinc-400">Date Range</label>
                                    <div className="flex gap-2">
                                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-1/2 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-xl text-[10px] font-bold outline-none" />
                                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-1/2 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-xl text-[10px] font-bold outline-none" />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex flex-wrap justify-end gap-4 pt-6 border-t dark:border-zinc-800">
                        <button onClick={handleFilter} className="px-8 py-3 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg">Generate Data</button>
                        
                        <button onClick={downloadExcel} disabled={filteredData.length === 0} className="flex items-center gap-2 px-6 py-3 bg-emerald-100 text-emerald-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-200 transition-all disabled:opacity-50">
                            <FileSpreadsheet size={16}/> Excel (HSN)
                        </button>

                        <button onClick={downloadJSON} disabled={filteredData.length === 0} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50">
                            <Download size={16}/> JSON (GSTR-1)
                        </button>

                        <button onClick={handlePrint} disabled={filteredData.length === 0} className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all disabled:opacity-50">
                            <Printer size={16}/> Print
                        </button>
                    </div>
                </div>
            </div>

            <div id="printable-report" className="max-w-7xl mx-auto">
                {filteredData.length > 0 && <ReportTable category={category} filteredData={filteredData} />}
            </div>

            {filteredData.length === 0 && (
                <div className="no-print max-w-7xl mx-auto p-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[3rem]">
                    <p className="text-zinc-400 font-bold uppercase tracking-widest">फिल्टर चुनें और Generate Data पर क्लिक करें</p>
                </div>
            )}

            <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />
        </div>
    );
};

export default Reports_Printing;