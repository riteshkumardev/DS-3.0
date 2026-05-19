import React, { useState, useEffect, useCallback } from 'react';
import { 
  Printer, Calendar, Package, User, Tag, ArrowDownCircle, ArrowUpCircle, 
  BookOpen
} from "lucide-react";

// 🚀 Centralized API Imports (Strict Token Instance Synchronized)
import { getAllSales } from '../../api/saleApi';
import { getAllPurchases } from '../../api/purchaseApi';
import { getInventory } from '../../api/stockApi';
import { getAllProducts } from '../../api/productApi';
import { fetchParties } from '../../api/partyApi'; // 🚀 Raw Axios bypass fixed

import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const getDaysInMonth = (monthStr) => {
  if (!monthStr) return 30;
  const [year, month] = monthStr.split('-').map(Number);
  return new Date(year, month, 0).getDate();
};

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

  // Fetch dropdown lists using centralized configured instances
  const fetchDropdowns = async () => {
    try {
      const [prodRes, partyRes] = await Promise.all([
        getAllProducts(),
        fetchParties() // 🚀 Fixed: Dynamic token validation headers injected seamlessly
      ]);
      if (prodRes.data?.success) setProducts(prodRes.data.data || []);
      if (partyRes.data?.success) setParties(partyRes.data.data || []);
    } catch (err) { 
      console.error("Dropdown loading failed inside Reports Center:", err); 
    }
  };

  useEffect(() => { 
    fetchDropdowns(); 
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (category === "sales") res = await getAllSales();
      else if (category === "purchases") res = await getAllPurchases();
      else res = await getInventory();

      if (res.data?.success) {
        setRawData(res.data.data || []);
        setFilteredData([]); // Clear previous table until manual filter button trigger
      }
    } catch (err) {
      setSnackbar({ open: true, message: "Sync Error loading category metrics!", severity: "error" });
    } finally { 
      setLoading(false); 
    }
  }, [category]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  // Core filter parser processing ledger aggregates rows
  const handleFilter = () => {
    if (!rawData || rawData.length === 0) {
      setSnackbar({ open: true, message: "No data available to filter!", severity: "warning" });
      return;
    }

    let temp = [...rawData];

    // 1. Date Range Filtering (Only if category is not stock)
    if (startDate && endDate && category !== "stock") {
      temp = temp.filter(item => {
        const dateStr = item.date || item.purchaseDate || item.createdAt;
        if (!dateStr) return false;
        const itemDate = String(dateStr).split('T')[0];
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    // 2. Party Filter Layer
    if (partyFilter !== "All" && category !== "stock") {
      temp = temp.filter(item => 
        (item.customerName && String(item.customerName).toUpperCase() === partyFilter.toUpperCase()) || 
        (item.supplierName && String(item.supplierName).toUpperCase() === partyFilter.toUpperCase())
      );
    }

    // 3. Product Sub-document Array Filter Matrix
    if (productFilter !== "All") {
      temp = temp.filter(item => {
        if (category === "stock") {
          return item.name && String(item.name).toUpperCase() === productFilter.toUpperCase();
        }
        const itemsList = item.goods || item.items || [];
        return itemsList.some(g => g.productName && String(g.productName).toUpperCase() === productFilter.toUpperCase());
      });
    }
    
    // 🚀 STOCK REPORT SPECIFIC PIPELINE BRANCHING
    if (category === "stock") {
      const processedStock = temp.map(item => ({
        ...item,
        debit: 0,
        credit: 0,
        runningBalance: Number(item.stock || item.quantity || 0)
      }));
      setFilteredData(processedStock);
      setSnackbar({ open: true, message: `${processedStock.length} Stock Records Filtered`, severity: "success" });
      return;
    }

    // 4. Ledger Sorting & Running Balance Generation (Sales / Purchases)
    temp.sort((a, b) => new Date(a.date || a.purchaseDate || a.createdAt) - new Date(b.date || b.purchaseDate || b.createdAt));
    
    let currentBal = 0;
    const processedLedger = temp.map(item => {
      const debit = Number(item.grandTotal || item.totalAmount || 0);
      const credit = Number(item.amountPaid || item.paidAmount || 0);
      
      // Sales: Debit increases receivable balance. Purchases: Debit tracking transaction total
      currentBal += (debit - credit);
      
      return { 
        ...item, 
        debit, 
        credit, 
        runningBalance: currentBal 
      };
    });

    setFilteredData(processedLedger);
    setSnackbar({ open: true, message: `${processedLedger.length} Ledger Records Generated`, severity: "success" });
  };

  const handlePrint = () => {
    const partyName = partyFilter === "All" ? "ALL WORKFORCE/PARTIES" : partyFilter.toUpperCase();
    const tableContent = document.getElementById("printable-report-content").innerHTML;
    
    // Totals extraction logic for document metadata strings injection
    const totalDr = filteredData.reduce((s, i) => s + (i.debit || 0), 0);
    const totalCr = filteredData.reduce((s, i) => s + (i.credit || 0), 0);
    const closingBal = filteredData.length > 0 ? filteredData[filteredData.length - 1].runningBalance : 0;

    const printWindow = window.open('', '_blank', 'width=1100,height=850');
    printWindow.document.write(`
      <html>
        <head>
          <title>Dharashakti_Report_${category}</title>
          <style>
            body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 30px; color: #1c1917; }
            .header { text-align: center; border-bottom: 3px solid #059669; padding-bottom: 15px; margin-bottom: 20px; }
            .company { font-size: 26px; font-weight: 900; color: #059669; text-transform: uppercase; margin: 0; tracking: -0.02em; }
            .title { font-size: 14px; font-weight: 700; color: #44403c; margin: 5px 0 0 0; text-transform: uppercase; }
            .meta-info { font-size: 11px; color: #78716c; margin-top: 4px; font-weight: 600; }
            .summary-card { display: flex; justify-content: space-between; background: #f0fdf4; border: 1px dashed #10b981; padding: 15px; border-radius: 12px; margin-bottom: 25px; font-size: 12px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { border: 1px solid #e7e5e4; padding: 10px; font-size: 10px; text-align: left; background-color: #f5f5f4; text-transform: uppercase; font-weight: 800; color: #44403c; }
            td { border: 1px solid #e7e5e4; padding: 10px; font-size: 11px; vertical-align: middle; }
            .text-right { text-align: right; }
            .font-black { font-weight: bold; }
            tfoot tr { background-color: #1c1917 !important; color: #ffffff !important; }
            tfoot td { color: #ffffff !important; font-weight: bold; padding: 12px 10px; border: none; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="company">DHARA SHAKTI AGRO PRODUCTS</h1>
            <p class="title">${category.toUpperCase()} LEDGER ACCOUNT STATEMENT</p>
            <p class="meta-info">Filter Target: ${partyName} | Product: ${productFilter.toUpperCase()}</p>
            <p class="meta-info">Period Matrix: ${startDate || 'Opening Statement'} To ${endDate || 'Current Live'}</p>
          </div>
          ${category !== 'stock' ? `
          <div class="summary-card">
            <span style="color:#dc2626;">Total Account Debit (Dr): ₹${totalDr.toLocaleString()}</span>
            <span style="color:#059669;">Total Account Credit (Cr): ₹${totalCr.toLocaleString()}</span>
            <span style="color:#1c1917;">Closing Net Ledger: ₹${Math.abs(closingBal).toLocaleString()} ${closingBal >= 0 ? 'Cr' : 'Dr'}</span>
          </div>` : ''}
          <div id="printed-table-wrapper">
            ${tableContent}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 font-sans">
      {loading && <Loader />}
      
      {/* Search and Filters Controller Dashboard Component */}
      <div className="no-print max-w-7xl mx-auto bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden mb-10 transition-all duration-300">
        <div className="bg-zinc-900 p-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <BookOpen size={22} className="text-emerald-500" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tighter leading-none">Finance Ledger Center</h2>
              <p className="text-[8px] font-bold text-zinc-500 tracking-[0.2em] uppercase mt-1">Dharashakti Centralized Audit Audit</p>
            </div>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button onClick={handleFilter} className="flex-1 sm:flex-none px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md">Generate Data</button>
            <button onClick={handlePrint} disabled={filteredData.length === 0} className="flex-1 sm:flex-none px-6 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 shadow-md">Print PDF</button>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Statement Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-white p-4 rounded-2xl text-xs font-black outline-none border border-zinc-100 dark:border-zinc-700 focus:border-emerald-500 cursor-pointer uppercase">
              <option value="sales">Sales (Receivables)</option>
              <option value="purchases">Purchases (Payables)</option>
              <option value="stock">Stock Inventory Report</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Party / Workforce</label>
            <select disabled={category === "stock"} value={partyFilter} onChange={e => setPartyFilter(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-white p-4 rounded-2xl text-xs font-black outline-none border border-zinc-100 dark:border-zinc-700 focus:border-emerald-500 cursor-pointer uppercase disabled:opacity-40">
              <option value="All">All Parties / Customers</option>
              {parties.map(p => <option key={p._id} value={p.name}>{p.name.toUpperCase()}</option>)}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Product Filter</label>
            <select value={productFilter} onChange={e => setProductFilter(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-white p-4 rounded-2xl text-xs font-black outline-none border border-zinc-100 dark:border-zinc-700 focus:border-emerald-500 cursor-pointer uppercase">
              <option value="All">All Products Inventory</option>
              {products.map(p => <option key={p._id} value={p.name}>{p.name.toUpperCase()}</option>)}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Date Range (From - To)</label>
            <div className="flex gap-2 w-full">
              <input disabled={category === "stock"} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-1/2 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-white p-3.5 rounded-2xl text-[10px] font-black outline-none border border-zinc-100 dark:border-zinc-700 focus:border-emerald-500 disabled:opacity-40" />
              <input disabled={category === "stock"} type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-1/2 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-white p-3.5 rounded-2xl text-[10px] font-black outline-none border border-zinc-100 dark:border-zinc-700 focus:border-emerald-500 disabled:opacity-40" />
            </div>
          </div>
        </div>
      </div>

      {/* Render Table Core Sheet Canvas Component Block */}
      <div id="printable-report" className="max-w-7xl mx-auto bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in fade-in duration-500">
        {filteredData.length > 0 ? (
          <div className="p-8" id="printable-report-content">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/60 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
                    <th className="px-6 py-5 w-12 text-center">#</th>
                    <th className="px-6 py-5">Date / Ref</th>
                    <th className="px-6 py-5">Description / Particulars Details</th>
                    <th className="px-6 py-5 text-right text-rose-500">Debit (Dr)</th>
                    <th className="px-6 py-5 text-right text-emerald-600">Credit (Cr)</th>
                    <th className="px-6 py-5 text-right bg-zinc-50/50 dark:bg-zinc-800/20 text-zinc-700 dark:text-zinc-300">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-[11px] font-bold">
                  {filteredData.map((item, i) => {
                    const cleanDate = item.date || item.purchaseDate || item.createdAt || new Date().toISOString();
                    const prodNames = category === "stock" 
                      ? "CURRENT ON-HAND PHYSICAL INVENTORY"
                      : (item.goods || item.items || []).map(g => g.productName?.toUpperCase()).join(", ");
                    
                    return (
                      <tr key={item._id || i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                        <td className="px-6 py-5 text-center text-zinc-400 font-mono">{i + 1}</td>
                        <td className="px-6 py-5">
                          <div className="font-black text-zinc-800 dark:text-zinc-200">{new Date(cleanDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                          <div className="text-[9px] text-zinc-400 font-mono tracking-wider mt-1">{item.billNo || item.invoiceNo || `SKU-${String(item._id).slice(-6).toUpperCase()}`}</div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="font-black text-zinc-700 dark:text-zinc-300 uppercase leading-none mb-1.5">{item.customerName || item.supplierName || item.name || "STOCK ITEM ENTRY"}</div>
                          <div className="text-[9px] text-emerald-600 dark:text-emerald-500/80 font-black italic tracking-wide leading-tight">{prodNames || "NO PRODUCTS ATTACHED"}</div>
                        </td>
                        <td className="px-6 py-5 text-right font-black text-rose-500 text-xs">
                          {category === "stock" ? "—" : `₹${Number(item.debit || 0).toLocaleString()}`}
                        </td>
                        <td className="px-6 py-5 text-right font-black text-emerald-600 text-xs">
                          {category === "stock" ? "—" : `₹${Number(item.credit || 0).toLocaleString()}`}
                        </td>
                        <td className="px-6 py-5 text-right font-black text-zinc-900 dark:text-white bg-zinc-50/10 text-xs">
                          {category === "stock" 
                            ? `${item.runningBalance} ${item.unit || 'PCS'}`
                            : `₹${item.runningBalance.toLocaleString()} ${item.runningBalance >= 0 ? 'Cr' : 'Dr'}`
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {category !== "stock" && (
                  <tfoot className="bg-zinc-900 text-white font-black text-[11px] border-t-2 border-zinc-950">
                    <tr>
                      <td colSpan="3" className="px-6 py-5 text-right uppercase tracking-widest text-zinc-400">Summary Ledger Balance Totals:</td>
                      <td className="px-6 py-5 text-right text-rose-400 text-xs">₹{filteredData.reduce((s, i) => s + i.debit, 0).toLocaleString()}</td>
                      <td className="px-6 py-5 text-right text-emerald-400 text-xs">₹{filteredData.reduce((s, i) => s + i.credit, 0).toLocaleString()}</td>
                      <td className="px-6 py-5 text-right text-sm underline text-cyan-400 font-black">
                        ₹{filteredData[filteredData.length - 1].runningBalance.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        ) : (
          <div className="p-32 text-center text-zinc-400 font-black uppercase tracking-widest flex flex-col items-center justify-center gap-4">
            <Package size={56} className="opacity-20 animate-pulse text-emerald-600" />
            <span className="text-xs">Click Generate Data button to render transaction history sheet</span>
          </div>
        )}
      </div>

      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({...snackbar, open: false})} />
    </div>
  );
};

export default Reports_Printing;