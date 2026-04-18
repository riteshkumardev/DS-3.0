import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from "react-router-dom"; 
import axios from "axios"; 
import { 
  ShieldCheck, Search, UserPlus, Key, Lock, Unlock, Calendar,
  History, Database, ChevronRight, User, UploadCloud, X, 
  CheckCircle2, RefreshCcw, Activity, ClipboardList
} from "lucide-react"; 

// ✅ New Backend API Sync
import { getAllStaff, updateStaff } from "../../api/staffApi"; // Path check karein
import { getSystemLogs } from "../../api/logApi"; // Path check karein

import Loader from "../Core_Component/Loader/Loader"; 
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar"; 
import BackupManager from '../BackupButton/BackupManager';
import BackupRestoreBot from '../Bot/BackupRestoreBot';

// --- SUB-COMPONENT: BULK DATA INJECTOR (v3 Synced) ---
const BulkSaleUploader = ({ jsonData, isAuthorized, API_URL, onClose, showMsg, fetchData }) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [status, setStatus] = useState('idle');

  const startUpload = async () => {
    if (!isAuthorized) return showMsg("Unauthorized access!", "error");
    setLoading(true);
    setStatus('processing');
    
    const total = jsonData.length;
    setProgress({ current: 0, total });

    for (let i = 0; i < total; i++) {
      const entry = jsonData[i];
      try {
        const goods = (entry.items || entry.goods || []).map(item => ({
          productId: item.productId, 
          productName: item.productName,
          quantity: Number(item.quantity),
          rate: Number(item.rate),
          taxableAmount: Number(item.quantity) * Number(item.rate),
          unit: item.unit || "KG"
        }));

        const payload = {
          ...entry,
          logistics: {
            vehicleNo: (entry.vehicleNo || "").toUpperCase(),
            freight: Number(entry.travelingCost || entry.logistics?.freight || 0)
          },
          goods: goods,
          status: entry.status || "UNPAID",
          adminAction: true 
        };

        await axios.post(`${API_URL}/api/sales`, payload);
        setProgress(p => ({ ...p, current: i + 1 }));
      } catch (err) {
        console.error(`Row ${i+1} failed:`, err.message);
      }
    }

    setLoading(false);
    setStatus('completed');
    showMsg("Bulk synchronization complete!");
    if(fetchData) fetchData();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl">
        <div className="p-8 text-center">
          {status === 'idle' && (
            <div className="space-y-6">
              <Database className="text-emerald-500 mx-auto" size={48} />
              <h3 className="dark:text-white font-black uppercase text-xl">System Injector</h3>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Verified {jsonData.length} records.</p>
              <button onClick={startUpload} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Start Sync</button>
              <button onClick={onClose} className="w-full py-4 text-zinc-400 font-bold text-[10px] uppercase">Cancel</button>
            </div>
          )}

          {status === 'processing' && (
            <div className="py-6 space-y-6">
              <RefreshCcw className="animate-spin text-emerald-500 mx-auto" size={48} />
              <div className="text-zinc-900 dark:text-white font-black text-2xl">
                {Math.round((progress.current / progress.total) * 100)}%
              </div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Syncing Block {progress.current} / {progress.total}</p>
            </div>
          )}

          {status === 'completed' && (
            <div className="space-y-6 animate-in zoom-in">
               <CheckCircle2 className="text-emerald-500 mx-auto" size={48} />
               <h3 className="dark:text-white font-black uppercase text-xl text-center">Sync Successful</h3>
               <button onClick={onClose} className="w-full py-5 bg-zinc-900 dark:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">Close Control</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- MAIN MASTER PANEL ---
const MasterPanel = ({ user }) => { 
  const navigate = useNavigate(); 
  const [staffList, setStaffList] = useState([]);
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [bulkData, setBulkData] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const showMsg = (msg, type = "success") => setSnackbar({ open: true, message: msg, severity: type });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // ✅ Using imported service functions
      const [staffRes, logsRes] = await Promise.all([
        getAllStaff(),
        getSystemLogs(1) 
      ]);
      if (staffRes.data?.success) setStaffList(staffRes.data.data);
      if (logsRes.data?.success) setLogs(logsRes.data.data);
    } catch (err) {
      showMsg("Critical load failure: " + err.message, "error");
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        setBulkData(JSON.parse(evt.target.result));
        setShowBulkModal(true);
      } catch (err) { showMsg("Invalid JSON file.", "error"); }
    };
    reader.readAsText(file);
    e.target.value = null; 
  };

  const handleStatusUpdate = async (id, field, value) => {
    setActionLoading(true);
    try {
      // ✅ Using imported update function
      await updateStaff(id, { [field]: value });
      showMsg(`Sync Success: ${field.toUpperCase()} updated`);
      fetchData(); 
    } catch (err) {
      showMsg("Sync failed", "error");
    } finally { setActionLoading(false); }
  };

  const filteredStaff = staffList.filter(s => 
    String(s.name || "").toLowerCase().includes(search.toLowerCase()) || 
    String(s.employeeId || "").includes(search)
  );

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 md:p-10 font-sans text-left">
      {actionLoading && <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm"><Loader /></div>}

      {showBulkModal && (
        <BulkSaleUploader 
          jsonData={bulkData}
          isAuthorized={user?.role?.toUpperCase() === 'ADMIN'}
          API_URL={API_URL}
          onClose={() => setShowBulkModal(false)}
          showMsg={showMsg}
          fetchData={fetchData}
        />
      )}

      <div className="max-w-[1600px] mx-auto space-y-10">
        
        {/* --- HEADER --- */}
        <div className="bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="bg-emerald-600 p-10 flex flex-col xl:flex-row justify-between items-center gap-8 text-white">
            <div className="flex items-center gap-6">
               <ShieldCheck size={48} className="p-3 bg-white/20 rounded-[1.5rem] backdrop-blur-md" />
               <div>
                  <h1 className="text-3xl font-black uppercase tracking-tighter italic">Command Center</h1>
                  <p className="text-emerald-100 text-[10px] font-black uppercase tracking-[0.4em] mt-2 opacity-70">Security & Data Management</p>
               </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <BackupManager />
              
              <label className="flex items-center gap-2 px-6 py-4 bg-zinc-900/40 text-emerald-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-900 transition-all border border-white/10 shadow-xl cursor-pointer">
                  <UploadCloud size={18} /> Bulk Import
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={18} />
                <input 
                  type="text" 
                  placeholder="Search staff..." 
                  className="pl-12 pr-6 py-4 bg-white/10 border border-white/10 rounded-2xl text-xs font-bold outline-none w-64 placeholder:text-white/40 text-white"
                  value={search} onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              
              <button onClick={() => navigate("/employee-add")} className="p-4 bg-zinc-900 text-white rounded-2xl shadow-xl hover:scale-105 transition-all"><UserPlus size={20}/></button>
            </div>
          </div>
        </div>

        {/* --- CONTENT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            {filteredStaff.map(s => (
              <div key={s._id} className={`group bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-xl border-2 transition-all duration-500 ${s.isBlocked ? 'border-rose-500/20 opacity-60' : 'border-transparent hover:border-emerald-500/30'}`}>
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center ring-4 ring-zinc-50 dark:ring-zinc-800">
                        {s.photo ? <img src={`${API_URL}${s.photo}`} className="w-full h-full object-cover" /> : <User size={24} className="text-zinc-400" />}
                      </div>
                      <div>
                        <h3 className="text-base font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-tighter italic">{s.name}</h3>
                        <p className="text-[10px] font-bold text-zinc-400">UID: {s.employeeId}</p>
                      </div>
                    </div>
                    <span className="px-4 py-1.5 rounded-xl text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600">{s.role}</span>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">Access Level</label>
                      <select 
                        value={s.role} 
                        onChange={(e) => handleStatusUpdate(s._id, 'role', e.target.value)}
                        className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-xs font-bold outline-none dark:text-white appearance-none cursor-pointer"
                      >
                        {['ADMIN', 'MANAGER', 'ACCOUNTANT', 'STAFF', 'WORKER'].map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => handleStatusUpdate(s._id, 'isBlocked', !s.isBlocked)} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${s.isBlocked ? 'bg-emerald-600 text-white shadow-emerald-500/20 shadow-lg' : 'bg-rose-50 dark:bg-rose-900/10 text-rose-600 border border-rose-100'}`}>
                        {s.isBlocked ? <><Unlock size={14} className="inline mr-2"/> Restore Access</> : <><Lock size={14} className="inline mr-2"/> Revoke Access</>}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-4 space-y-8 text-left">
             <div className="bg-zinc-900 rounded-[3rem] shadow-2xl border border-zinc-800 overflow-hidden sticky top-10">
                <div className="p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
                  <div className="flex items-center gap-3">
                    <Activity className="text-emerald-500" size={20} />
                    <h3 className="text-white text-sm font-black uppercase tracking-widest italic">Live Audit</h3>
                  </div>
                  <button onClick={() => navigate("/audit-trail")} className="p-2 bg-zinc-800 text-emerald-500 rounded-xl hover:bg-zinc-700 transition-all"><ChevronRight size={20}/></button>
                </div>
                <div className="p-6 max-h-[600px] overflow-y-auto space-y-6 custom-scrollbar">
                  {logs.map((log, i) => (
                    <div key={i} className="group relative pl-5 border-l-2 border-zinc-800 hover:border-emerald-500 transition-all py-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">{log.performedBy?.name || "System"}</span>
                        <span className="text-[8px] font-bold text-zinc-600">{new Date(log.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-zinc-300 text-xs font-medium leading-tight">{log.action}: {log.module}</p>
                    </div>
                  ))}
                </div>
             </div>
          </div>

        </div>
      </div>
      
      <BackupRestoreBot />
      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default MasterPanel;