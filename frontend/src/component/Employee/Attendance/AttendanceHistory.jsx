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
  console.log(fullAttendanceData,"fullAttendanceData");
  
  
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

    // 🚀 FIXED KEY EVALUATION LOGIC FOR BOTH UTC STRINGS AND ISO KEYSTAMPS
    Object.keys(fullAttendanceData || {}).forEach((key) => {
      if (key.includes(currentTileDateStr)) {
        status = fullAttendanceData[key];
      } else {
        try {
          // Fallback parsing for full string keys like "Mon May 18 2026..."
          const parsedKeyStr = new Date(key).toISOString().split('T')[0];
          if (parsedKeyStr === currentTileDateStr) {
            status = fullAttendanceData[key];
          }
        } catch (e) {
          // Bypass format mismatch errors smoothly
        }
      }
    });

    const finalStatus = status ? String(status).toUpperCase().trim() : "";

    // Dynamic color rendering mapping structures matching system design enums
    if (finalStatus === "PRESENT") return "present-day-tile";
    if (finalStatus === "HALF_DAY" || finalStatus === "HALF-DAY") return "half-day-tile";
    if (finalStatus === "ABSENT") return "absent-day-tile";
    
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

        /* 🚀 CALENDAR COMPACT HEIGHT & PADDING OPTIMIZATION */
        .attendance-calendar .react-calendar__viewContainer {
          padding: 0 !important;
          margin: 0 !important;
        }
        
        .attendance-calendar .react-calendar__month-view__days {
          row-gap: 2px !important; /* Row spacing minimized safely */
        }

        /* 🚀 COMPACT TILE CONFIGURATION: Grid cell heights heavily minimized to shrink container */
        .attendance-calendar .react-calendar__tile {
          height: 32px !important; /* Reduced dramatically from 38px/48px for tight packing */
          padding: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border-radius: 8px !important;
          font-size: 0.75rem !important;
          font-weight: 800 !important;
          color: #27272a;
          transition: all 0.15s ease-in-out;
        }

        /* Spacing rules for active week labels text fields */
        .attendance-calendar .react-calendar__month-view__weekdays {
          padding: 0 !important;
          margin-bottom: 4px !important;
        }

        .attendance-calendar .react-calendar__month-view__weekdays__weekday {
          padding: 2px !important;
          font-size: 0.6rem;
          font-weight: 900;
          text-transform: uppercase;
          color: #a1a1aa;
          text-decoration: none !important;
        }

        /* 🚀 STRICT CSS OVERRIDE Panels: Forces text & button backgrounds to render bright colors */
        .present-day-tile { background: #10b981 !important; color: white !important; font-weight: 900 !important; border-radius: 8px !important; }
        .present-day-tile abbr { color: white !important; font-weight: 900 !important; }

        .half-day-tile { background: #f59e0b !important; color: white !important; font-weight: 900 !important; border-radius: 8px !important; }
        .half-day-tile abbr { color: white !important; font-weight: 900 !important; }

        .absent-day-tile { background: #ef4444 !important; color: white !important; font-weight: 900 !important; border-radius: 8px !important; }
        .absent-day-tile abbr { color: white !important; font-weight: 900 !important; }

        .sunday-tile { color: #ef4444 !important; font-weight: bold; }
        .sunday-tile abbr { color: #ef4444 !important; }

        /* Compact Navigation Bar Adjustments */
        .react-calendar__navigation {
          margin-bottom: 0.25rem !important;
          height: 28px !important;
        }
        .react-calendar__navigation button {
          font-weight: 900;
          text-transform: uppercase;
          font-size: 0.7rem;
          color: #10b981;
          min-width: 28px !important;
          height: 28px !important;
          background: transparent !important;
        }

        .dark .react-calendar__tile { color: #e4e4e7; }
        .dark .react-calendar__tile:hover { background: #27272a !important; color: white !important; }
        
        /* Today item focus dashed rings styles */
        .react-calendar__tile--now { border: 1.5px dashed #10b981 !important; background: transparent !important; }
        
        /* Disable non-active month visibility parameters */
        .react-calendar__month-view__days__day--neighboringMonth { opacity: 0.12; pointer-events: none; }
      `}</style>

      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
        {/* max-w-xs to force ultra compact width along with scaled down elements */}
        <div className="bg-white dark:bg-zinc-900 w-full max-w-xs rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200 overflow-hidden">
          
          {/* Header Dashboard section */}
          <div className="p-3.5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/30">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20">
                <CalendarIcon size={14} />
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
              <X size={14}/>
            </button>
          </div>

          {/* Calendar Rendering Canvas Body */}
          <div className="p-3.5">
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

            {/* Compact Legends Indicators Panels */}
            <div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-zinc-100 dark:border-zinc-800 pt-3">
              <div className="flex flex-col items-center gap-1 bg-zinc-50 dark:bg-zinc-800/10 py-1 rounded-lg border dark:border-zinc-800/30">
                <div className="w-4 h-1 bg-emerald-500 rounded-full shadow-sm"></div>
                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wide">Present</span>
              </div>
              <div className="flex flex-col items-center gap-1 bg-zinc-50 dark:bg-zinc-800/10 py-1 rounded-lg border dark:border-zinc-800/30">
                <div className="w-4 h-1 bg-amber-500 rounded-full shadow-sm"></div>
                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wide">Half Day</span>
              </div>
              <div className="flex flex-col items-center gap-1 bg-zinc-50 dark:bg-zinc-800/10 py-1 rounded-lg border dark:border-zinc-800/30">
                <div className="w-4 h-1 bg-red-500 rounded-full shadow-sm"></div>
                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-wide">Absent</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </>
  );
}