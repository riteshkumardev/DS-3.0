import React, { useState, useRef } from 'react';
import axios from 'axios';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  FileJson, FileText, UploadCloud, 
  Database, RefreshCcw, Download 
} from "lucide-react";

// ✅ Frontend API Services Import (Optional but recommended)
import { downloadFullBackup, exportBackupToExcel, restoreSystemData } from "../../api/backupApi";

const BackupManager = () => {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // API URL detection
  const API_BASE_URL = (import.meta.env && import.meta.env.VITE_API_URL) 
                      || (process.env && process.env.REACT_APP_API_URL) 
                      || "http://localhost:5000";

  // --- 1. DOWNLOAD JSON BACKUP ---
  const handleJSONBackup = async () => {
    setLoading(true);
    try {
      const response = await downloadFullBackup();
      if (response.data.success) {
        const dataStr = JSON.stringify(response.data.backupFile, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        const date = new Date().toISOString().split('T')[0];
        link.setAttribute('download', `Dharashakti_Master_Backup_${date}.json`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Backup Error:", error);
      alert("JSON Backup failed! Check server connection.");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. EXCEL EXPORT (Server Side) ---
  const handleExcelExport = async () => {
    setLoading(true);
    try {
      const response = await exportBackupToExcel();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Dharashakti_Inventory_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("Excel Export failed! Check if exceljs is installed on backend.");
    } finally {
      setLoading(false);
    }
  };

  // --- 3. PDF REPORT (Client Side) ---
  const handlePDFReport = async () => {
    setLoading(true);
    try {
      const response = await downloadFullBackup();
      const backup = response.data.backupFile;
      const doc = new jsPDF('p', 'mm', 'a4');
      
      // Styling
      doc.setFontSize(22);
      doc.setTextColor(16, 185, 129); // Emerald 600
      doc.text("Dharashakti Agro Management", 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Master Audit Report | Generated: ${new Date().toLocaleString()}`, 14, 28);
      doc.line(14, 32, 196, 32);

      let currentY = 40;

      // Extract collections from v3 format
      const dataToPrint = backup.collections?.data || backup.data;

      if (dataToPrint) {
        Object.entries(dataToPrint).forEach(([title, data]) => {
          if (data && Array.isArray(data) && data.length > 0) {
            if (currentY > 250) { doc.addPage(); currentY = 20; }
            
            doc.setFontSize(14);
            doc.setTextColor(30);
            doc.text(title.toUpperCase(), 14, currentY);

            const headers = Object.keys(data[0]).filter(k => !['_id', '__v', 'password'].includes(k));
            const rows = data.map(item => headers.map(h => {
                if (typeof item[h] === 'object') return 'Object/Ref';
                return String(item[h] || "-");
            }));

            autoTable(doc, {
              head: [headers],
              body: rows,
              startY: currentY + 5,
              theme: 'grid',
              styles: { fontSize: 7, font: 'helvetica' },
              headStyles: { fillColor: [16, 185, 129] },
              margin: { left: 14, right: 14 }
            });
            currentY = doc.lastAutoTable.finalY + 15;
          }
        });
      }
      doc.save(`DS_Audit_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      alert("PDF Generation Failed.");
    } finally {
      setLoading(false);
    }
  };

  // --- 4. RESTORE DATA ---
  const handleRestore = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const confirm = window.confirm("⚠️ DANGER: This will delete current database and restore from file. Proceed?");
    if (!confirm) { event.target.value = null; return; }

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        const response = await restoreSystemData(jsonData);
        if (response.data.success) {
          alert("✅ System Restored Successfully!");
          window.location.reload();
        }
      } catch (error) {
        alert("Restore failed: Invalid Backup File.");
      } finally {
        setLoading(false);
        event.target.value = null;
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* JSON Backup Button */}
      <button 
        onClick={handleJSONBackup} 
        disabled={loading}
        className="flex items-center gap-2 px-5 py-3 bg-zinc-900/40 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 hover:bg-zinc-900 transition-all shadow-xl disabled:opacity-50"
      >
        {loading ? <RefreshCcw size={14} className="animate-spin"/> : <FileJson size={14}/>} JSON
      </button>

      {/* Excel Export Button */}
      <button 
        onClick={handleExcelExport} 
        disabled={loading}
        className="flex items-center gap-2 px-5 py-3 bg-zinc-900/40 text-emerald-400 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 hover:bg-zinc-900 transition-all shadow-xl disabled:opacity-50"
      >
        <Download size={14}/> EXCEL
      </button>

      {/* PDF Report Button */}
      <button 
        onClick={handlePDFReport} 
        disabled={loading}
        className="flex items-center gap-2 px-5 py-3 bg-zinc-900/40 text-rose-400 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 hover:bg-zinc-900 transition-all shadow-xl disabled:opacity-50"
      >
        <FileText size={14}/> PDF REPORT
      </button>

      {/* Restore Hidden Input */}
      <input type="file" accept=".json" ref={fileInputRef} onChange={handleRestore} className="hidden" />
      
      {/* Restore Button */}
      <button 
        onClick={() => fileInputRef.current.click()} 
        disabled={loading}
        className="flex items-center gap-2 px-5 py-3 bg-amber-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-600/20 hover:scale-105 transition-all disabled:opacity-50"
      >
        <UploadCloud size={14}/> RESTORE
      </button>
    </div>
  );
};

export default BackupManager;