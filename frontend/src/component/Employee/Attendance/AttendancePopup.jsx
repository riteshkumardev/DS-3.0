import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar'; 
import 'react-calendar/dist/Calendar.css';
import { X, Calendar as CalendarIcon, Info } from 'lucide-react';

// Centralized API Service
import { getStaffMonthlyReport } from '../../../api/attendanceApi'; 
import Loader from '../../Core_Component/Loader/Loader';

const AttendancePopup = ({ staffId, employeeId, onClose }) => {
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        // Current Year aur Month nikalna report fetch karne ke liye
        const year = selectedMonth.getFullYear();
        const month = String(selectedMonth.getMonth() + 1).padStart(2, "0");

        // staffId (ObjectId) ka use karein backend call ke liye
        const res = await getStaffMonthlyReport(staffId, month, year);
        
        if (res.data.success) {
          const mappedData = {};
          res.data.data.forEach(record => {
            // Backend date format "YYYY-MM-DD" ko map karein
            mappedData[record.date] = record.status;
          });
          setAttendanceData(mappedData);
        }
      } catch (err) {
        console.error("Error fetching individual attendance:", err);
      } finally {
        setLoading(false);
      }
    };

    if (staffId) fetchHistory();
  }, [staffId, selectedMonth]);

  // Calendar Tiles Logic
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
      const status = attendanceData[dateStr];

      if (status === 'PRESENT') return 'present-tile';
      if (status === 'ABSENT') return 'absent-tile';
      if (status === 'HALF_DAY') return 'half-day-tile';
      if (date.getDay() === 0) return 'sunday-tile';
    }
    return '';
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-200">
      
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 bg-emerald-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <CalendarIcon size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tighter">Attendance History</h3>
              <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">{employeeId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Calendar Body */}
        <div className="p-6">
          {loading ? (
            <div className="h-[300px] flex flex-col items-center justify-center gap-4">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] font-black text-zinc-400 uppercase">Fetching Logs...</p>
            </div>
          ) : (
            <Calendar 
              onActiveStartDateChange={({ activeStartDate }) => setSelectedMonth(activeStartDate)}
              tileClassName={tileClassName}
              className="dharashakti-calendar"
              next2Label={null}
              prev2Label={null}
            />
          )}

          {/* Legend Section */}
          <div className="mt-8 grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center p-2 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border dark:border-zinc-700">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mb-1"></div>
              <span className="text-[9px] font-black text-zinc-500 uppercase">Present</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border dark:border-zinc-700">
              <div className="w-2 h-2 bg-amber-500 rounded-full mb-1"></div>
              <span className="text-[9px] font-black text-zinc-500 uppercase">Half Day</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border dark:border-zinc-700">
              <div className="w-2 h-2 bg-red-500 rounded-full mb-1"></div>
              <span className="text-[9px] font-black text-zinc-500 uppercase">Absent</span>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-t dark:border-zinc-800 flex items-center gap-3">
          <Info size={14} className="text-zinc-400" />
          <p className="text-[9px] text-zinc-400 font-bold uppercase leading-tight">
            Color indicates staff status for that specific date. Backdated entries may take a moment to sync.
          </p>
        </div>
      </div>

      <style>{`
        .dharashakti-calendar {
          width: 100% !important;
          border: none !important;
          background: transparent !important;
          font-family: inherit !important;
        }
        .react-calendar__tile {
          padding: 12px 8px !important;
          border-radius: 12px !important;
          font-size: 0.8rem !important;
          font-weight: 700 !important;
        }
        .present-tile { background: #10b981 !important; color: white !important; }
        .absent-tile { background: #ef4444 !important; color: white !important; }
        .half-day-tile { background: #f59e0b !important; color: white !important; }
        .sunday-tile { color: #ef4444 !important; }
        
        .react-calendar__navigation button {
          color: #10b981 !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
        }
        .react-calendar__month-view__weekdays__weekday {
          font-size: 0.6rem !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
          color: #a1a1aa !important;
          text-decoration: none !important;
        }
        .react-calendar__tile--now {
          border: 2px solid #10b981 !important;
          background: transparent !important;
        }
      `}</style>
    </div>
  );
};

export default AttendancePopup;