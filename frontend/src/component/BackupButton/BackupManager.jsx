import React, { useState, useRef } from 'react';
import axios from 'axios';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const BackupManager = () => {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // ✅ Fix: Auto-detect API URL from environment variable or fallback to local
  // Note: Vite uses 'import.meta.env', Create React App uses 'process.env'
  const API_BASE_URL = (import.meta.env && import.meta.env.VITE_API_URL) 
                      || (process.env && process.env.REACT_APP_API_URL) 
                      || "http://localhost:5000";

  // --- 1. DOWNLOAD JSON BACKUP ---
  const downloadBackup = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/backup/export-all`, {
        responseType: 'blob',
        withCredentials: true
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `Daharasakti_Backup_${date}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download Error:", error);
      // Alert mein clear URL dikhayega debug karne ke liye
      alert(`Backup fail! Check if server is running at: ${API_BASE_URL}`);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. DOWNLOAD PDF REPORT ---
  const downloadPDF = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/backup/export-all`, {
        withCredentials: true
      });
      
      const backupData = response.data;
      const doc = new jsPDF('p', 'mm', 'a4');
      let currentY = 20;

      // Report Header
      doc.setFontSize(20);
      doc.setTextColor(44, 62, 80);
      doc.text("Daharasakti Business Report", 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
      doc.line(14, 25, 196, 25);
      currentY = 35;

      // Collections Loop
      if (backupData.collections) {
        Object.entries(backupData.collections).forEach(([title, data]) => {
          if (data && Array.isArray(data) && data.length > 0) {
            if (currentY > 240) {
              doc.addPage();
              currentY = 20;
            }

            doc.setFontSize(14);
            doc.setTextColor(52, 152, 219);
            doc.text(title.toUpperCase(), 14, currentY);

            const headers = Object.keys(data[0]).filter(key => key !== '_id' && key !== '__v');
            const rows = data.map(item => headers.map(header => String(item[header] || "")));

            autoTable(doc, {
              head: [headers],
              body: rows,
              startY: currentY + 5,
              margin: { left: 14, right: 14 },
              theme: 'striped',
              styles: { fontSize: 7, cellPadding: 2 },
              headStyles: { fillColor: [41, 128, 185], textColor: 255 },
              didDrawPage: (dt) => {
                 currentY = dt.cursor.y + 15;
              }
            });
            
            currentY = (doc).lastAutoTable.finalY + 15;
          }
        });
      }

      doc.save(`Daharasakti_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("PDF Error:", error);
      alert("PDF banane mein problem aayi!");
    } finally {
      setLoading(false);
    }
  };

  // --- 3. RESTORE BACKUP LOGIC ---
  const handleRestore = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const confirmRestore = window.confirm("DHYAN DEIN: Purana data delete ho jayega. Restore karein?");
    if (!confirmRestore) {
      event.target.value = null;
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        const response = await axios.post(`${API_BASE_URL}/api/backup/restore`, jsonData, { withCredentials: true });
        if (response.data.success) {
          alert("Data Restore Successful! ✅");
          window.location.reload(); 
        }
      } catch (error) {
        console.error("Restore Error:", error);
        alert("Restore failed! Sahi file select karein.");
      } finally {
        setLoading(false);
        event.target.value = null; 
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
      <button onClick={downloadBackup} disabled={loading} style={buttonStyle("#10b981", loading)}>
        {loading ? "..." : "JSON Backup"}
      </button>

      <button onClick={downloadPDF} disabled={loading} style={buttonStyle("#ef4444", loading)}>
        {loading ? "..." : "PDF Report"}
      </button>

      <input type="file" accept=".json" ref={fileInputRef} onChange={handleRestore} style={{ display: 'none' }} />
      
      <button onClick={() => fileInputRef.current.click()} disabled={loading} style={buttonStyle("#3b82f6", loading)}>
        {loading ? "..." : "Restore"}
      </button>
    </div>
  );
};

const buttonStyle = (color, loading) => ({
  padding: "8px 14px",
  backgroundColor: loading ? "#a1a1aa" : color,
  color: "white",
  border: "none",
  borderRadius: "10px",
  cursor: loading ? "not-allowed" : "pointer",
  fontSize: "10px",
  fontWeight: "900",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  transition: "all 0.2s"
});

export default BackupManager;