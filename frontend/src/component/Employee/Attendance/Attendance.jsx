import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios'; 
import { 
  Calendar, Search, UserCheck, UserX, Clock, 
  ArrowLeft, CalendarDays, CheckCircle2, AlertCircle, 
  History, Users, MoreHorizontal 
} from "lucide-react";
import Loader from '../../Core_Component/Loader/Loader';

const Attendance = ({ role }) => {
  // 💡 Restore Fix: Local storage se fresh role check karein
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = role || userData.role;
  const adminName = userData.name || "System Admin";
  
  const isAuthorized = userRole === "Admin" || userRole === "Accountant" || userData.isAdmin;

  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkStartDate, setBulkStartDate] = useState('');
  const [bulkEndDate, setBulkEndDate] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const maskID = (id) => {
    if (!id) return "---";
    const strID = id.toString();
    return strID.length <= 4 ? strID : "ID-" + strID.slice(-4);
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/employees`);
      if (res.data.success) {
        setEmployees(res.data.data);
        // Default: Bulk mode ke liye saare select kar lo
        setSelectedEmployees(res.data.data.map(e => e.employeeId.toString()));
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/attendance/${date}`);
      if (res.data.success && Array.isArray(res.data.data)) {
        const attObj = {};
        res.data.data.forEach(item => { 
          // 💡 Type Safety: key hamesha string honi chahiye
          attObj[item.employeeId.toString()] = item; 
        });
        setAttendance(attObj);
      } else {
        setAttendance({});
      }
    } catch (err) { 
      setAttendance({}); 
    }
  }, [API_URL, date]);

  useEffect(() => { fetchEmployees(); }, [API_URL]);
  useEffect(() => { if (!isBulkMode) fetchAttendance(); }, [fetchAttendance, isBulkMode]);

  const markAttendance = async (empId, empName, status) => {
    if (!isAuthorized) return alert("❌ Permission Denied: Only Admin can mark attendance.");
    
    try {
      const res = await axios.post(`${API_URL}/api/attendance`, {
        employeeId: empId.toString(), // 💡 Force String for Restore Safety
        name: empName, 
        status: status, 
        date: date,
        adminName: adminName // Backend audit logs ke liye
      });

      if (res.data.success) {
        setAttendance(prev => ({
          ...prev, 
          [empId.toString()]: { status, time: new Date().toLocaleTimeString() }
        }));
      }
    } catch (err) { 
        alert("Error: " + (err.response?.data?.message || err.message)); 
    }
  };

  // ... (toggleSelect and filteredEmployees logic remains same)
  const toggleSelect = (id) => {
    const strId = id.toString();
    setSelectedEmployees(prev => 
      prev.includes(strId) ? prev.filter(item => item !== strId) : [...prev, strId]
    );
  };

  const filteredEmployees = employees.filter(emp => {
    const searchTerm = search.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(searchTerm) || 
      emp.employeeId?.toString().includes(searchTerm)
    );
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedEmployees(filteredEmployees.map(e => e.employeeId.toString()));
    } else {
      setSelectedEmployees([]);
    }
  };

  const handleBulkAttendance = async (status) => {
    if (!bulkStartDate || !bulkEndDate) return alert("पहले Start और End डेट चुनें।");
    if (selectedEmployees.length === 0) return alert("कम से कम एक एम्प्लॉई चुनें।");
    if (!window.confirm(`${selectedEmployees.length} कर्मचारियों की उपस्थिति अपडेट करें?`)) return;

    setLoading(true);
    try {
      const payload = { 
        employeeIds: selectedEmployees, 
        startDate: bulkStartDate, 
        endDate: bulkEndDate, 
        status: status,
        adminName: adminName 
      };
      const res = await axios.post(`${API_URL}/api/attendance/bulk`, payload);
      if (res.data.success) {
        alert("Bulk Update Successful! ✅");
        setIsBulkMode(false);
        fetchAttendance();
      }
    } catch (err) {
      alert("Bulk Update failed: " + (err.response?.data?.message || "Server Error"));
    } finally { setLoading(false); }
  };

  if (loading) return <Loader />;


  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* --- Header Section --- */}
        <div className={`p-6 border-b dark:border-zinc-800 flex flex-wrap justify-between items-center gap-4 transition-colors ${isBulkMode ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
          <div className="text-white">
            <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
              {isBulkMode ? <History size={28}/> : <CheckCircle2 size={28}/>}
              {isBulkMode ? "Bulk Attendance Fill" : "Daily Attendance"}
            </h2>
            <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mt-0.5">
               {isBulkMode ? "Backdated mass attendance processing" : "Real-time daily reporting system"}
            </p>
          </div>
          
          <button 
             onClick={() => setIsBulkMode(!isBulkMode)}
             className="px-6 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95"
          >
            {isBulkMode ? <div className="flex items-center gap-2"><ArrowLeft size={14}/> Back to Daily</div> : <div className="flex items-center gap-2"><CalendarDays size={14}/> Bulk History Entry</div>}
          </button>
        </div>

        {/* --- Controls Bar --- */}
        <div className="p-6 bg-zinc-50/50 dark:bg-zinc-800/20 border-b dark:border-zinc-800 flex flex-wrap items-center gap-6">
          {isBulkMode ? (
            <div className="flex flex-wrap items-center gap-4 w-full">
              <div className="flex-1 min-w-[240px] flex items-center gap-3 bg-white dark:bg-zinc-800 p-2.5 rounded-2xl border dark:border-zinc-700 shadow-sm ring-2 ring-indigo-500/10">
                <span className="text-[10px] font-black text-indigo-500 uppercase px-2">From</span>
                <input type="date" value={bulkStartDate} onChange={e => setBulkStartDate(e.target.value)} className="bg-transparent text-sm font-bold outline-none flex-1 dark:text-white" />
              </div>
              <div className="flex-1 min-w-[240px] flex items-center gap-3 bg-white dark:bg-zinc-800 p-2.5 rounded-2xl border dark:border-zinc-700 shadow-sm ring-2 ring-indigo-500/10">
                <span className="text-[10px] font-black text-indigo-500 uppercase px-2">To</span>
                <input type="date" value={bulkEndDate} onChange={e => setBulkEndDate(e.target.value)} className="bg-transparent text-sm font-bold outline-none flex-1 dark:text-white" />
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4 w-full">
              <div className="flex-1 min-w-[300px] relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-emerald-500" size={18} />
                <input 
                  placeholder="Search staff name or employee ID..." 
                  className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                  value={search} onChange={e => setSearch(e.target.value)} 
                />
              </div>
              <div className="flex items-center gap-3 bg-white dark:bg-zinc-800 p-2.5 rounded-2xl border dark:border-zinc-200 dark:border-zinc-700 shadow-sm">
                 <span className="text-[10px] font-black text-emerald-600 uppercase px-2 border-r dark:border-zinc-700 flex items-center gap-1.5"><Calendar size={12}/> Select Date</span>
                 <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-transparent text-sm font-bold outline-none dark:text-white px-2" />
              </div>
            </div>
          )}
        </div>

        {/* --- Table Section --- */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] border-b dark:border-zinc-800">
                {isBulkMode && <th className="px-6 py-5 text-center"><input type="checkbox" className="accent-indigo-600 scale-125" onChange={handleSelectAll} checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0} /></th>}
                <th className="px-6 py-5">Staff Identity</th>
                <th className="px-6 py-5">Details</th>
                <th className="px-6 py-5">{isBulkMode ? "Process Status" : "Attendance State"}</th>
                <th className="px-6 py-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
              {filteredEmployees.map((emp) => {
                const currentStatus = attendance[emp.employeeId.toString()]?.status;
                const isSelected = selectedEmployees.includes(emp.employeeId.toString());
                
                return (
                  <tr key={emp._id} className={`${isBulkMode && isSelected ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30'} transition-all`}>
                    {isBulkMode && (
                      <td className="px-6 py-4 text-center">
                        <input type="checkbox" className="accent-indigo-600 scale-125" checked={isSelected} onChange={() => toggleSelect(emp.employeeId)} />
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border-2 border-white dark:border-zinc-700 shadow-sm overflow-hidden flex items-center justify-center">
                          {emp.photo ? <img src={emp.photo} className="w-full h-full object-cover" alt="profile" /> : <span className="text-zinc-400 font-black">{emp.name?.charAt(0)}</span>}
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[13px] font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-tighter">{emp.name}</span>
                           <span className="text-[10px] text-zinc-400 font-bold">{maskID(emp.employeeId)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border dark:border-zinc-700">{emp.designation}</span>
                    </td>
                    <td className="px-6 py-4">
                      {isBulkMode ? (
                        <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase ${isSelected ? 'text-indigo-600' : 'text-zinc-400'}`}>
                           {isSelected ? <CheckCircle2 size={14}/> : <UserX size={14}/>}
                           {isSelected ? "Active for Processing" : "Excluded"}
                        </div>
                      ) : (
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full w-max border ${
                          currentStatus === 'Present' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20' : 
                          currentStatus === 'Absent' ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20' : 
                          currentStatus === 'Half-Day' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20' :
                          'bg-zinc-50 text-zinc-400 border-zinc-100 dark:bg-zinc-800 dark:border-zinc-700'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${currentStatus === 'Present' ? 'bg-emerald-500' : currentStatus === 'Absent' ? 'bg-red-500' : currentStatus === 'Half-Day' ? 'bg-amber-500' : 'bg-zinc-300'}`} />
                          <span className="text-[10px] font-black uppercase">{currentStatus || 'Pending'}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {!isBulkMode ? (
                        <div className="flex justify-center gap-2">
                          <button title="Present" onClick={() => markAttendance(emp.employeeId, emp.name, 'Present')} className="w-9 h-9 flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-all font-black text-xs">P</button>
                          <button title="Absent" onClick={() => markAttendance(emp.employeeId, emp.name, 'Absent')} className="w-9 h-9 flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all font-black text-xs">A</button>
                          <button title="Half Day" onClick={() => markAttendance(emp.employeeId, emp.name, 'Half-Day')} className="w-9 h-9 flex items-center justify-center bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl hover:bg-amber-500 hover:text-white transition-all font-black text-xs">H</button>
                        </div>
                      ) : (
                        <div className="text-center italic text-zinc-400 text-[11px] font-bold">Ready</div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* --- Bulk Footer Actions --- */}
        {isBulkMode && (
          <div className="p-8 bg-zinc-900 dark:bg-zinc-800 border-t dark:border-zinc-700 animate-in slide-in-from-bottom-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 max-w-4xl mx-auto">
              <div>
                <h4 className="text-white text-lg font-black uppercase tracking-tighter flex items-center gap-2">
                  <Users size={20} className="text-indigo-400"/> Processing {selectedEmployees.length} Staff
                </h4>
                <p className="text-white/50 text-[10px] font-bold uppercase">Apply mass status update for selected range</p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <button onClick={() => handleBulkAttendance('Present')} className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-95">Apply Present</button>
                <button onClick={() => handleBulkAttendance('Absent')} className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 transition-all active:scale-95">Apply Absent</button>
                <button onClick={() => handleBulkAttendance('Holiday')} className="px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 transition-all active:scale-95">Apply Holiday</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`
        /* Custom Scrollbar for modern look */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 10px; }
        .dark ::-webkit-scrollbar-thumb { background: #27272a; }
      `}</style>
    </div>
  );
};

export default Attendance;