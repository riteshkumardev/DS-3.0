import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, Play, CheckCircle2, RefreshCcw,
  Terminal, Database, Users, ShoppingCart, 
  Receipt, CalendarCheck, ShieldCheck, FileJson, UserCheck, X
} from "lucide-react";
// ✅ Frontend API functions import karein
import { restoreSystemData } from "../../api/backupApi"; 

const BackupRestoreBot = () => {
  const [status, setStatus] = useState({ loading: false, currentTask: '', progress: 0 });
  const [logs, setLogs] = useState([]);
  const [backupData, setBackupData] = useState(null);
  const logEndRef = useRef(null);

  // Auto-scroll logic for terminal
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (msg) => {
    setLogs(prev => [`${msg}`, ...prev].slice(0, 100));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        // v3 Format check
        if (!json.collections && !json.data) {
          throw new Error("Invalid Dharashakti Backup Format");
        }
        setBackupData(json);
        addLog(`📁 RESOURCE_LOADED: ${file.name} (Verified)`);
        addLog(`📊 SCAN: Found data for ${Object.keys(json.collections?.data || json.data || {}).length} modules`);
      } catch (err) {
        addLog(`❌ ERROR: Invalid JSON or Corrupt File`);
        alert("Backup file invalid hai!");
      }
    };
    reader.readAsText(file);
  };

  const handleFullRestore = async () => {
    if (!backupData) return alert("Pehle file load karein!");
    
    const confirm = window.confirm("🚨 WARNING: Yeh action puraana saara data delete karke naya data inject karega. Kya aap sure hain?");
    if (!confirm) return;

    setStatus({ loading: true, currentTask: 'Restoring...', progress: 30 });
    addLog(`🚀 RESTORE_SEQUENCE_INITIATED: ${new Date().toLocaleTimeString()}`);
    addLog(`⚠️ ACTION: Wiping current database...`);

    try {
      // ✅ Using naye unified API function
      const res = await restoreSystemData(backupData);
      
      if (res.data.success) {
        setStatus({ loading: false, currentTask: 'Finished!', progress: 100 });
        addLog(`✅ SUCCESS: All collections injected successfully.`);
        addLog(`🏁 SYSTEM_RESTORE_COMPLETE. Reloading UI recommended.`);
        alert("System Restore Safal Raha!");
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message;
      addLog(`❌ FATAL_ERROR: ${errMsg}`);
      setStatus({ loading: false, currentTask: 'Failed', progress: 0 });
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 font-sans transition-all">
      <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-[3rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* --- Header Section --- */}
        <div className="bg-zinc-900 p-8 flex flex-col md:flex-row justify-between items-center text-white gap-4 border-b border-zinc-800">
          <div className="flex items-center gap-5 text-left">
             <div className="p-4 bg-emerald-600 rounded-[1.5rem] shadow-lg shadow-emerald-600/20">
                <RefreshCcw size={32} className={status.loading ? "animate-spin" : ""} />
             </div>
             <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter italic flex items-center gap-2">
                  Dharashakti Admin Bot <span className="text-[10px] bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-md not-italic tracking-widest font-bold border border-emerald-500/20">v3.0</span>
                </h2>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1 flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-emerald-500"/> Disaster Recovery Protocol
                </p>
             </div>
          </div>
          <button onClick={() => window.location.reload()} className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-2xl transition-all"><X size={20}/></button>
        </div>

        <div className="p-8 md:p-12 space-y-12">
          
          {/* 1. File Selector */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2 ml-2">
              <UploadCloud size={16} className="text-emerald-500" /> Phase 01: Resource Identification
            </h3>
            <div className="relative group">
              <input 
                type="file" accept=".json" disabled={status.loading}
                onChange={handleFileUpload} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" 
              />
              <div className={`p-10 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center transition-all duration-500 ${backupData ? 'bg-emerald-500/5 border-emerald-500' : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 group-hover:border-emerald-500/50'}`}>
                <FileJson size={56} className={backupData ? 'text-emerald-500 scale-110' : 'text-zinc-300 dark:text-zinc-700'} />
                <p className="mt-5 text-sm font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-tighter">
                  {backupData ? "System Package Ready" : "Select Backup JSON File"}
                </p>
                {backupData && <span className="text-[9px] bg-emerald-500 text-white px-3 py-1 rounded-full font-black mt-2">VERIFIED ✓</span>}
              </div>
            </div>
          </div>

          {/* 2. Recovery Control */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2 ml-2">
              <Play size={16} className="text-emerald-500" /> Phase 02: Execution Engine
            </h3>
            
            <div className="bg-zinc-50 dark:bg-zinc-800/30 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 text-center">
                <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-6">
                    {backupData ? `Found ${backupData.collections?.count?.sales || 0} sales, ${backupData.collections?.count?.staff || 0} staff records...` : "Waiting for system package initiation"}
                </p>
                
                <button 
                  onClick={handleFullRestore}
                  disabled={status.loading || !backupData}
                  className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-2xl ${status.loading ? 'bg-zinc-900 text-emerald-500' : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-500/20'}`}
                >
                  {status.loading ? (
                    <><RefreshCcw className="animate-spin" size={20}/> Restoring Core...</>
                  ) : (
                    <><Database size={20}/> Initiate System Restore</>
                  )}
                </button>
            </div>
          </div>

          {/* 3. Terminal Terminal */}
          <div className="space-y-4">
             <div className="flex justify-between items-center px-2">
                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Terminal size={16} className="text-emerald-500" /> Recovery Logs
                </h3>
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                   <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Live Terminal</span>
                </div>
             </div>
             <div className="bg-zinc-950 rounded-[2rem] p-8 shadow-2xl ring-1 ring-white/5 border-b-4 border-emerald-900/30">
                <div className="h-44 overflow-y-auto space-y-2 font-mono flex flex-col-reverse custom-scrollbar">
                  <div ref={logEndRef} /> 
                  {logs.length > 0 ? logs.map((log, i) => (
                    <div key={i} className={`text-[10px] flex gap-3 transition-all ${log.includes('❌') ? 'text-rose-400' : log.includes('✅') ? 'text-emerald-400' : 'text-zinc-500'}`}>
                      <span className="opacity-20 font-bold shrink-0">{new Date().toLocaleTimeString()}</span>
                      <span className="tracking-tight uppercase font-bold italic">{`>> ${log}`}</span>
                    </div>
                  )) : (
                    <div className="text-zinc-800 font-black text-[10px] text-center pt-16 uppercase tracking-[0.5em]">System_Idle_Mode</div>
                  )}
                </div>
             </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #18181b; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default BackupRestoreBot;