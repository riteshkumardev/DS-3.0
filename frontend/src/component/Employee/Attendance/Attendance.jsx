import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, Search, UserCheck, UserX, Clock, 
  ArrowLeft, CalendarDays, CheckCircle2, AlertCircle, 
  History, Users 
} from "lucide-react";

// Centralized Services
import { getAllStaff } from "../../../api/staffApi";
import { markAttendance, getAttendanceByDate } from '../../../api/attendanceApi';
import Loader from '../../Core_Component/Loader/Loader';

const Attendance = ({user}) => {
  // 💡 User Data & Auth
  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const userRole = user?.role || userData.role;
  console.log(user,"<--- User Role in Attendance.jsx");
  
  const isAuthorized = userRole === "ADMIN" || userRole === "ACCOUNTANT";

  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState({}); // Stores daily map
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState([]);

  // 1. Fetch Staff
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await getAllStaff();
      if (res.data.success) {
        setEmployees(res.data.data);
        // Default: Bulk mode ke liye saare employees select
        setSelectedEmployees(res.data.data.map(e => e._id));
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Attendance for selected Date
  const fetchDailyAttendance = useCallback(async () => {
    try {
      const res = await getAttendanceByDate(date);
      if (res.data.success && Array.isArray(res.data.data)) {
        const attMap = {};
        res.data.data.forEach(item => { 
          // Match by staffId ObjectId
          attMap[item.staffId?._id || item.staffId] = item; 
        });
        setAttendance(attMap);
      } else {
        setAttendance({});
      }
    } catch (err) { 
      setAttendance({}); 
    }
  }, [date]);

  useEffect(() => { fetchEmployees(); }, []);
  useEffect(() => { if (!isBulkMode) fetchDailyAttendance(); }, [fetchDailyAttendance, isBulkMode]);

  // 3. Mark Single Attendance
  const handleSingleMark = async (emp, status) => {
    if (!isAuthorized) return alert("❌ Permission Denied: Admin access required.");
    
    const payload = {
      date,
      performedBy: userData._id,
      attendanceData: [{
        staffId: emp._id,
        employeeId: emp.employeeId,
        status: status,
        remark: "DAILY ENTRY"
      }]
    };

    try {
      const res = await markAttendance(payload);
      if (res.data.success) {
        setAttendance(prev => ({
          ...prev, 
          [emp._id]: { status }
        }));
      }
    } catch (err) { 
        alert("Update failed: " + (err.response?.data?.message || "Server Error")); 
    }
  };

  // 4. Bulk Process
  const handleBulkSubmit = async (status) => {
    if (selectedEmployees.length === 0) return alert("Please select at least one employee.");
    if (!window.confirm(`Mark ${selectedEmployees.length} employees as ${status}?`)) return;

    setLoading(true);
    try {
      const payload = { 
        date: date,
        performedBy: userData._id,
        attendanceData: employees
          .filter(e => selectedEmployees.includes(e._id))
          .map(e => ({
            staffId: e._id,
            employeeId: e.employeeId,
            status: status,
            remark: "BULK UPDATE"
          }))
      };

      const res = await markAttendance(payload);
      if (res.data.success) {
        alert(`Successfully marked ${status} for selected staff! ✅`);
        setIsBulkMode(false);
        fetchDailyAttendance();
      }
    } catch (err) {
      alert("Bulk Update failed: " + (err.response?.data?.message || "Error"));
    } finally { setLoading(false); }
  };

  // Selection Logic
  const toggleSelect = (id) => {
    setSelectedEmployees(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name?.toLowerCase().includes(search.toLowerCase()) || 
    emp.employeeId?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* --- Header Section --- */}
        <div className={`p-6 border-b dark:border-zinc-800 flex flex-wrap justify-between items-center gap-4 transition-all duration-500 ${isBulkMode ? 'bg-indigo-600 shadow-indigo-500/20' : 'bg-emerald-600 shadow-emerald-500/20 shadow-lg'}`}>
          <div className="text-white">
            <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
              {isBulkMode ? <History size={28}/> : <CheckCircle2 size={28}/>}
              {isBulkMode ? "Backdated Bulk Entry" : "Daily Attendance"}
            </h2>
            <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mt-0.5 opacity-80">
               Dharashakti Agro Products | Workforce Logic
            </p>
          </div>
          
          <button 
             onClick={() => setIsBulkMode(!isBulkMode)}
             className="px-6 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
          >
            {isBulkMode ? "← Single Mode" : "Mass Selection Mode"}
          </button>
        </div>

        {/* --- Controls Bar --- */}
        <div className="p-6 bg-zinc-50/50 dark:bg-zinc-800/20 border-b dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[300px] relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-emerald-500" size={18} />
              <input 
                placeholder="Search staff name or employee ID..." 
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                value={search} onChange={e => setSearch(e.target.value)} 
              />
            </div>
            <div className="flex items-center gap-3 bg-white dark:bg-zinc-800 p-2.5 rounded-2xl border dark:border-zinc-700 shadow-sm">
               <span className="text-[10px] font-black text-emerald-600 uppercase px-2 flex items-center gap-1.5 border-r dark:border-zinc-700"><Calendar size={12}/> Date</span>
               <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-transparent text-sm font-bold outline-none dark:text-white px-2" />
            </div>
          </div>
        </div>

        {/* --- Table Section --- */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] border-b dark:border-zinc-800">
                {isBulkMode && (
                    <th className="px-6 py-5 text-center">
                        <input 
                            type="checkbox" 
                            className="accent-indigo-600 scale-125 cursor-pointer" 
                            onChange={(e) => {
                                if(e.target.checked) setSelectedEmployees(filteredEmployees.map(x => x._id));
                                else setSelectedEmployees([]);
                            }}
                            checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                        />
                    </th>
                )}
                <th className="px-6 py-5">Staff Identity</th>
                <th className="px-6 py-5">Designation</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800">
              {filteredEmployees.map((emp) => {
                const currentStatus = attendance[emp._id]?.status;
                const isSelected = selectedEmployees.includes(emp._id);
                
                return (
                  <tr key={emp._id} className={`${isBulkMode && isSelected ? 'bg-indigo-50/30 dark:bg-indigo-500/5' : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30'} transition-all`}>
                    {isBulkMode && (
                      <td className="px-6 py-4 text-center">
                        <input 
                            type="checkbox" 
                            className="accent-indigo-600 scale-125 cursor-pointer" 
                            checked={isSelected} 
                            onChange={() => toggleSelect(emp._id)} 
                        />
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex items-center justify-center font-black text-zinc-500 border dark:border-zinc-700">
                          {emp.photo && emp.photo !== "null" ? <img src={emp.photo} className="w-full h-full object-cover" alt="p" /> : emp.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[13px] font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-tighter">{emp.name}</span>
                           <span className="text-[10px] text-zinc-400 font-bold">{emp.employeeId}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border dark:border-zinc-700">{emp.role}</span>
                    </td>
                    <td className="px-6 py-4">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full w-max border ${
                          currentStatus === 'PRESENT' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20' : 
                          currentStatus === 'ABSENT' ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20' : 
                          currentStatus === 'HALF_DAY' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20' :
                          'bg-zinc-50 text-zinc-400 border-zinc-100 dark:bg-zinc-800 dark:border-zinc-700'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${currentStatus === 'PRESENT' ? 'bg-emerald-500' : currentStatus === 'ABSENT' ? 'bg-red-500' : currentStatus === 'HALF_DAY' ? 'bg-amber-500' : 'bg-zinc-300'}`} />
                          <span className="text-[10px] font-black uppercase">{currentStatus || 'PENDING'}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                      {!isBulkMode ? (
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleSingleMark(emp, 'PRESENT')} className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-all font-black text-xs shadow-sm">P</button>
                          <button onClick={() => handleSingleMark(emp, 'ABSENT')} className="w-9 h-9 bg-red-50 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all font-black text-xs shadow-sm">A</button>
                          <button onClick={() => handleSingleMark(emp, 'HALF_DAY')} className="w-9 h-9 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-500 hover:text-white transition-all font-black text-xs shadow-sm">H</button>
                        </div>
                      ) : (
                        <div className="text-center italic text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Selected</div>
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
          <div className="p-8 bg-zinc-900 dark:bg-zinc-800 border-t dark:border-zinc-700 animate-in slide-in-from-bottom-5 duration-300">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 max-w-4xl mx-auto">
              <div>
                <h4 className="text-white text-lg font-black uppercase tracking-tighter flex items-center gap-3">
                  <Users size={22} className="text-indigo-400"/> Processing {selectedEmployees.length} Staff Members
                </h4>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Apply status to all selected employees for {date}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <button onClick={() => handleBulkSubmit('PRESENT')} className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all active:scale-95">Mark Present</button>
                <button onClick={() => handleBulkSubmit('ABSENT')} className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 transition-all active:scale-95">Mark Absent</button>
                <button onClick={() => handleBulkSubmit('HOLIDAY')} className="px-8 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">Mark Holiday</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;