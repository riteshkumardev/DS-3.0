import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom"; 
import axios from "axios"; 
import { 
  ShieldCheck, Search, UserPlus, Key, Lock, Unlock, Calendar,
  History, Database, ShieldAlert, ChevronRight, User, Camera, MessageSquare,
  ClipboardList, UploadCloud, X, CheckCircle2 // Naye icons
} from "lucide-react"; 
import Loader from "../Core_Component/Loader/Loader"; 
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar"; 

import BackupManager from '../BackupButton/BackupManager';
import BackupRestoreBot from '../Bot/BackupRestoreBot';

// --- SUB-COMPONENT: BULK SALE UPLOADER MODAL ---
const BulkSaleUploader = ({ jsonData, isAuthorized, API_URL, onClose, showMsg, fetchData }) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [status, setStatus] = useState('idle'); // idle, processing, completed

  const startUpload = async () => {
    if (!isAuthorized) return showMsg("Unauthorized access!", "error");
    setLoading(true);
    setStatus('processing');
    
    const total = jsonData.length;
    setProgress({ current: 0, total });

    for (let i = 0; i < total; i++) {
      const entry = jsonData[i];
      try {
        const freightValue = Number(entry.travelingCost || 0);
        const goods = (entry.items || []).map(item => ({
          product: item.productName,
          quantity: Number(item.quantity),
          rate: Number(item.rate),
          taxableAmount: Number(item.quantity) * Number(item.rate),
          hsn: item.productName.includes("Corn Grit") ? "11031300" :
               item.productName.includes("Rice Grit") ? "10064000" :
               item.productName.includes("Cattle Feed") ? "23099010" : "11022000"
        }));

        const payload = {
          ...entry,
          travelingCost: freightValue * -1,
          taxableValue: goods.reduce((sum, g) => sum + g.taxableAmount, 0),
          goods: goods,
          adminAction: true 
        };

        await axios.post(`${API_URL}/api/sales`, payload);
        setProgress(p => ({ ...p, current: i + 1 }));
      } catch (err) {
        console.error(`Error at row ${i+1}:`, err);
      }
    }

    setLoading(false);
    setStatus('completed');
    showMsg("Bulk processing completed!");
    if(fetchData) fetchData();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <h2 className="text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <UploadCloud size={18} className="text-emerald-500" /> Data System Import
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors"><X size={20}/></button>
        </div>

        <div className="p-8 text-center">
          {status === 'idle' && (
            <div className="animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                <Database className="text-emerald-400" size={36} />
              </div>
              <h3 className="text-white font-black uppercase italic tracking-tighter mb-2 text-lg">Ready to Import</h3>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-8 leading-relaxed">
                Found {jsonData.length} sale records in the file.<br/>Are you sure you want to proceed?
              </p>
              <button 
                onClick={startUpload}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg active:scale-95 border border-emerald-400/20"
              >
                Confirm & Sync Data
              </button>
            </div>
          )}

          {status === 'processing' && (
            <div className="py-4 space-y-6">
              <div className="relative w-28 h-28 mx-auto">
                 <svg className="w-full h-full rotate-[-90deg]">
                    <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-800" />
                    <circle cx="56" cy="56" r="50" stroke="currentColor" strokeWidth="8" fill="transparent" 
                      strokeDasharray={314}
                      strokeDashoffset={314 - (314 * progress.current) / progress.total}
                      className="text-emerald-500 transition-all duration-500" 
                      strokeLinecap="round"
                    />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-white font-black text-xl">{Math.round((progress.current / progress.total) * 100)}%</span>
                 </div>
              </div>
              <p className="text-zinc-400 text-[9px] font-black uppercase tracking-[0.3em] animate-pulse">
                Syncing Record {progress.current} of {progress.total}
              </p>
            </div>
          )}

          {status === 'completed' && (
            <div className="animate-in zoom-in duration-500">
               <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                  <CheckCircle2 className="text-white" size={40} />
               </div>
               <h3 className="text-white font-black uppercase italic tracking-tighter text-lg">Batch Complete</h3>
               <p className="text-zinc-500 text-[10px] mt-2 mb-8 uppercase tracking-widest">All records successfully injected.</p>
               <button onClick={onClose} className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Back to Master Panel</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- MAIN MASTER PANEL COMPONENT ---
const MasterPanel = ({ user }) => { 
  const navigate = useNavigate(); 
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Bulk Upload States
  const [bulkData, setBulkData] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const getPhotoURL = (photoPath) => {
    if (!photoPath) return null;
    return photoPath.startsWith('http') ? photoPath : `${API_URL}${photoPath}`;
  };

  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, logsRes] = await Promise.all([
        axios.get(`${API_URL}/api/employees`),
        axios.get(`${API_URL}/api/activity-logs`)
      ]);
      if (usersRes.data.success) setUsers(usersRes.data.data);
      if (logsRes.data.success) setLogs(logsRes.data.data);
    } catch (err) {
      showMsg("डेटा लोड करने में विफल: " + err.message, "error");
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  useEffect(() => {
    fetchData();
  }, [API_URL]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target.result);
        setBulkData(json);
        setShowBulkModal(true);
      } catch (err) {
        showMsg("Invalid JSON File format", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Reset input
  };

  const handlePasswordReset = async (employeeId, targetName) => {
    const newPass = window.prompt(`Enter new password for ${targetName}:`);
    if (!newPass) return;
    if (newPass.length < 4) return showMsg("Password too short", "error");
    setActionLoading(true);
    try {
      await axios.put(`${API_URL}/api/profile/password`, { employeeId, password: newPass });
      showMsg(`${targetName} का पासवर्ड अपडेट हो गया!`);
      fetchData(); 
    } catch (err) {
      showMsg("Reset Failed", "error");
    } finally { setActionLoading(false); }
  };

  const handleSystemUpdate = async (employeeId, targetName, field, value) => {
    setActionLoading(true);
    try {
      await axios.put(`${API_URL}/api/employees/${employeeId}`, {
        [field]: value,
        adminAction: true, 
        adminName: user?.name
      });
      showMsg(`System Updated: ${field.toUpperCase()}`);
      fetchData(); 
    } catch (err) {
      showMsg("System Error", "error");
    } finally { setActionLoading(false); }
  };

  const filtered = users.filter(u => 
    String(u.name || "").toLowerCase().includes(search.toLowerCase()) || 
    String(u.employeeId || "").includes(search)
  );

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 font-sans">
      {actionLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <Loader />
        </div>
      )}

      {/* --- BULK UPLOADER MODAL --- */}
      {showBulkModal && (
        <BulkSaleUploader 
          jsonData={bulkData}
          isAuthorized={user?.role === 'Admin'}
          API_URL={API_URL}
          onClose={() => setShowBulkModal(false)}
          showMsg={showMsg}
          fetchData={fetchData}
        />
      )}

      {/* --- HERO SECTION --- */}
      <div className="max-w-7xl mx-auto bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden mb-8">
        <div className="bg-emerald-600 p-8 flex flex-col lg:flex-row justify-between items-center gap-6 text-white">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <ShieldCheck size={32} />
             </div>
             <div>
                <h1 className="text-2xl font-black uppercase tracking-tighter italic">Master Admin Control</h1>
                <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-[0.3em] mt-1 opacity-80">Global System Management & Backups</p>
             </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 w-full lg:w-auto">
            <div className="bg-zinc-900/40 backdrop-blur-sm px-4 py-2 rounded-2xl border border-white/20 shadow-lg">
               <BackupManager />
            </div>

            {/* ✅ NEW: BULK IMPORT BUTTON */}
            <label className="flex items-center gap-2 px-5 py-3 bg-emerald-900/40 text-emerald-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-900/60 transition-all border border-emerald-500/20 shadow-xl active:scale-95 cursor-pointer">
                <Database size={16} /> Import JSON
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>

            <button 
              onClick={() => navigate("/audit-trail")} 
              className="flex items-center gap-2 px-5 py-3 bg-zinc-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all border border-zinc-700 shadow-xl active:scale-95"
            >
                <ClipboardList size={16} className="text-emerald-400"/> Audit Trail
            </button>

            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-white" size={18} />
              <input 
                type="text" 
                placeholder="Search system users..." 
                className="pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-xs font-bold outline-none focus:bg-white/20 focus:ring-4 focus:ring-white/10 transition-all w-48 sm:w-64 placeholder:text-white/40 text-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <button onClick={() => navigate("/employee-add")} className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 border border-zinc-800">
               <UserPlus size={16}/> Add Staff
            </button>
          </div>
        </div>
      </div>

      {/* --- MAIN LAYOUT (Users Grid & Activity) --- */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* USERS GRID */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.length > 0 ? filtered.map(userItem => (
            <div key={userItem._id} className={`group bg-white dark:bg-zinc-900 rounded-[2rem] shadow-xl border-2 transition-all duration-300 ${userItem.isBlocked ? 'border-red-100 dark:border-red-900/30 opacity-70 grayscale' : 'border-zinc-50 dark:border-zinc-800 hover:border-emerald-500/30'}`}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden ring-2 ring-zinc-50 dark:ring-zinc-700">
                      {userItem.photo ? (
                        <img 
                          src={getPhotoURL(userItem.photo)} 
                          className="w-full h-full object-cover" 
                          alt="p" 
                          onError={(e) => { e.target.src = "https://i.imgur.com/6VBx3io.png"; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400 font-black text-lg bg-zinc-50 dark:bg-zinc-800">{userItem.name?.charAt(0)}</div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-tighter italic">{userItem.name}</h3>
                      <p className="text-[10px] font-bold text-zinc-400">ID: {userItem.employeeId}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    userItem.role === 'Admin' ? 'bg-red-50 text-red-600 border border-red-100' :
                    userItem.role === 'Accountant' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                    'bg-zinc-100 text-zinc-500 dark:bg-zinc-800'
                  }`}>
                    {userItem.role || 'Worker'}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Assign Security Level</label>
                    <div className="relative">
                      <select 
                        value={userItem.role || 'Worker'} 
                        onChange={(e) => handleSystemUpdate(userItem.employeeId, userItem.name, 'role', e.target.value)}
                        disabled={actionLoading}
                        className="w-full pl-3 pr-10 py-2.5 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-xs font-bold outline-none cursor-pointer focus:ring-2 focus:ring-emerald-500/20 appearance-none dark:text-white"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Manager">Manager</option>
                        <option value="Accountant">Accountant</option>
                        <option value="Staff">Staff</option>
                        <option value="Worker">Worker</option>
                      </select>
                      <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none rotate-90" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handlePasswordReset(userItem.employeeId, userItem.name)} className="flex items-center justify-center gap-2 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all border border-zinc-200 dark:border-zinc-700">
                       <Key size={12}/> Reset Key
                    </button>
                    <button 
                      onClick={() => handleSystemUpdate(userItem.employeeId, userItem.name, 'isBlocked', !userItem.isBlocked)}
                      disabled={actionLoading}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                        userItem.isBlocked 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 shadow-sm' 
                        : 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 shadow-sm'
                      }`}
                    >
                      {userItem.isBlocked ? <><Unlock size={12}/> Restore</> : <><Lock size={12}/> Block</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-20 text-center opacity-30 italic text-zinc-400 uppercase tracking-widest text-sm">No matching users found</div>
          )}
        </div>

        {/* ACTIVITY LOGS SIDEBAR */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-zinc-900 dark:bg-zinc-950 rounded-[2.5rem] shadow-2xl border border-zinc-800 overflow-hidden sticky top-8">
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                <h3 className="text-white text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <History size={18} className="text-emerald-500" /> Recent Activity
                </h3>
                <button 
                  onClick={() => navigate("/audit-trail")}
                  className="text-[9px] font-black bg-zinc-800 hover:bg-zinc-700 text-emerald-500 px-2 py-1 rounded-lg transition-all"
                >
                  FULL LOGS
                </button>
              </div>
              <div className="p-4 max-h-[700px] overflow-y-auto space-y-4">
                {logs.length > 0 ? logs.slice(0, 20).map((log, i) => (
                  <div key={i} className="group relative pl-4 border-l-2 border-zinc-800 hover:border-emerald-500 transition-all duration-300 py-2">
                    <p className="text-[11px] font-black text-emerald-500 uppercase tracking-tighter mb-0.5">{log.adminName}</p>
                    <p className="text-zinc-300 text-xs leading-tight mb-1">{log.action}</p>
                    <div className="flex items-center gap-2 text-zinc-600 text-[9px] font-bold">
                       <Calendar size={10} />
                       {new Date(log.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )) : <div className="text-center py-10 text-zinc-600 italic text-xs">No activity logs recorded.</div>}
              </div>
           </div>
        </div>
      </div>

      <CustomSnackbar 
        open={snackbar.open} 
        message={snackbar.message} 
        severity={snackbar.severity} 
        onClose={() => setSnackbar({ ...snackbar, open: false })} 
      />
      <BackupRestoreBot />
      
      <style>{`
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
        .dark ::-webkit-scrollbar-thumb { background: #27272a; }
      `}</style>
    </div>
  );
};

export default MasterPanel;