import React, { useState, useEffect, useCallback } from 'react';
import { 
  History, Search, Filter, Clock, User, 
  ShieldCheck, FileDown, RefreshCcw, LayoutGrid,
  ChevronLeft, ChevronRight, Activity, Terminal
} from "lucide-react";

// ✅ API Import
import { getSystemLogs } from "../../api/logApi"; 

import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const AuditPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  const showMsg = (msg, type = "info") => setSnackbar({ open: true, message: msg, severity: type });

  // --- 🔄 FETCH LOGS (Paginated) ---
  const fetchLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await getSystemLogs(page); 
      if (res.data.success) {
        setLogs(res.data.data);
        setTotalPages(res.data.pagination?.pages || 1);
        setCurrentPage(page);
      }
    } catch (err) {
      showMsg("Logs load karne mein samasya!", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(1); }, [fetchLogs]);

  // --- 📊 EXPORT CSV ---
  const exportToCSV = () => {
    if (logs.length === 0) return;
    const headers = ["Timestamp", "User", "Module", "Action", "Status"];
    const csvRows = [
      headers.join(','),
      ...logs.map(log => [
        `"${new Date(log.createdAt).toLocaleString()}"`,
        `"${log.performedBy?.name || log.adminName || 'System'}"`,
        `"${log.module || 'SYSTEM'}"`,
        `"${log.action.replace(/"/g, '""')}"`,
        `"SECURE"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Audit_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 🎨 DYNAMIC BADGE STYLES ---
  const getBadgeStyle = (mod) => {
    const base = "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ";
    switch (mod?.toUpperCase()) {
      case 'SALE': return base + "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case 'PURCHASE': return base + "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case 'STOCK': return base + "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case 'STAFF': return base + "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case 'LEDGER': return base + "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      default: return base + "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
    }
  };

  const filteredLogs = logs.filter(log => {
    const name = (log.performedBy?.name || log.adminName || "").toLowerCase();
    const action = (log.action || "").toLowerCase();
    const term = search.toLowerCase();
    const matchesSearch = name.includes(term) || action.includes(term);
    const matchesModule = moduleFilter === "All" || log.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  if (loading && logs.length === 0) return <Loader />;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-10 font-sans text-left">
      <div className="max-w-screen-2xl mx-auto space-y-6">
        
        {/* --- HEADER COMMAND BAR --- */}
        <div className="bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all">
          <div className="bg-zinc-900 p-8 flex flex-col xl:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-emerald-600 rounded-[1.5rem] text-white shadow-xl shadow-emerald-600/20 rotate-3 group hover:rotate-0 transition-transform cursor-pointer">
                 <Terminal size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">Security Audit</h1>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mt-3">Live System Integrity Logs</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500" size={18} />
                <input 
                  placeholder="Search activity..." 
                  className="pl-12 pr-6 py-4 bg-zinc-800 border-none rounded-2xl text-xs font-bold text-white outline-none w-64 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-zinc-600"
                  value={search} onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-3 bg-zinc-800 px-5 rounded-2xl border border-zinc-700">
                 <Filter size={16} className="text-emerald-500" />
                 <select 
                   value={moduleFilter} 
                   onChange={(e) => setModuleFilter(e.target.value)}
                   className="bg-transparent text-zinc-400 text-[10px] font-black uppercase py-4 border-none outline-none cursor-pointer"
                 >
                   <option value="All">All Modules</option>
                   <option value="SALE">Sales Engine</option>
                   <option value="PURCHASE">Procurement</option>
                   <option value="STOCK">Inventory</option>
                   <option value="STAFF">Staffing</option>
                   <option value="LEDGER">Financials</option>
                 </select>
              </div>
              
              <button onClick={() => fetchLogs(1)} className="p-4 bg-zinc-800 text-zinc-400 rounded-2xl hover:text-white hover:bg-zinc-700 transition-all border border-zinc-700">
                <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
              </button>

              <button 
                onClick={exportToCSV}
                className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-900/20 active:scale-95"
              >
                <FileDown size={18} /> Export Data
              </button>
            </div>
          </div>

          {/* --- TABLE AREA --- */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 text-[10px] font-black uppercase tracking-[0.3em] border-b dark:border-zinc-800">
                  <th className="px-10 py-8">Operator Identity</th>
                  <th className="px-10 py-8 text-center">Protocol</th>
                  <th className="px-10 py-8">Activity Description</th>
                  <th className="px-10 py-8">Execution Time</th>
                  <th className="px-10 py-8 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredLogs.map((log, i) => (
                  <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-all group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 font-black text-sm border border-zinc-200 dark:border-zinc-700 group-hover:border-emerald-500/50 transition-colors">
                          {log.performedBy?.name?.charAt(0) || log.adminName?.charAt(0) || 'S'}
                        </div>
                        <div className="flex flex-col">
                           <span className="text-sm font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-tight">{log.performedBy?.name || log.adminName || 'System'}</span>
                           <span className="text-[9px] font-bold text-zinc-400">ID: {log.performedBy?._id?.slice(-6) || '---'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <span className={getBadgeStyle(log.module)}>
                        {log.module || "SYSTEM"}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400 leading-relaxed italic group-hover:text-emerald-500 transition-colors">
                        {log.action}
                      </p>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-3 text-[11px] font-black text-zinc-400 uppercase tracking-tighter">
                        <Clock size={14} className="text-emerald-500" />
                        {new Date(log.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-xl text-[10px] font-black uppercase border border-emerald-100 dark:border-emerald-800 shadow-sm">
                        <ShieldCheck size={12} /> Verified
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --- PAGINATION FOOTER --- */}
          <div className="p-8 border-t dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-6 bg-zinc-50/50 dark:bg-zinc-800/20">
             <div className="flex items-center gap-4">
                <Activity size={18} className="text-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  Total Analysis: {filteredLogs.length} Records Detected
                </span>
             </div>
             
             <div className="flex items-center gap-3">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => fetchLogs(currentPage - 1)}
                  className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 disabled:opacity-30 transition-all shadow-sm"
                >
                  <ChevronLeft size={20}/>
                </button>
                <div className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-xs font-black tracking-widest">
                   {currentPage} / {totalPages}
                </div>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => fetchLogs(currentPage + 1)}
                  className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-50 disabled:opacity-30 transition-all shadow-sm"
                >
                  <ChevronRight size={20}/>
                </button>
             </div>
          </div>
        </div>

        {filteredLogs.length === 0 && !loading && (
          <div className="py-32 text-center animate-in fade-in zoom-in duration-700">
            <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <LayoutGrid size={40} className="text-zinc-300 dark:text-zinc-600" />
            </div>
            <p className="text-zinc-400 font-black uppercase tracking-[0.4em] text-[10px]">Zero records found in this sequence</p>
          </div>
        )}
      </div>

      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({...snackbar, open: false})} />
    </div>
  );
};

export default AuditPage;