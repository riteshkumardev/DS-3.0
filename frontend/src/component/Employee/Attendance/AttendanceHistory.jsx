import React from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { X, Calendar as CalendarIcon } from "lucide-react";

export default function AttendanceHistory({
  show,
  onClose,
  selectedMonth,
  setSelectedMonth,
  fullAttendanceData = {}
}) {
  
  // 💡 Local Date formatting to avoid Timezone shifts
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getTileClassName = ({ date, view }) => {
    if (view !== "month") return;

    const formatted = formatDate(date);
    const status = fullAttendanceData[formatted];

    // Status mapping with backend Enums
    if (status === "PRESENT") return "present-day";
    if (status === "HALF_DAY") return "half-day";
    if (status === "ABSENT") return "absent-day";
    
    // Highlight Sundays
    if (date.getDay() === 0) return "sunday-tile";

    return "";
  };

  if (!show) return null;

  return (
    <>
      <style>{`
        .attendance-calendar {
          width: 100% !important;
          border: none !important;
          background: transparent !important;
          font-family: inherit !important;
        }

        /* Tile Styling */
        .attendance-calendar .react-calendar__tile {
          height: 50px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          margin: 2px 0;
          font-size: 0.85rem;
          transition: all 0.2s ease;
        }

        .attendance-calendar .react-calendar__month-view__weekdays__weekday {
          padding: 0.5rem;
          font-size: 0.65rem;
          font-weight: 900;
          text-transform: uppercase;
          color: #a1a1aa;
          text-decoration: none !important;
        }

        /* Status Colors */
        .present-day { background: #10b981 !important; color: white !important; font-weight: 900; }
        .half-day { background: #f59e0b !important; color: white !important; font-weight: 900; }
        .absent-day { background: #ef4444 !important; color: white !important; font-weight: 900; }
        .sunday-tile { color: #ef4444; font-weight: bold; }

        /* Navigation */
        .react-calendar__navigation button {
          font-weight: 900;
          text-transform: uppercase;
          font-size: 0.75rem;
          color: #10b981;
        }

        .dark .react-calendar__tile:hover { background: #27272a !important; }
        .react-calendar__tile--now { border: 2px solid #10b981 !important; background: transparent !important; }
        
        /* Neighboring months */
        .react-calendar__month-view__days__day--neighboringMonth { opacity: 0.2; }
      `}</style>

      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
        <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="p-6 border-b dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50 rounded-t-[2.5rem]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                <CalendarIcon size={18} />
              </div>
              <div>
                <h3 className="font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-tighter text-sm">
                  Staff Attendance
                </h3>
                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Monthly History Tracker</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 bg-zinc-200 dark:bg-zinc-800 hover:text-red-500 rounded-full transition-all"
            >
              <X size={18}/>
            </button>
          </div>

          {/* Calendar Body */}
          <div className="p-6">
            <Calendar
              activeStartDate={new Date(selectedMonth + "-01")}
              onActiveStartDateChange={({ activeStartDate }) => {
                const year = activeStartDate.getFullYear();
                const month = String(activeStartDate.getMonth() + 1).padStart(2, "0");
                setSelectedMonth(`${year}-${month}`);
              }}
              tileClassName={getTileClassName}
              className="attendance-calendar"
              next2Label={null}
              prev2Label={null}
            />

            {/* Legend / Key */}
            <div className="mt-8 grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center gap-1">
                <div className="w-full h-1.5 bg-emerald-500 rounded-full"></div>
                <span className="text-[9px] font-black text-zinc-400 uppercase">Present</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-full h-1.5 bg-amber-500 rounded-full"></div>
                <span className="text-[9px] font-black text-zinc-400 uppercase">Half Day</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-full h-1.5 bg-red-500 rounded-full"></div>
                <span className="text-[9px] font-black text-zinc-400 uppercase">Absent</span>
              </div>
            </div>
          </div>
          
          {/* Footer Info */}
          <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/30 border-t dark:border-zinc-800 rounded-b-[2.5rem] flex justify-center">
            <p className="text-[10px] text-zinc-400 font-bold uppercase italic">
              * Click arrows to switch months
            </p>
          </div>
        </div>
      </div>
    </>
  );
}