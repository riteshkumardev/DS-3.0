import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { 
  Search, Edit3, Eye, FileDown, Plus, Camera
} from "lucide-react";

// API Services
import { getAllStaff, uploadProfileImage } from "../../api/staffApi"; 

// Components & Utils
import Loader from '../Core_Component/Loader/Loader';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getAttendanceByDate } from '../../api/attendanceApi';

// ========================================================
// 📊 PRIMARY MAIN COMPONENT: STAFF MANAGEMENT DATA DIRECTORY
// ========================================================
const EmployeeTable = ({ user, onOpenAdd, onOpenEdit }) => { 
  const role = user?.role;
  const isAuthorized = role === "ADMIN" || role === "MANAGER" || role === "ACCOUNTANT";
  const navigate = useNavigate();

  // Internal Core states
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]); 

  // Fetch verified active employees dataset
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await getAllStaff(); 
      if (res.data.success) {
        // 🎯 EXCLUDE REMOVED WORKERS: Jo chor chuke hain ya blocked hain unhe list nahi karenge
        const activeRecords = res.data.data.filter(
          emp => emp.status !== "LEFT" && emp.status !== "TERMINATED" && emp.isBlocked !== true
        );
        setEmployees(activeRecords);
      }
    } catch (err) {
      console.error("Staff Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // 🖼️ HANDLE DYNAMIC TARGET IMAGE UPLOAD
  const handleStaffImageChange = async (e, targetEmpId) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedExtensions = /(\.jpg|\.jpeg|\.png)$/i;
    if (!allowedExtensions.exec(file.name)) {
      return alert("Invalid format. Only JPG, JPEG, and PNG are allowed.");
    }

    if (file.size > 2 * 1024 * 1024) {
      return alert("File size too large (Max 2MB)");
    }

    const formData = new FormData();
    formData.append("photo", file); 
    formData.append("employeeId", targetEmpId); 

    try {
      setLoading(true);
      const res = await uploadProfileImage(formData);

      if (res.data.success) {
        alert("✅ Photo updated successfully inside registry node!");
        fetchEmployees(); 
      }
    } catch (err) {
      alert(err.response?.data?.message || "Upload operation execution failure.");
    } finally {
      setLoading(false);
      e.target.value = null; 
    }
  };

  // Selection Matrix Handlers
  const handleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (filteredList) => {
    if (selectedIds.length === filteredList.length && filteredList.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredList.map(emp => emp._id));
    }
  };

  // Report Builder Engine handler
  const downloadReport = async () => {
    if (selectedIds.length === 0) return alert("Please select staff members first!");

    try {
      const doc = new jsPDF('landscape');
      const tableColumn = ["Sr.", "Emp ID", "Name", "Designation", "Base Salary", "Days worked", "Earned Amount", "Status"];
      const tableRows = [];

      let grandTotalEarned = 0;
      const employeesToExport = employees.filter(emp => selectedIds.includes(emp._id));

      const attRes = await getAttendanceByDate(""); 
      const allAttendance = attRes.data.data || [];
      const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

      employeesToExport.forEach((emp, i) => {
        const empAtt = allAttendance.filter(a => String(a.employeeId) === String(emp.employeeId));
        const presentDays = empAtt.filter(a => a.status === 'PRESENT').length;
        const halfDays = empAtt.filter(a => a.status === 'HALF_DAY').length;
        const totalWorkDays = presentDays + (halfDays * 0.5);
        
        const earned = Math.round((Number(emp.baseSalary || 0) / daysInMonth) * totalWorkDays);
        grandTotalEarned += earned;

        tableRows.push([
          i + 1, 
          emp.employeeId, 
          emp.name, 
          emp.role || "STAFF",
          `Rs.${emp.baseSalary}`, 
          totalWorkDays, 
          `Rs.${earned.toLocaleString()}`,
          emp.status || "ACTIVE"
        ]);
      });

      tableRows.push([
        { content: 'GRAND TOTAL', colSpan: 6, styles: { halign: 'right', fillColor: [240, 240, 240], fontStyle: 'bold' } },
        { content: `Rs.${grandTotalEarned.toLocaleString()}`, styles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: [16, 185, 129] } },
        { content: '', styles: { fillColor: [240, 240, 240] } }
      ]);

      doc.setFontSize(18);
      doc.setTextColor(16, 185, 129);
      doc.text("DHARASHAKTI AGRO - CONSOLIDATED STAFF REPORT", 14, 15);
      
      autoTable(doc, { 
        head: [tableColumn], 
        body: tableRows, 
        startY: 25, 
        theme: 'grid', 
        headStyles: { fillColor: [16, 185, 129], fontSize: 10 },
        styles: { fontSize: 9 }
      });

      doc.save(`Dharashakti_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) { 
      console.error(err);
      alert("Failed to generate PDF"); 
    }
  };

  const getImageUrl = (path) => {
    const API_BASE = "https://dharashakti30backend.vercel.app";
    if (!path || path === "null") return "https://i.imgur.com/6VBx3io.png";
    if (path.startsWith('http')) return path;
    return `${API_BASE}/${path.replace(/\\/g, '/')}`;
  };

  const filtered = employees.filter(emp => 
    emp.name?.toLowerCase().includes(search.toLowerCase()) || 
    emp.employeeId?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-6 font-sans">
      <div className="max-w-screen-2xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* Table Toolbar Action Rows Header */}
        <div className="p-6 border-b dark:border-zinc-800 flex flex-wrap justify-between items-center gap-4 bg-zinc-50/50 dark:bg-zinc-800/20">
          <div className="flex items-center gap-4">
            <input 
               type="checkbox" 
               className="w-5 h-5 cursor-pointer rounded accent-emerald-600"
               onChange={() => handleSelectAll(filtered)}
               checked={selectedIds.length === filtered.length && filtered.length > 0}
            />
            <h2 className="text-xl font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-tighter">
              Active Directory <span className="text-emerald-500 ml-2">[{filtered.length}]</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-3 flex-1 max-w-3xl justify-end">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input 
                type="text" 
                placeholder="Search active profiles..." 
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <button 
              onClick={downloadReport}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase transition-all shadow-md active:scale-95 ${selectedIds.length > 0 ? 'bg-emerald-600 text-white' : 'bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed'}`}
              disabled={selectedIds.length === 0}
            >
              <FileDown size={18} /> Export PDF
            </button>

            {isAuthorized && (
              <button 
                onClick={onOpenAdd}
                className="flex items-center gap-2 px-5 py-3 bg-zinc-900 dark:bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase transition-all shadow-md active:scale-95 flex-shrink-0"
              >
                <Plus size={18} /> Add Staff
              </button>
            )}
          </div>
        </div>

        {/* Directory Rendering Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] border-b dark:border-zinc-800">
                <th className="px-6 py-5 text-center">Select</th>
                <th className="px-6 py-5">Employee ID</th>
                <th className="px-6 py-5">Photo</th>
                <th className="px-6 py-5">Full Name</th>
                <th className="px-6 py-5">Bank Account</th>
                <th className="px-6 py-5">Monthly Salary</th>
                <th className="px-6 py-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
              {filtered.map((emp) => (
                <tr key={emp._id} className={`${selectedIds.includes(emp._id) ? 'bg-emerald-50/20 dark:bg-emerald-500/5' : ''} hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-all`}>
                  <td className="px-6 py-4 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 cursor-pointer accent-emerald-600"
                      checked={selectedIds.includes(emp._id)}
                      onChange={() => handleSelectOne(emp._id)}
                    />
                  </td>
                  <td className="px-6 py-4 font-black text-sm text-zinc-500 tracking-wider">
                    {emp.employeeId}
                  </td>
                  
                  {/* 📸 PHOTO FIELD WITH HOVER CAMERA TRIGGER UPLOAD */}
                  <td className="px-6 py-4">
                    <div className="relative w-12 h-12 group rounded-2xl overflow-hidden border dark:border-zinc-700 shadow-sm bg-zinc-100 dark:bg-zinc-800">
                      <img 
                          src={getImageUrl(emp.photo)} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                          alt="emp" 
                          onError={(e) => e.target.src = "https://i.imgur.com/6VBx3io.png"}
                      />
                      {isAuthorized && (
                        <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer duration-150">
                          <Camera size={14} className="text-white" />
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleStaffImageChange(e, emp._id)} 
                          />
                        </label>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-zinc-700 dark:text-zinc-200 uppercase">{emp.name}</span>
                      <span className="text-[10px] text-zinc-400 font-bold tracking-widest">{emp.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-zinc-600 dark:text-zinc-300">
                        {emp.bankDetails?.accountNumber || 'NOT PROVIDED'}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-zinc-400">
                        {emp.bankDetails?.bankName || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-emerald-600">₹{Number(emp.baseSalary || 0).toLocaleString()}</span>
                      <span className="text-[9px] uppercase font-black text-zinc-400 tracking-tighter">{emp.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      {isAuthorized && (
                        <button onClick={() => onOpenEdit(emp)} className="p-2 text-zinc-400 hover:text-emerald-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl">
                          <Edit3 size={17}/>
                        </button>
                      )}
                      <button onClick={() => navigate(`/staff-ledger/${emp.employeeId}`)} className="p-2 text-zinc-400 hover:text-amber-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl">
                        <Eye size={17}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeTable;