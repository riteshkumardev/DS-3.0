import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  History, Search, Filter, Clock, User, 
  ShieldCheck, FileDown, RefreshCcw, LayoutGrid
} from "lucide-react";
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const AuditPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/activity-logs`); 
      if (res.data.success) setLogs(res.data.data);
    } catch (err) {
      setSnackbar({ open: true, message: "डेटा लोड करने में विफल!", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  // --- 📊 EXPORT CSV LOGIC ---
  const exportToCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = ["Timestamp", "Verified Admin", "Module", "Action Performed"];
    const csvRows = [
      headers.join(','),
      ...filteredLogs.map(log => [
        `"${new Date(log.createdAt).toLocaleString()}"`,
        `"${log.adminName}"`,
        `"${log.module || 'SYSTEM'}"`,
        `"${log.action.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DS_Audit_Report_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 🎨 DYNAMIC MODULE BADGE STYLES ---
  const getBadgeStyle = (mod) => {
    const base = "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border shadow-sm ";
    switch (mod) {
      case 'SALES': return base + "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800";
      case 'PURCHASE': return base + "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800";
      case 'STOCK': return base + "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800";
      case 'ATTENDANCE': return base + "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800";
      case 'PAYROLL': return base + "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800";
      case 'AUTH': return base + "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800";
      default: return base + "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700";
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
        String(log.adminName || "").toLowerCase().includes(search.toLowerCase()) ||
        String(log.action || "").toLowerCase().includes(search.toLowerCase());
    const matchesModule = moduleFilter === "All" || log.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* --- HEADER --- */}
        <div className="bg-zinc-900 p-8 flex flex-col lg:flex-row justify-between items-center gap-6 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-2xl border border-emerald-500/40 animate-pulse">
               <History size={32} className="text-emerald-500" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-black text-white uppercase tracking-tighter italic">System Audit Trail</h1>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em]">DHARA SHAKTI AGRO MANAGEMENT</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                placeholder="Search history..." 
                className="pl-10 pr-4 py-3 bg-zinc-800 border-none rounded-xl text-xs font-bold text-white outline-none w-48 sm:w-64 focus:ring-2 focus:ring-emerald-500/50 transition-all"
                value={search} onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 bg-zinc-800 px-3 rounded-xl">
               <Filter size={14} className="text-emerald-500" />
               <select 
                 value={moduleFilter} 
                 onChange={(e) => setModuleFilter(e.target.value)}
                 className="bg-transparent text-zinc-400 text-[10px] font-black uppercase py-3 border-none outline-none cursor-pointer"
               >
                 <option value="All">All Modules</option>
                 <option value="SALES">Sales</option>
                 <option value="PURCHASE">Purchase</option>
                 <option value="STOCK">Inventory</option>
                 <option value="ATTENDANCE">Attendance</option>
                 <option value="PAYROLL">Payroll</option>
                 <option value="SUPPLIER">Parties</option>
                 <option value="AUTH">Login/Security</option>
               </select>
            </div>
            
            <button onClick={fetchLogs} className="p-3 bg-zinc-800 text-zinc-400 rounded-xl hover:text-white transition-colors">
              <RefreshCcw size={16} />
            </button>

            <button 
              onClick={exportToCSV}
              disabled={filteredLogs.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-30"
            >
              <FileDown size={16} /> Export
            </button>
          </div>
        </div>

        {/* --- TABLE --- */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/30 text-zinc-400 text-[10px] font-black uppercase tracking-widest border-b dark:border-zinc-800">
                <th className="px-8 py-5">Verified User</th>
                <th className="px-8 py-5 text-center">Department</th>
                <th className="px-8 py-5">Action Log</th>
                <th className="px-8 py-5">Timestamp</th>
                <th className="px-8 py-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredLogs.map((log, i) => (
                <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-all group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 font-black text-[11px] border border-zinc-200 dark:border-zinc-700 ring-2 ring-emerald-500/0 group-hover:ring-emerald-500/20 transition-all">
                        {log.adminName?.charAt(0)}
                      </div>
                      <span className="text-xs font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-tighter">{log.adminName}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={getBadgeStyle(log.module)}>
                      {log.module || "SYSTEM"}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400 leading-relaxed italic group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors">
                      {log.action}
                    </p>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2.5 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      <Clock size={12} className="text-emerald-500" />
                      {new Date(log.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 rounded-full text-[9px] font-black uppercase border border-emerald-100 dark:border-emerald-900/30">
                      <ShieldCheck size={10} /> Secure
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="py-24 text-center">
            <LayoutGrid size={48} className="mx-auto text-zinc-200 dark:text-zinc-800 mb-4" />
            <p className="text-zinc-400 font-black uppercase tracking-[0.3em] text-xs">No activity found for this filter</p>
          </div>
        )}
      </div>

      {/* --- FOOTER INFO --- */}
      <div className="max-w-7xl mx-auto mt-6 flex justify-between items-center px-6">
         <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Powered by Dhara Shakti Security Engine</p>
         <div className="flex gap-4 text-[10px] font-black text-emerald-500 uppercase italic">
            <span>Total Records: {filteredLogs.length}</span>
         </div>
      </div>
      
      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({...snackbar, open: false})} />
    </div>
  );
};

export default AuditPage;