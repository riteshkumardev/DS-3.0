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
  
  // 💡 Local Date formatting to ensure perfect alignment with system expectations
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getTileClassName = ({ date, view }) => {
    if (view !== "month") return;

    const currentTileDateStr = formatDate(date); // Format: "2026-05-18"
    let status = null;

    // 🚀 FIXED STRING MATCH PIPELINE: Explicit object key arrays mapping parsing fallback loops
    Object.keys(fullAttendanceData || {}).forEach((key) => {
      // Direct string evaluation matching raw format keys
      if (key.includes(currentTileDateStr)) {
        status = fullAttendanceData[key];
      } else {
        // Strict ISO translation fallback matching full UTC response sequences
        try {
          const parsedKeyStr = new Date(key).toISOString().split('T')[0];
          if (parsedKeyStr === currentTileDateStr) {
            status = fullAttendanceData[key];
          }
        } catch (e) {
          // Fallback bypass handler
        }
      }
    });

    const finalStatus = status ? String(status).toUpperCase().trim() : "";

    // Dynamic color rendering mapping structures matching system design enums
    if (finalStatus === "PRESENT") return "present-day";
    if (finalStatus === "HALF_DAY" || finalStatus === "HALF-DAY") return "half-day";
    if (finalStatus === "ABSENT") return "absent-day";
    
    // Highlight Sundays safely without overriding system logs
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

        /* 🚀 COMPACT HEIGHT FIX: Tile cells dimensions reduced safely to minimize workspace clutter */
        .attendance-calendar .react-calendar__tile {
          height: 38px !important; /* Scaled down from 48px for compact height design */
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          margin: 1.5px 0;
          font-size: 0.75rem;
          font-weight: 800;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Compact spacing rules configuration */
        .attendance-calendar .react-calendar__month-view__weekdays__weekday {
          padding: 0.25rem !important;
          font-size: 0.6rem;
          font-weight: 900;
          text-transform: uppercase;
          color: #a1a1aa;
          text-decoration: none !important;
        }

        /* Status Rendering Colors Panels (Highly Vibrant UI Controls) */
        .present-day { background: #10b981 !important; color: white !important; font-weight: 900; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.25); }
        .half-day { background: #f59e0b !important; color: white !important; font-weight: 900; box-shadow: 0 2px 4px rgba(245, 158, 11, 0.25); }
        .absent-day { background: #ef4444 !important; color: white !important; font-weight: 900; box-shadow: 0 2px 4px rgba(239, 68, 68, 0.25); }
        .sunday-tile { color: #ef4444; font-weight: bold; }

        /* Navigation Buttons Framework adjustments */
        .react-calendar__navigation {
          margin-bottom: 0.5rem !important;
          height: 32px !important;
        }
        .react-calendar__navigation button {
          font-weight: 900;
          text-transform: uppercase;
          font-size: 0.7rem;
          color: #10b981;
          min-width: 32px !important;
          background: transparent !important;
        }

        .dark .react-calendar__tile:hover { background: #27272a !important; }
        .react-calendar__tile--now { border: 1.5px dashed #10b981 !important; background: transparent !important; color: inherit; }
        .dark .react-calendar__month-view__days__day { color: #e4e4e7; }
        
        /* Neighboring months parameters validation */
        .react-calendar__month-view__days__day--neighboringMonth { opacity: 0.12; pointer-events: none; }
      `}</style>

      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
        <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200 overflow-hidden">
          
          {/* Header Dashboard section */}
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/30">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20">
                <CalendarIcon size={16} />
              </div>
              <div>
                <h3 className="font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-tighter text-xs leading-none mb-1">
                  Attendance Grid
                </h3>
                <p className="text-[8px] text-zinc-400 font-black uppercase tracking-widest leading-none">History Sync Module</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 bg-zinc-100 dark:bg-zinc-800 hover:text-red-500 text-zinc-500 rounded-full transition-all active:scale-90"
            >
              <X size={16}/>
            </button>
          </div>

          {/* Calendar Rendering Canvas Body */}
          <div className="p-4">
            <Calendar
              activeStartDate={new Date(selectedMonth + "-01")}
              onActiveStartDateChange={({ activeStartDate }) => {
                if (activeStartDate) {
                  const year = activeStartDate.getFullYear();
                  const month = String(activeStartDate.getMonth() + 1).padStart(2, "0");
                  setSelectedMonth(`${year}-${month}`);
                }
              }}
              tileClassName={getTileClassName}
              className="attendance-calendar"
              next2Label={null}
              prev2Label={null}
            />

            {/* Compact Legends Markers indicators panels */}
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <div className="flex flex-col items-center gap-1 bg-zinc-50 dark:bg-zinc-800/10 py-1 rounded-lg border dark:border-zinc-800/30">
                <div className="w-4 h-1 bg-emerald-500 rounded-full shadow-sm shadow-emerald-500/20"></div>
                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wide">Present</span>
              </div>
              <div className="flex flex-col items-center gap-1 bg-zinc-50 dark:bg-zinc-800/10 py-1 rounded-lg border dark:border-zinc-800/30">
                <div className="w-4 h-1 bg-amber-500 rounded-full shadow-sm shadow-amber-500/20"></div>
                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wide">Half Day</span>
              </div>
              <div className="flex flex-col items-center gap-1 bg-zinc-50 dark:bg-zinc-800/10 py-1 rounded-lg border dark:border-zinc-800/30">
                <div className="w-4 h-1 bg-red-500 rounded-full shadow-sm shadow-red-500/20"></div>
                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wide">Absent</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </>
  );
}