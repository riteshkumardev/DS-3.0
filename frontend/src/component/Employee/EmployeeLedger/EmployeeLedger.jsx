import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios'; 
import 'react-calendar/dist/Calendar.css'; 
import { 
  User, CreditCard, Landmark, Banknote, CalendarDays, 
  History, BookOpen, ChevronRight,
  TrendingUp, TrendingDown, ShieldCheck, DollarSign,
  FileText
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
  const isAuthorized = role === "Admin" || role === "Accountant";
  const isBoss = role === "Admin" || role === "Manager";

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

  const [fullAttendanceData, setFullAttendanceData] = useState({}); // Stores as { "YYYY-MM-DD": "Status" }
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0,7));

  const API_URL = process.env.REACT_APP_API_URL || "https://dharashakti30backend.vercel.app";

  const getPhotoURL = (photoPath) => {
    if (!photoPath) return "https://i.imgur.com/6VBx3io.png";
    return photoPath.startsWith('http') ? photoPath : `${API_URL}${photoPath}`;
  };

  const maskID = (id) => {
    if (!id) return "---";
    const strID = id.toString();
    return strID.length > 4 ? "XXXX" + strID.slice(-4) : strID;
  };

  // Memoized months for dropdown
  const availableMonths = useMemo(() => {
    const monthsSet = new Set();
    const now = new Date();
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
    Object.keys(fullAttendanceData).forEach(date => monthsSet.add(date.substring(0,7)));
    allPayments.forEach(p => { if (p.date) monthsSet.add(p.date.substring(0,7)); });
    monthsSet.add(now.toISOString().slice(0,7));
    return Array.from(monthsSet).sort((a,b)=> new Date(b) - new Date(a));
  }, [selectedEmp, fullAttendanceData, allPayments]);

  useEffect(() => {
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
    if (isBoss) fetchEmployees();
  }, [isBoss, API_URL]);

  const viewLedger = async (emp, month = selectedMonth) => {
    setSelectedEmp(emp);
    const empId = emp.employeeId || emp._id;

    try {
      const [payRes, attRes] = await Promise.all([
        axios.get(`${API_URL}/api/salary-payments/${empId}`),
        axios.get(`${API_URL}/api/attendance/report/${empId}`)
      ]);

      if (payRes.data.success) {
        setAllPayments(payRes.data.data);
        setPaymentHistory(payRes.data.data.filter(p => p.date.substring(0,7) === month).reverse());
      }

      if (attRes.data.success) {
        const historyArray = attRes.data.data; // This is the array from your res
        const attendanceMap = {};
        let p=0, a=0, h=0;

        // Converting Array to Object Map and Counting Stats
        historyArray.forEach(record => {
          const dateStr = record.date; // YYYY-MM-DD
          attendanceMap[dateStr] = record.status;

          if (dateStr.startsWith(month)) {
            if (record.status === "Present") p++;
            else if (record.status === "Absent") a++;
            else if (record.status === "Half-Day" || record.status === "Half Day") h++;
          }
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

  // Calculations
  const monthlySalary = selectedEmp ? Number(selectedEmp.salary) : 0;
  const daysInCurrentMonth = getDaysInMonth(selectedMonth);
  const dayRate = monthlySalary / daysInCurrentMonth;
  const effectiveDaysWorked = attendanceStats.present + (attendanceStats.halfDay * 0.5);
  const grossEarned = Math.round(dayRate * effectiveDaysWorked);
  const totalAdvance = paymentHistory.reduce((sum,p)=> sum + Number(p.amount), 0);
  const otEarning = (Number(overtimeHours)||0)*(dayRate/8);
  const totalEarnings = Math.round(grossEarned + otEarning + (Number(incentive)||0));
  const netPayable = totalEarnings - totalAdvance;
  console.log(allPayments,"allPayments");
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
        type: 'Advance'
      });
      if(res.data.success) {
        setAdvanceAmount('');
        alert("✅ Payment Recorded");
        viewLedger(selectedEmp, selectedMonth);
      }
    } catch { alert("Error saving payment."); }
  };

  if(loading) return <Loader />;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-zinc-800 dark:text-zinc-100 flex items-center gap-2 uppercase tracking-tighter">
              <ShieldCheck className="text-emerald-600" size={28} /> Professional Payroll Portal
            </h2>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Dhara Shakti Agro Management System</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Side Staff List */}
          {isBoss && (
            <div className="lg:col-span-3 bg-white dark:bg-zinc-900 rounded-[2rem] shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden h-fit">
              <div className="p-5 border-b dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30">
                 <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Staff Members</span>
              </div>
              <div className="max-h-[500px] overflow-y-auto p-3 space-y-2">
                {employees.map(emp => (
                  <div key={emp._id} onClick={() => viewLedger(emp)} className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${selectedEmp?.employeeId === emp.employeeId ? 'bg-emerald-600 text-white shadow-lg' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                    <div className="w-10 h-10 rounded-xl overflow-hidden"><img src={getPhotoURL(emp.photo)} className="w-full h-full object-cover" alt="p" /></div>
                    <div className="flex-1 truncate">
                      <p className="text-xs font-black uppercase truncate">{emp.name}</p>
                      <p className="text-[9px] font-bold opacity-60">ID: {maskID(emp.employeeId)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Detail View */}
          {selectedEmp ? (
            <div className="lg:col-span-9 space-y-6">
              {/* Profile Bar */}
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-[1.5rem] overflow-hidden ring-4 ring-emerald-500/10"><img src={getPhotoURL(selectedEmp.photo)} className="w-full h-full object-cover" alt="P" /></div>
                  <div>
                    <h3 className="text-xl font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-tighter">{selectedEmp.name}</h3>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{selectedEmp.role || selectedEmp.designation} | ID: {selectedEmp.employeeId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 p-2 rounded-2xl border dark:border-zinc-700">
                  <span className="text-[10px] font-black text-emerald-600 uppercase px-2">Month:</span>
                  <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-transparent text-xs font-black outline-none dark:text-white cursor-pointer">
                    {availableMonths.map(m => <option key={m} value={m}>{new Date(m + "-01").toLocaleString('default', { month: 'long', year: 'numeric' })}</option>)}
                  </select>
                </div>
              </div>

              {/* Attendance Stats */}
              <div className="flex flex-wrap gap-3">
                 <div className="flex-1 min-w-[100px] bg-white dark:bg-zinc-900 p-4 rounded-2xl border dark:border-zinc-800 text-center"><p className="text-[9px] font-black text-zinc-400 uppercase mb-1">Effective Work</p><p className="text-sm font-black">{effectiveDaysWorked} Days</p></div>
                 <div className="flex-1 min-w-[100px] bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100 text-center"><p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Present</p><p className="text-sm font-black text-emerald-600">{attendanceStats.present}</p></div>
                 <div className="flex-1 min-w-[100px] bg-amber-50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-100 text-center"><p className="text-[9px] font-black text-amber-600 uppercase mb-1">Half-Day</p><p className="text-sm font-black text-amber-600">{attendanceStats.halfDay}</p></div>
                 <div className="flex-1 min-w-[100px] bg-red-50 dark:bg-red-950/20 p-4 rounded-2xl border border-red-100 text-center"><p className="text-[9px] font-black text-red-600 uppercase mb-1">Absent</p><p className="text-sm font-black text-red-600">{attendanceStats.absent}</p></div>
              </div>

              {/* Toolbar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button onClick={() => setShowCalendar(true)} className="flex items-center justify-center gap-2 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-[10px] font-black uppercase"><History size={16}/> History</button>
                <button onClick={() => { setShowPassbook(!showPassbook); setShowPayslip(false); }} className={`flex items-center justify-center gap-2 p-3 rounded-2xl text-[10px] font-black uppercase ${showPassbook ? 'bg-zinc-800 text-white' : 'bg-emerald-50 text-emerald-600'}`}><BookOpen size={16}/> Passbook</button>
                <button onClick={() => setShowIDCard(!showIDCard)} className="flex items-center justify-center gap-2 p-3 bg-sky-50 text-sky-600 rounded-2xl text-[10px] font-black uppercase"><User size={16}/> ID Card</button>
                <button onClick={() => setShowPayslip(!showPayslip)} className="flex items-center justify-center gap-2 p-3 bg-zinc-900 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg"><FileText size={16}/> Payslip</button>
              </div>

              {showPassbook ? (
                <EmployeePassbook selectedEmp={selectedEmp} availableMonths={availableMonths} fullAttendanceData={fullAttendanceData} allPayments={allPayments} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Earnings */}
                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 space-y-4">
                    <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2"><TrendingUp size={16}/> Monthly Earnings</h4>
                    <div className="space-y-3 text-sm font-bold">
                      <div className="flex justify-between text-zinc-500"><span>Base Salary:</span> <span className="text-zinc-800 dark:text-zinc-200">₹{monthlySalary.toLocaleString()}</span></div>
                      <div className="flex justify-between border-b dark:border-zinc-800 pb-2 text-zinc-500"><span>Worked Earning:</span> <span className="text-emerald-600">₹{grossEarned.toLocaleString()}</span></div>
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="space-y-1"><label className="text-[9px] uppercase font-black text-zinc-400">Bonus</label><input type="number" value={incentive} onChange={(e)=>setIncentive(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 p-2 rounded-xl outline-none text-xs border dark:border-zinc-700" placeholder="₹" /></div>
                        <div className="space-y-1"><label className="text-[9px] uppercase font-black text-zinc-400">OT Hrs</label><input type="number" value={overtimeHours} onChange={(e)=>setOvertimeHours(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-800 p-2 rounded-xl outline-none text-xs border dark:border-zinc-700" placeholder="Hrs" /></div>
                      </div>
                    </div>
                  </div>

                  {/* Net Pay */}
                  <div className="bg-zinc-900 p-6 rounded-[2rem] flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-black text-red-400 uppercase tracking-widest flex items-center gap-2"><TrendingDown size={16}/> Deductions</h4>
                      <div className="flex justify-between text-sm font-bold mt-4">
                        <span className="text-zinc-400">Total Advance Paid:</span> 
                        <span className="text-red-400">- ₹{totalAdvance.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="mt-8 p-6 bg-white/5 rounded-3xl border border-white/10 text-center">
                       <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Net Take-Home</p>
                       <p className="text-4xl font-black text-white tracking-tighter">₹{netPayable.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {isAuthorized && (
                    <div className="md:col-span-2 bg-emerald-600 p-4 rounded-3xl flex flex-col md:flex-row items-center gap-4">
                       <div className="flex-1 relative w-full">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" size={18} />
                          <input type="number" value={advanceAmount} onChange={(e)=>setAdvanceAmount(e.target.value)} placeholder="Record Advance Payment Amount..." className="w-full pl-12 pr-4 py-3 bg-white rounded-2xl text-xs font-bold outline-none" />
                       </div>
                       <button onClick={handlePayment} className="w-full md:w-auto px-8 py-3 bg-zinc-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Record Payment</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="lg:col-span-9 flex flex-col items-center justify-center py-40 opacity-20">
               <ShieldCheck size={80} className="mb-4 text-zinc-400" />
               <p className="uppercase font-black tracking-[0.3em] text-zinc-500">Select Staff to manage ledger</p>
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