import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { 
  Search, Edit3, Camera, Check, X, Eye, FileDown 
} from "lucide-react";

// API Services
import { getAllStaff, updateStaff } from "../../api/staffApi"; 


// Components & Utils
import Loader from '../Core_Component/Loader/Loader';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getAttendanceByDate } from '../../api/attendanceApi';

const EmployeeTable = ({ user }) => { 
  const role = user?.role;
  const isAuthorized = role === "ADMIN" || role === "ACCOUNTANT";
  const navigate = useNavigate();

  // States
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null); 
  const [editData, setEditData] = useState({});
  const [selectedIds, setSelectedIds] = useState([]); 

  // 1. Fetch Staff Data
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await getAllStaff(); 
      if (res.data.success) {
        setEmployees(res.data.data);
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

  // Selection Handlers
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

  // 2. Generate Professional PDF Report
  const downloadReport = async () => {
    if (selectedIds.length === 0) return alert("Please select staff members first!");

    try {
      const doc = new jsPDF('landscape');
      const tableColumn = ["Sr.", "Emp ID", "Name", "Designation", "Base Salary", "Days worked", "Earned Amount", "Status"];
      const tableRows = [];

      let grandTotalEarned = 0;
      const employeesToExport = employees.filter(emp => selectedIds.includes(emp._id));

      // Fetch Attendance for logic (current month)
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

      // Grand Total Row
      tableRows.push([
        { content: 'GRAND TOTAL', colSpan: 6, styles: { halign: 'right', fillColor: [240, 240, 240], fontStyle: 'bold' } },
        { content: `Rs.${grandTotalEarned.toLocaleString()}`, styles: { fillColor: [240, 240, 240], fontStyle: 'bold', textColor: [16, 185, 129] } },
        { content: '', styles: { fillColor: [240, 240, 240] } }
      ]);

      // Title & PDF Design
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

  // 3. Edit & Update Logic
  const startEdit = (emp) => {
    if (!isAuthorized) return;
    setEditId(emp._id); 
    setEditData({ 
        ...emp, 
        salary: emp.baseSalary, 
        accountNo: emp.bankDetails?.accountNumber,
        bankName: emp.bankDetails?.bankName
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: editData.name.toUpperCase(),
        phone: editData.phone,
        salary: Number(editData.salary),
        accountNo: editData.accountNo,
        bankName: editData.bankName,
        role: editData.role
      };
      
      const res = await updateStaff(editData.employeeId, payload); 
      if (res.data.success) {
        alert("✅ Staff Details Updated Successfully!");
        setEditId(null);
        fetchEmployees(); 
      }
    } catch (err) { 
        alert(err.response?.data?.message || "Update Failed"); 
    }
  };

  // Utility: Image URL Builder
  const getImageUrl = (path) => {
    const API_BASE = "https://dharashakti30backend.vercel.app";
    if (!path || path === "null") return "https://i.imgur.com/6VBx3io.png";
    if (path.startsWith('http')) return path;
    return `${API_BASE}/${path.replace(/\\/g, '/')}`;
  };

  // Filter Logic
  const filtered = employees.filter(emp => 
    emp.name?.toLowerCase().includes(search.toLowerCase()) || 
    emp.employeeId?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-6 font-sans">
      <div className="max-w-screen-2xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* Table Header / Toolbar */}
        <div className="p-6 border-b dark:border-zinc-800 flex flex-wrap justify-between items-center gap-4 bg-zinc-50/50 dark:bg-zinc-800/20">
          <div className="flex items-center gap-4">
            <input 
               type="checkbox" 
               className="w-5 h-5 cursor-pointer rounded accent-emerald-600"
               onChange={() => handleSelectAll(filtered)}
               checked={selectedIds.length === filtered.length && filtered.length > 0}
            />
            <h2 className="text-xl font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-tighter">
              Staff Directory <span className="text-emerald-500 ml-2">[{selectedIds.length}]</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-3 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input 
                type="text" 
                placeholder="Search by name or Employee ID..." 
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <button 
              onClick={downloadReport}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase transition-all shadow-md active:scale-95 ${selectedIds.length > 0 ? 'bg-emerald-600 text-white' : 'bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed'}`}
              disabled={selectedIds.length === 0}
            >
              <FileDown size={18} /> Export PDF
            </button>
          </div>
        </div>

        {/* Staff Table */}
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
                  <td className="px-6 py-4">
                    <img 
                        src={getImageUrl(emp.photo)} 
                        className="w-12 h-12 rounded-2xl object-cover border dark:border-zinc-700 shadow-sm" 
                        alt="emp" 
                        onError={(e) => e.target.src = "https://i.imgur.com/6VBx3io.png"}
                    />
                  </td>
                  <td className="px-6 py-4">
                    {editId === emp._id ? (
                      <input name="name" value={editData.name} onChange={handleEditChange} className="edit-input-zinc" />
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-zinc-700 dark:text-zinc-200 uppercase">{emp.name}</span>
                        <span className="text-[10px] text-zinc-400 font-bold tracking-widest">{emp.phone}</span>
                      </div>
                    )}
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
                    {editId === emp._id ? (
                      <input name="salary" type="number" value={editData.salary} onChange={handleEditChange} className="edit-input-zinc" />
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-emerald-600">₹{Number(emp.baseSalary || 0).toLocaleString()}</span>
                        <span className="text-[9px] uppercase font-black text-zinc-400 tracking-tighter">{emp.role}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      {editId === emp._id ? (
                        <>
                          <button onClick={handleSave} className="p-2 bg-emerald-600 text-white rounded-xl shadow-lg"><Check size={18}/></button>
                          <button onClick={() => setEditId(null)} className="p-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-500 rounded-xl"><X size={18}/></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(emp)} className="p-2 text-zinc-400 hover:text-emerald-500 transition-colors"><Edit3 size={17}/></button>
                          <button onClick={() => navigate(`/staff-ledger/${emp.employeeId}`)} className="p-2 text-zinc-400 hover:text-amber-500 transition-colors"><Eye size={17}/></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .edit-input-zinc { 
            width: 100%; 
            background: #ffffff; 
            border: 1px solid #e4e4e7; 
            border-radius: 0.75rem; 
            padding: 0.4rem 0.6rem; 
            font-size: 0.75rem; 
            outline: none; 
            font-weight: 800; 
            color: #10b981; 
        }
        .dark .edit-input-zinc { background: #09090b; border-color: #27272a; color: #10b981; }
      `}</style>
    </div>
  );
};

export default EmployeeTable;