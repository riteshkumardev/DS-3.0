import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  UploadCloud, Play, CheckCircle2, 
  Terminal, Database, Users, ShoppingCart, 
  Receipt, CalendarCheck, ShieldCheck, FileJson, UserCheck 
} from "lucide-react";

const BackupRestoreBot = () => {
  const [status, setStatus] = useState({ loading: false, currentTask: '', progress: 0 });
  const [logs, setLogs] = useState([]);
  const [backupData, setBackupData] = useState(null);
  const logEndRef = useRef(null);

  const [selectedTasks, setSelectedTasks] = useState({
    suppliers: true, employees: true, purchases: true, sales: true, attendances: true
  });

  // Auto-scroll logic for terminal live feed
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

  const taskMap = [
    { key: 'suppliers', label: 'Suppliers/Parties', url: '/api/suppliers', icon: <Users size={16}/> },
    { key: 'employees', label: 'Employees List', url: '/api/employees', icon: <UserCheck size={16}/> },
    { key: 'purchases', label: 'Purchases', url: '/api/purchases', icon: <ShoppingCart size={16}/> },
    { key: 'sales', label: 'Sales Records', url: '/api/sales', icon: <Receipt size={16}/> },
    { key: 'attendances', label: 'Attendance', url: '/api/attendance', icon: <CalendarCheck size={16}/> }
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        const collections = data.collections || data; 
        setBackupData(collections);
        setLogs(prev => [`📁 Resource loaded: ${file.name} parsed successfully.`, ...prev]);
      } catch (err) {
        alert("Invalid JSON format! Please check the backup file.");
      }
    };
    reader.readAsText(file);
  };

  const startRestoration = async () => {
    if (!backupData) return alert("Pehle file upload karein!");
    
    setStatus({ loading: true, currentTask: 'Initializing...', progress: 0 });
    setLogs(prev => [`🚀 SYSTEM RECOVERY INITIATED: ${new Date().toLocaleString()}`, ...prev]);

    for (const task of taskMap) {
      if (!selectedTasks[task.key]) {
        setLogs(prev => [`⏭️ SKIPPED: ${task.label} module`, ...prev]);
        continue;
      }

      const items = backupData[task.key] || [];
      if (items.length === 0) {
        setLogs(prev => [`⚠️ EMPTY: No data found for ${task.label}`, ...prev]);
        continue;
      }

      setLogs(prev => [`⚡ SYNCING: ${task.label} (${items.length} records)...`, ...prev]);

      for (let i = 0; i < items.length; i++) {
        try {
          // Metadata Cleanup to avoid MongoDB/Mongoose validation errors
          const { _id, __v, createdAt, updatedAt, ...cleanData } = items[i];
          
          await axios.post(`${BASE_URL}${task.url}`, cleanData);
          
          // Smart Identifier selection for terminal logs
          const identifier = cleanData.name || cleanData.billNo || cleanData.supplierName || cleanData.employeeName || `Record #${i + 1}`;
          
          setLogs(prev => [`✅ OK: ${identifier}`, ...prev].slice(0, 150)); // Keeping last 150 logs for performance
        } catch (err) {
          const errMsg = err.response?.data?.message || err.message;
          setLogs(prev => [`❌ FAIL: ${errMsg}`, ...prev]);
        }
        // Throttling: Server ko crash se bachane ke liye chota delay
        await new Promise(r => setTimeout(r, 150));
      }
    }

    setStatus({ loading: false, currentTask: 'Finished!', progress: 100 });
    setLogs(prev => ["🏁 SYSTEM RESTORATION COMPLETE. ALL MODULES DEPLOYED.", ...prev]);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 font-sans transition-colors duration-300">
      <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* --- Header Section --- */}
        <div className="bg-emerald-600 p-8 flex flex-col md:flex-row justify-between items-center text-white gap-4">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <Database size={32} />
             </div>
             <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter italic flex items-center gap-2">
                  Dharashakti Admin Bot <span className="text-[10px] bg-zinc-900/40 px-2 py-0.5 rounded-md not-italic tracking-widest font-bold">v2.1</span>
                </h2>
                <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-[0.3em] mt-1 opacity-80 flex items-center gap-1.5">
                  <ShieldCheck size={12}/> Secure Data Recovery Environment
                </p>
             </div>
          </div>
        </div>

        <div className="p-6 md:p-10 space-y-10">
          
          {/* 1. Resource Loading (Upload) */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <UploadCloud size={16} className="text-emerald-500" /> Step 1: Resource Loading
            </h3>
            <div className="relative group">
              <input 
                type="file" 
                accept=".json" 
                disabled={status.loading}
                onChange={handleFileUpload} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" 
              />
              <div className={`p-8 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all duration-300 ${backupData ? 'bg-emerald-50/50 border-emerald-500 dark:bg-emerald-900/10' : 'bg-zinc-50 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 group-hover:border-emerald-400'}`}>
                <FileJson size={48} className={backupData ? 'text-emerald-600' : 'text-zinc-300'} />
                <p className="mt-4 text-sm font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-tighter">
                  {backupData ? "Backup File Verified ✓" : "Drop Backup (.json) here"}
                </p>
                <p className="text-[10px] text-zinc-400 font-bold mt-1 uppercase tracking-widest">JSON format recommended</p>
              </div>
            </div>
          </div>

          {/* 2. Selection Grid */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" /> Step 2: Collection Selection
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {taskMap.map(task => (
                <div 
                  key={task.key} 
                  onClick={() => !status.loading && setSelectedTasks(p => ({...p, [task.key]: !p[task.key]}))}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 flex items-center justify-between group ${selectedTasks[task.key] ? 'bg-white dark:bg-zinc-800 border-emerald-500 shadow-lg shadow-emerald-500/10' : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-700 opacity-60 grayscale'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${selectedTasks[task.key] ? 'bg-emerald-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500'}`}>
                       {task.icon}
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-tight text-zinc-800 dark:text-zinc-100">{task.label}</p>
                      <p className="text-[9px] font-bold text-zinc-400">Records: {backupData?.[task.key]?.length || 0}</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedTasks[task.key] ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-zinc-300 dark:border-zinc-600'}`}>
                    {selectedTasks[task.key] && <CheckCircle2 size={12} />}
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              onClick={startRestoration}
              disabled={status.loading || !backupData}
              className={`w-full py-4 mt-6 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl ${status.loading ? 'bg-zinc-900 text-emerald-500 cursor-wait' : 'bg-emerald-600 text-white shadow-emerald-500/20 hover:bg-emerald-700'}`}
            >
              {status.loading ? (
                <div className="flex items-center gap-3 italic">
                   <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                   Recovering Database...
                </div>
              ) : (
                <><Play size={18}/> Initiate Deployment</>
              )}
            </button>
          </div>

          {/* 3. System Terminal Logs */}
          <div className="space-y-4">
             <div className="flex justify-between items-center px-1">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Terminal size={16} className="text-emerald-500" /> Terminal Output
                </h3>
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">Live Feed</span>
             </div>
             <div className="bg-zinc-950 rounded-3xl p-6 shadow-inner ring-1 ring-white/10">
                <div className="h-48 overflow-y-auto space-y-1.5 font-mono flex flex-col-reverse">
                  {/* flex-col-reverse keeps newest logs at the top-visible area */}
                  <div ref={logEndRef} /> 
                  {logs.length > 0 ? logs.map((log, i) => (
                    <div key={i} className={`text-[10px] leading-relaxed flex gap-2 ${log.includes('❌') ? 'text-rose-400' : log.includes('✅') ? 'text-emerald-400' : log.includes('🚀') ? 'text-white' : 'text-zinc-500'}`}>
                      <span className="opacity-30 shrink-0 font-bold">{`[${new Date().toLocaleTimeString()}]`}</span>
                      <span className="opacity-80 tracking-tight shrink-1 whitespace-pre-wrap">{`> ${log}`}</span>
                    </div>
                  )) : (
                    <div className="text-zinc-700 italic text-[11px] text-center pt-12 uppercase tracking-widest">Waiting for process initiation...</div>
                  )}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupRestoreBot;