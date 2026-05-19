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

    const currentTileDateStr = formatDate(date); // Output: "2026-05-18"

    let status = null;

    // 🚀 CRITICAL FIX: Loop through backend data keys to safely catch full UTC string representations
    // Handles matches like "Mon May 18 2026..." or raw strings "2026-05-18" cleanly
    Object.keys(fullAttendanceData || {}).forEach((key) => {
      if (key.includes(currentTileDateStr)) {
        status = fullAttendanceData[key];
      } else {
        // Fallback parser loop if key is a native Date string format object instantiation
        try {
          const parsedKeyStr = new Date(key).toISOString().split('T')[0];
          if (parsedKeyStr === currentTileDateStr) {
            status = fullAttendanceData[key];
          }
        } catch (e) {
          // Silent catch to handle malformed legacy string formats
        }
      }
    });

    // Explicit upper casing standardization check block
    const finalStatus = status ? String(status).toUpperCase().trim() : "";

    // Status css class assignments dynamically matching active system configurations
    if (finalStatus === "PRESENT") return "present-day";
    if (finalStatus === "HALF_DAY" || finalStatus === "HALF-DAY") return "half-day";
    if (finalStatus === "ABSENT") return "absent-day";
    
    // Highlight Sundays safely without overriding active statuses
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

        /* Tile Styling Configuration Framework */
        .attendance-calendar .react-calendar__tile {
          height: 48px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          margin: 3px 0;
          font-size: 0.85rem;
          font-weight: 700;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .attendance-calendar .react-calendar__month-view__weekdays__weekday {
          padding: 0.5rem;
          font-size: 0.65rem;
          font-weight: 900;
          text-transform: uppercase;
          color: #a1a1aa;
          text-decoration: none !important;
        }

        /* Status Rendering Colors Panels */
        .present-day { background: #10b981 !important; color: white !important; font-weight: 900; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2); }
        .half-day { background: #f59e0b !important; color: white !important; font-weight: 900; box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.2); }
        .absent-day { background: #ef4444 !important; color: white !important; font-weight: 900; box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.2); }
        .sunday-tile { color: #ef4444; font-weight: bold; }

        /* Navigation Mechanics UI Wrapper */
        .react-calendar__navigation button {
          font-weight: 900;
          text-transform: uppercase;
          font-size: 0.75rem;
          color: #10b981;
        }

        .dark .react-calendar__tile:hover { background: #27272a !important; }
        .react-calendar__tile--now { border: 2px dashed #10b981 !important; background: transparent !important; color: inherit; }
        .dark .react-calendar__month-view__days__day { color: #e4e4e7; }
        
        /* Neighboring months safety layout overrides */
        .react-calendar__month-view__days__day--neighboringMonth { opacity: 0.15; pointer-events: none; }
      `}</style>

      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
        <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/30 rounded-t-[2.5rem]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20">
                <CalendarIcon size={18} />
              </div>
              <div>
                <h3 className="font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-tighter text-sm">
                  Staff Attendance Calendar
                </h3>
                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Monthly History Tracker</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:text-red-500 text-zinc-500 rounded-full transition-all active:scale-90"
            >
              <X size={18}/>
            </button>
          </div>

          {/* Calendar Body */}
          <div className="p-6">
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

            {/* Legend Indicators Panels */}
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-6">
              <div className="flex flex-col items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800/20 py-2 rounded-xl border dark:border-zinc-800/40">
                <div className="w-6 h-1.5 bg-emerald-500 rounded-full shadow-sm shadow-emerald-500/30"></div>
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wide">Present</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800/20 py-2 rounded-xl border dark:border-zinc-800/40">
                <div className="w-6 h-1.5 bg-amber-500 rounded-full shadow-sm shadow-amber-500/30"></div>
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wide">Half Day</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800/20 py-2 rounded-xl border dark:border-zinc-800/40">
                <div className="w-6 h-1.5 bg-red-500 rounded-full shadow-sm shadow-red-500/30"></div>
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wide">Absent</span>
              </div>
            </div>
          </div>
          
          {/* Footer Navigation Hints */}
          <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/10 border-t border-zinc-100 dark:border-zinc-800 rounded-b-[2.5rem] flex justify-center">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider italic">
              * Click control arrows to browse different months
            </p>
          </div>
        </div>
      </div>
    </>
  );
}