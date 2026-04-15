import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios'; 
import 'react-calendar/dist/Calendar.css'; 
import { 
  User, CreditCard, Landmark, Banknote, CalendarDays, 
  History, BookOpen, ChevronRight,
  TrendingUp, TrendingDown, ShieldCheck, DollarSign,
  FileText,
  Users
} from "lucide-react";
import Loader from "../../Core_Component/Loader/Loader";
import ProfessionalPayslip from './Payslip/ProfessionalPayslip';
import EmployeeIDCard from './EmployeeIDCard/EmployeeIDCard';
import EmployeePassbook from './EmployeePassbook';
import AttendanceHistory from '../Attendance/AttendanceHistory';

const getDaysInMonth = (monthStr) => {
  const [year, month] = monthStr.split('-').map(Number);
  return new Date(year, month, 0).getDate();
};

const EmployeeLedger = ({ user }) => {

  
  const role = user?.role;
    console.log(role,"user info ");
  const isAuthorized = role === "ADMIN" || role === "ACCOUNTANT";
  const isBoss = isAuthorized || role === "MANAGER";

  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, halfDay: 0 });

  const [advanceAmount, setAdvanceAmount] = useState('');
  const [overtimeHours, setOvertimeHours] = useState('');
  const [incentive, setIncentive] = useState('');

  const [showCalendar, setShowCalendar] = useState(false);
  const [showPayslip, setShowPayslip] = useState(false);
  const [showIDCard, setShowIDCard] = useState(false);
  const [showPassbook, setShowPassbook] = useState(false);

  const [fullAttendanceData, setFullAttendanceData] = useState({}); 
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0,7));

  const API_URL = process.env.REACT_APP_API_URL || "https://dharashakti30backend.vercel.app";

  const getPhotoURL = (photoPath) => {
    if (!photoPath || photoPath === "null") return "https://i.imgur.com/6VBx3io.png";
    return photoPath.startsWith('http') ? photoPath : `${API_URL}/${photoPath.replace(/\\/g, '/')}`;
  };

  const maskID = (id) => {
    if (!id) return "---";
    const strID = id.toString();
    return strID.startsWith("DS-") ? strID : `EMP-${strID.slice(-4)}`;
  };

  // Memoized available months logic
  const availableMonths = useMemo(() => {
    const monthsSet = new Set();
    const now = new Date();
    monthsSet.add(now.toISOString().slice(0,7));
    
    if (selectedEmp?.joiningDate) {
      const start = new Date(selectedEmp.joiningDate);
      if (!isNaN(start)) {
        let temp = new Date(start.getFullYear(), start.getMonth(), 1);
        while (temp <= now) {
          monthsSet.add(temp.toISOString().slice(0,7));
          temp.setMonth(temp.getMonth() + 1);
        }
      }
    }
    return Array.from(monthsSet).sort((a,b)=> new Date(b) - new Date(a));
  }, [selectedEmp]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/employees`);
      if (res.data.success) setEmployees(res.data.data);
    } catch (err) {
      console.error("Staff load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isBoss) fetchEmployees();
  }, [isBoss]);

  const viewLedger = async (emp, month = selectedMonth) => {
    setSelectedEmp(emp);
    const empId = emp.employeeId;
    const staffId = emp._id; // ObjectId for attendance report

    try {
      // 💡 Fetching using both EmployeeID for payments and ObjectId for Attendance
      const [payRes, attRes] = await Promise.all([
        axios.get(`${API_URL}/api/salary-payments/${empId}`),
        axios.get(`${API_URL}/api/attendance/report/${staffId}?month=${month.split('-')[1]}&year=${month.split('-')[0]}`)
      ]);

      if (payRes.data.success) {
        setAllPayments(payRes.data.data);
        setPaymentHistory(payRes.data.data.filter(p => p.date.substring(0,7) === month).reverse());
      }

      if (attRes.data.success) {
        const historyArray = attRes.data.data;
        const attendanceMap = {};
        
        // Syncing with Backend Enums: PRESENT, ABSENT, HALF_DAY
        let p = attRes.data.summary?.PRESENT || 0;
        let a = attRes.data.summary?.ABSENT || 0;
        let h = attRes.data.summary?.HALF_DAY || 0;

        historyArray.forEach(record => {
          attendanceMap[record.date] = record.status;
        });

        setAttendanceStats({ present: p, absent: a, halfDay: h });
        setFullAttendanceData(attendanceMap);
      }
    } catch(err) {
      console.error("Fetch error", err);
    }
  };

  useEffect(() => {
    if (selectedEmp) viewLedger(selectedEmp, selectedMonth);
  }, [selectedMonth]);

  // Financial Calculations
  const baseSal = selectedEmp ? Number(selectedEmp.baseSalary || 0) : 0;
  const daysInCurrentMonth = getDaysInMonth(selectedMonth);
  const dayRate = baseSal / daysInCurrentMonth;
  const effectiveDaysWorked = attendanceStats.present + (attendanceStats.halfDay * 0.5);
  const grossEarned = Math.round(dayRate * effectiveDaysWorked);
  const totalAdvance = paymentHistory.reduce((sum,p)=> sum + Number(p.amount), 0);
  const otEarning = (Number(overtimeHours)||0)*(dayRate/8);
  const totalEarnings = Math.round(grossEarned + otEarning + (Number(incentive)||0));
  const netPayable = totalEarnings - totalAdvance;

  const handlePayment = async (e) => {
    e.preventDefault();
    if(!isAuthorized || !advanceAmount) return;
    try {
      const res = await axios.post(`${API_URL}/api/salary-payments`, {
        employeeId: selectedEmp.employeeId,
        amount: Number(advanceAmount),
        date: selectedMonth === new Date().toISOString().slice(0,7) 
              ? new Date().toISOString().split('T')[0] 
              : `${selectedMonth}-01`,
        type: 'ADVANCE'
      });
      if(res.data.success) {
        setAdvanceAmount('');
        alert("✅ Payment Recorded Successfully");
        viewLedger(selectedEmp, selectedMonth);
      }
    } catch { alert("Error saving payment."); }
  };

  if(loading) return <Loader />;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-zinc-800 dark:text-zinc-100 flex items-center gap-3 uppercase tracking-tighter">
              <ShieldCheck className="text-emerald-600" size={32} /> Payroll & Ledger
            </h2>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mt-1">Dharashakti Agro Products</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Side Staff List */}
          {isBoss && (
            <div className="lg:col-span-3 bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden h-fit sticky top-8">
              <div className="p-6 border-b dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30">
                 <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2"><Users size={14}/> Active Workforce</span>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
                {employees.map(emp => (
                  <div key={emp._id} onClick={() => viewLedger(emp)} className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 ${selectedEmp?.employeeId === emp.employeeId ? 'bg-emerald-600 text-white shadow-lg scale-105' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                    <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white/20 shadow-sm"><img src={getPhotoURL(emp.photo)} className="w-full h-full object-cover" alt="p" /></div>
                    <div className="flex-1 truncate">
                      <p className="text-xs font-black uppercase truncate tracking-tighter">{emp.name}</p>
                      <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest">{emp.employeeId}</p>
                    </div>
                    <ChevronRight size={14} className={selectedEmp?.employeeId === emp.employeeId ? "opacity-100" : "opacity-0"} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Ledger Content */}
          {selectedEmp ? (
            <div className="lg:col-span-9 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              
              {/* Profile Card */}
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5"><Banknote size={120} /></div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-20 h-20 rounded-[2rem] overflow-hidden ring-4 ring-emerald-500/10 shadow-xl"><img src={getPhotoURL(selectedEmp.photo)} className="w-full h-full object-cover" alt="P" /></div>
                  <div>
                    <h3 className="text-2xl font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-tighter leading-none mb-2">{selectedEmp.name}</h3>
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-[10px] font-black rounded-lg uppercase">{selectedEmp.role}</span>
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">ID: {selectedEmp.employeeId}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-zinc-100 dark:bg-zinc-800 p-3 rounded-2xl border dark:border-zinc-700 shadow-inner">
                  <CalendarDays size={18} className="text-emerald-600" />
                  <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent text-xs font-black outline-none dark:text-white cursor-pointer uppercase">
                    {availableMonths.map(m => <option key={m} value={m}>{new Date(m + "-01").toLocaleString('default', { month: 'long', year: 'numeric' })}</option>)}
                  </select>
                </div>
              </div>

              {/* Attendance Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border dark:border-zinc-800 shadow-sm text-center"><p className="text-[9px] font-black text-zinc-400 uppercase mb-1">Billable Days</p><p className="text-xl font-black text-zinc-800 dark:text-zinc-200">{effectiveDaysWorked}</p></div>
                 <div className="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-3xl border border-emerald-100 dark:border-emerald-900/50 text-center"><p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Present</p><p className="text-xl font-black text-emerald-600">{attendanceStats.present}</p></div>
                 <div className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-3xl border border-amber-100 dark:border-amber-900/50 text-center"><p className="text-[9px] font-black text-amber-600 uppercase mb-1">Half Day</p><p className="text-xl font-black text-amber-600">{attendanceStats.halfDay}</p></div>
                 <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-3xl border border-red-100 dark:border-red-900/50 text-center"><p className="text-[9px] font-black text-red-600 uppercase mb-1">Absent</p><p className="text-xl font-black text-red-600">{attendanceStats.absent}</p></div>
              </div>

              {/* Actions Toolbar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button onClick={() => setShowCalendar(true)} className="flex items-center justify-center gap-3 py-4 bg-zinc-100 dark:bg-zinc-800 rounded-3xl text-[10px] font-black uppercase transition-all hover:bg-zinc-200"><History size={18}/> Attendance</button>
                <button onClick={() => { setShowPassbook(!showPassbook); setShowPayslip(false); }} className={`flex items-center justify-center gap-3 py-4 rounded-3xl text-[10px] font-black uppercase transition-all ${showPassbook ? 'bg-zinc-800 text-white' : 'bg-emerald-50 text-emerald-600'}`}><BookOpen size={18}/> Passbook</button>
                <button onClick={() => setShowIDCard(!showIDCard)} className="flex items-center justify-center gap-3 py-4 bg-sky-50 dark:bg-sky-950/20 text-sky-600 rounded-3xl text-[10px] font-black uppercase transition-all"><CreditCard size={18}/> ID Card</button>
                <button onClick={() => setShowPayslip(!showPayslip)} className="flex items-center justify-center gap-3 py-4 bg-zinc-900 text-white rounded-3xl text-[10px] font-black uppercase shadow-xl shadow-zinc-500/20 active:scale-95"><FileText size={18}/> Payslip</button>
              </div>

              {showPassbook ? (
                <EmployeePassbook selectedEmp={selectedEmp} availableMonths={availableMonths} fullAttendanceData={fullAttendanceData} allPayments={allPayments} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Earnings Calculation */}
                  <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
                    <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 border-b dark:border-zinc-800 pb-4"><TrendingUp size={18}/> Earnings Structure</h4>
                    <div className="space-y-4 text-sm font-bold">
                      <div className="flex justify-between text-zinc-400"><span>Base Monthly:</span> <span className="text-zinc-800 dark:text-zinc-200">₹{baseSal.toLocaleString()}</span></div>
                      <div className="flex justify-between border-b dark:border-zinc-800 pb-3 text-zinc-400"><span>Work Credit:</span> <span className="text-emerald-600">₹{grossEarned.toLocaleString()}</span></div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black text-zinc-400 ml-1">Incentive</label>
                            <input type="number" value={incentive} onChange={(e)=>setIncentive(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl outline-none text-xs font-black border dark:border-zinc-700 focus:border-emerald-500" placeholder="0.00" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black text-zinc-400 ml-1">OT Hours</label>
                            <input type="number" value={overtimeHours} onChange={(e)=>setOvertimeHours(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl outline-none text-xs font-black border dark:border-zinc-700 focus:border-emerald-500" placeholder="0" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Net Pay & Deductions */}
                  <div className="bg-zinc-900 p-8 rounded-[2.5rem] flex flex-col justify-between shadow-2xl relative overflow-hidden">
                    <div className="absolute -bottom-10 -left-10 opacity-10"><DollarSign size={200} className="text-white" /></div>
                    <div className="relative z-10">
                      <h4 className="text-xs font-black text-red-400 uppercase tracking-widest flex items-center gap-2 border-b border-white/10 pb-4"><TrendingDown size={18}/> Salary Deductions</h4>
                      <div className="flex justify-between items-center text-sm font-bold mt-6">
                        <span className="text-zinc-400">Total Advance Taken:</span> 
                        <span className="text-red-400 text-lg">- ₹{totalAdvance.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="mt-12 p-8 bg-white/5 backdrop-blur-sm rounded-[2rem] border border-white/10 text-center relative z-10">
                       <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-2">Final Net Payable</p>
                       <p className="text-5xl font-black text-white tracking-tighter">₹{netPayable.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {/* Payment Recording */}
                  {isAuthorized && (
                    <div className="md:col-span-2 bg-emerald-600 p-4 rounded-[2rem] flex flex-col md:flex-row items-center gap-4 shadow-xl shadow-emerald-600/20">
                       <div className="flex-1 relative w-full">
                          <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-600" size={20} />
                          <input type="number" value={advanceAmount} onChange={(e)=>setAdvanceAmount(e.target.value)} placeholder="Enter amount to record payment/advance..." className="w-full pl-14 pr-6 py-4 bg-white rounded-[1.5rem] text-sm font-black outline-none placeholder:text-zinc-300" />
                       </div>
                       <button onClick={handlePayment} className="w-full md:w-auto px-10 py-4 bg-zinc-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95">Confirm Payment</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="lg:col-span-9 flex flex-col items-center justify-center py-40 bg-zinc-100/50 dark:bg-zinc-800/10 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
               <ShieldCheck size={80} className="mb-6 text-zinc-300 animate-pulse" />
               <h3 className="uppercase font-black tracking-[0.3em] text-zinc-400 text-sm">Select a staff member to access ledger</h3>
            </div>
          )}
        </div>
      </div>

      <AttendanceHistory
        show={showCalendar}
        onClose={() => setShowCalendar(false)}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        fullAttendanceData={fullAttendanceData}
      />

      {selectedEmp && showPayslip && (
        <ProfessionalPayslip 
          selectedEmp={selectedEmp} 
          stats={{...attendanceStats, effectiveDaysWorked, totalMonthDays: daysInCurrentMonth}} 
          payroll={{grossEarned, totalAdvance, otEarning, totalEarnings, netPayable, incentive}} 
          currentMonth={selectedMonth} 
        />
      )}
      
      {selectedEmp && showIDCard && <EmployeeIDCard selectedEmp={selectedEmp} />}
    </div>
  );
};

export default EmployeeLedger;