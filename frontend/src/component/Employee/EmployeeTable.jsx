import React, { useState, useEffect } from 'react';
import axios from 'axios'; 
import { useNavigate } from "react-router-dom";
import { 
  Search, Edit3, Trash2, Eye, Camera, Check, X, 
  User, Phone, CreditCard, Landmark, Banknote, CalendarDays, FileDown 
} from "lucide-react";
import Loader from '../Core_Component/Loader/Loader';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const EmployeeTable = ({ user }) => { 
  const role = user?.role;
  const isAuthorized = role === "Admin" || role === "Accountant";

  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null); 
  const [editData, setEditData] = useState({});
  const [selectedIds, setSelectedIds] = useState([]); 
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || "https://dharashakti30backend.vercel.app";

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/employees`);
      if (res.data.success) {
        setEmployees(res.data.data);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [API_URL]);

  const handleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const filteredList = employees.filter(emp => 
        emp.name?.toLowerCase().includes(search.toLowerCase()) || 
        emp.employeeId?.toString().includes(search)
    );
    if (selectedIds.length === filteredList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredList.map(emp => emp._id));
    }
  };

  // --- PDF GENERATION LOGIC WITH SR NO & GRAND TOTAL ---
  const downloadReport = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one employee!");
      return;
    }

    try {
      const doc = new jsPDF('landscape');
      const tableColumn = ["Sr.", "Emp ID", "Name", "Role", "Base Salary", "Work Days", "Total Earned", "Paid", "Due"];
      const tableRows = [];

      // Totals calculate karne ke liye variables
      let grandTotalEarned = 0;
      let grandTotalPaid = 0;
      let grandTotalDue = 0;

      alert(`Generating Report for ${selectedIds.length} staff members...`);

      const attRes = await axios.get(`${API_URL}/api/attendance`);
      const allAttendance = attRes.data.data || [];

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

      const employeesToExport = employees.filter(emp => selectedIds.includes(emp._id));

      // Loop to build rows
      for (let i = 0; i < employeesToExport.length; i++) {
        const emp = employeesToExport[i];
        
        // 1. Attendance calculation
        const empAttendance = allAttendance.filter(a => String(a.employeeId) === String(emp.employeeId));
        const presentCount = empAttendance.filter(a => a.status === 'Present').length;
        const halfDayCount = empAttendance.filter(a => a.status === 'Half Day' || a.status === 'Half-Day').length;
        const totalWorkDays = presentCount + (halfDayCount * 0.5);

        // 2. Salary calculation
        const monthlySalary = Number(emp.salary) || 0;
        const dailyRate = monthlySalary / daysInMonth; 
        const totalSalaryEarned = Math.round(totalWorkDays * dailyRate);

        // 3. Payments fetch
        let totalPaid = 0;
        try {
            const payRes = await axios.get(`${API_URL}/api/salary-payments/${emp.employeeId}`);
            if (payRes.data.success && Array.isArray(payRes.data.data)) {
                totalPaid = payRes.data.data.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
            }
        } catch (payErr) {
            console.error(`Payment fetch failed for ${emp.employeeId}`);
        }

        const due = totalSalaryEarned - totalPaid;

        // Add to Grand Totals
        grandTotalEarned += totalSalaryEarned;
        grandTotalPaid += totalPaid;
        grandTotalDue += due;

        // Push Row Data
        tableRows.push([
          i + 1, // SR NO
          emp.employeeId,
          emp.name,
          emp.role || emp.designation,
          `Rs.${monthlySalary.toLocaleString()}`,
          totalWorkDays,
          `Rs.${totalSalaryEarned.toLocaleString()}`,
          `Rs.${totalPaid.toLocaleString()}`,
          `Rs.${due.toLocaleString()}`
        ]);
      }

      // Final Row: Grand Total
      tableRows.push([
        { content: 'GRAND TOTAL', colSpan: 6, styles: { halign: 'right', fillColor: [220, 220, 220], fontStyle: 'bold' } },
        { content: `Rs.${grandTotalEarned.toLocaleString()}`, styles: { fillColor: [220, 220, 220], fontStyle: 'bold' } },
        { content: `Rs.${grandTotalPaid.toLocaleString()}`, styles: { fillColor: [220, 220, 220], fontStyle: 'bold' } },
        { content: `Rs.${grandTotalDue.toLocaleString()}`, styles: { fillColor: [220, 220, 220], fontStyle: 'bold', textColor: [200, 0, 0] } }
      ]);

      // PDF Header Styling
      doc.setFontSize(18);
      doc.setTextColor(16, 185, 129);
      doc.text("DHARA SHAKTI AGRO - STAFF CONSOLIDATED REPORT", 14, 15);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Monthly Basis: ${daysInMonth} Days | Generated: ${new Date().toLocaleString()}`, 14, 22);

      // Generate Table
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129], fontSize: 9, halign: 'center' },
        styles: { fontSize: 8, cellPadding: 2.5 },
        columnStyles: {
            0: { halign: 'center', cellWidth: 10 }, // Sr. No column width
            5: { halign: 'center' }, // Work Days center
            6: { fontStyle: 'bold' }, 
            8: { textColor: [220, 38, 38], fontStyle: 'bold' }
        }
      });

      doc.save(`DharaShakti_Staff_Report_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (err) {
      console.error("PDF Error:", err);
      alert("Error generating report. Check console.");
    }
  };

  const startEdit = (emp) => {
    if (!isAuthorized) return;
    setEditId(emp._id); 
    setEditData({ ...emp });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const { _id, createdAt, updatedAt, __v, photo, ...payload } = editData;
      const res = await axios.put(`${API_URL}/api/employees/${editData.employeeId}`, {
        ...payload,
        salary: Number(editData.salary)
      });
      if (res.data.success) {
        alert("✅ Details Updated!");
        setEditId(null);
        fetchEmployees(); 
      }
    } catch (err) { alert("Update Error"); }
  };

  const handlePhotoChange = async (e, empId) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file); 
    try {
      await axios.put(`${API_URL}/api/employees/${empId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert("✅ Photo Updated!");
      fetchEmployees(); 
    } catch (err) { alert("Photo update failed"); }
  };

  const filtered = employees.filter(emp => 
    emp.name?.toLowerCase().includes(search.toLowerCase()) || 
    emp.employeeId?.toString().includes(search)
  );

  const getImageUrl = (path) => {
    if (!path) return "https://i.imgur.com/6VBx3io.png";
    if (path.startsWith('http')) return path;
    return `${API_URL}/${path.replace(/\\/g, '/')}`;
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-6 font-sans">
      <div className="max-w-screen-2xl mx-auto bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* Header Section */}
        <div className="p-6 border-b dark:border-zinc-800 flex flex-wrap justify-between items-center gap-4 bg-zinc-50/50 dark:bg-zinc-800/20">
          <div className="flex items-center gap-4">
            <input 
               type="checkbox" 
               className="w-5 h-5 cursor-pointer rounded accent-emerald-600 outline-none"
               onChange={handleSelectAll}
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
                placeholder="Search staff..." 
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <button 
              onClick={downloadReport}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase transition-all shadow-md active:scale-95 ${selectedIds.length > 0 ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed'}`}
              disabled={selectedIds.length === 0}
            >
              <FileDown size={18} /> Export PDF Report
            </button>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] border-b dark:border-zinc-800">
                <th className="px-6 py-5">Select</th>
                <th className="px-6 py-5">Emp ID</th>
                <th className="px-6 py-5">Profile</th>
                <th className="px-6 py-5">Name & Contact</th>
                <th className="px-6 py-5">Bank Details</th>
                <th className="px-6 py-5">Salary & Role</th>
                <th className="px-6 py-5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
              {filtered.map((emp) => (
                <tr key={emp._id} className={`${selectedIds.includes(emp._id) ? 'bg-emerald-50/20 dark:bg-emerald-500/5' : ''} hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-all`}>
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 cursor-pointer accent-emerald-600"
                      checked={selectedIds.includes(emp._id)}
                      onChange={() => handleSelectOne(emp._id)}
                    />
                  </td>
                  <td className="px-6 py-4 font-black text-sm text-zinc-500">#{emp.employeeId}</td>
                  <td className="px-6 py-4">
                    <div className="relative group w-12 h-12">
                      <img src={getImageUrl(emp.photo)} className="w-full h-full rounded-2xl object-cover border dark:border-zinc-700" alt="profile" onError={(e) => e.target.src = "https://i.imgur.com/6VBx3io.png"} />
                      {isAuthorized && (
                        <label className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                            <Camera size={16} className="text-white" />
                            <input type="file" hidden accept="image/*" onChange={(e) => handlePhotoChange(e, emp.employeeId)} />
                        </label>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {editId === emp._id ? (
                      <div className="space-y-1">
                        <input name="name" value={editData.name} onChange={handleEditChange} className="edit-input-zinc" />
                        <input name="phone" value={editData.phone} onChange={handleEditChange} className="edit-input-zinc" />
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-zinc-700 dark:text-zinc-200 uppercase">{emp.name}</span>
                        <span className="text-[10px] text-zinc-400 font-bold">{emp.phone}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editId === emp._id ? (
                      <input name="accountNo" value={editData.accountNo} onChange={handleEditChange} className="edit-input-zinc" />
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-zinc-600 dark:text-zinc-300">{emp.accountNo || 'N/A'}</span>
                        <span className="text-[9px] uppercase font-bold text-zinc-400">{emp.bankName}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editId === emp._id ? (
                      <div className="space-y-1">
                        <input name="salary" type="number" value={editData.salary} onChange={handleEditChange} className="edit-input-zinc" />
                        <input name="role" value={editData.role} onChange={handleEditChange} className="edit-input-zinc" />
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-emerald-600">₹{Number(emp.salary).toLocaleString()}</span>
                        <span className="text-[9px] uppercase font-black text-zinc-400">{emp.role || emp.designation}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      {editId === emp._id ? (
                        <button onClick={handleSave} className="p-2 bg-emerald-600 text-white rounded-xl"><Check size={18}/></button>
                      ) : (
                        <>
                          <button onClick={() => startEdit(emp)} className="p-2 text-zinc-400 hover:text-emerald-500"><Edit3 size={17}/></button>
                          <button onClick={() => navigate(`/staff-ledger/${emp.employeeId}`)} className="p-2 text-zinc-400 hover:text-amber-500"><Eye size={17}/></button>
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
        .edit-input-zinc { width: 100%; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 0.75rem; padding: 0.4rem 0.6rem; font-size: 0.75rem; outline: none; font-weight: 700; color: #1e293b; }
        .dark .edit-input-zinc { background: #09090b; border-color: #27272a; color: #f4f4f5; }
      `}</style>
    </div>
  );
};

export default EmployeeTable;