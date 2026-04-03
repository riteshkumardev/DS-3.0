import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { X } from "lucide-react";

export default function AttendanceHistory({


    show,
  onClose,
  selectedMonth,
  setSelectedMonth,
  fullAttendanceData = {}

}) {

  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
  };

  const getTileClassName = ({ date, view }) => {
    if (view !== "month") return;

    const formatted = formatDate(date);

    if (!formatted.startsWith(selectedMonth)) return "opacity-30";

    const status = fullAttendanceData[formatted];

    if (status === "Present") {
      return "present-day";
    }

    if (status === "Half-Day") {
      return "halfday";
    }

    if (status === "Absent") {
      return "absent-day";
    }

    return "";
  };

  if (!show) return null;

  return (
    <>
      {/* Component CSS */}
      <style>{`

      .attendance-calendar {
        width: 100%;
        border: none;
        background: transparent;
        font-family: inherit;
      }

      .attendance-calendar button {
        border-radius: 10px;
        font-weight: 600;
      }

      /* Navigation */
      .attendance-calendar .react-calendar__navigation button {
        background: transparent;
        color: inherit;
        font-weight: 700;
      }

      .attendance-calendar .react-calendar__navigation button:hover {
        background: rgba(255,255,255,0.08);
      }

      /* Weekdays */
      .attendance-calendar .react-calendar__month-view__weekdays {
        text-transform: uppercase;
        font-size: 10px;
        font-weight: 700;
        color: #71717a;
      }

      .dark .attendance-calendar .react-calendar__month-view__weekdays {
        color: #a1a1aa;
      }

      /* Day Tiles */
      .attendance-calendar .react-calendar__tile {
        padding: 10px 6px;
        border-radius: 10px;
        transition: all 0.2s;
      }

      .attendance-calendar .react-calendar__tile:hover {
        background: #f4f4f5;
      }

      .dark .attendance-calendar .react-calendar__tile:hover {
        background: #27272a;
      }

      /* Today */
      .attendance-calendar .react-calendar__tile--now {
        background: #dbeafe;
        color: #1e3a8a;
      }

      .dark .attendance-calendar .react-calendar__tile--now {
        background: rgba(30,58,138,0.35);
        color: #93c5fd;
      }

      /* Neighbor month */
      .attendance-calendar .react-calendar__month-view__days__day--neighboringMonth {
        opacity: 0.25;
      }

      /* Attendance Status Colors */

      .present-day {
        background: #d1fae5 !important;
        color: #047857 !important;
        font-weight: 700;
      }

      .dark .present-day {
        background: rgba(16,185,129,0.25) !important;
        color: #34d399 !important;
      }

      .halfday {
        background: #fef3c7 !important;
        color: #b45309 !important;
        font-weight: 700;
      }

      .dark .halfday {
        background: rgba(245,158,11,0.25) !important;
        color: #fbbf24 !important;
      }

      .absent-day {
        background: #fee2e2 !important;
        color: #b91c1c !important;
        font-weight: 700;
      }

      .dark .absent-day {
        background: rgba(239,68,68,0.25) !important;
        color: #f87171 !important;
      }

      `}</style>

      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">

        <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-zinc-800">

          {/* Header */}
          <div className="p-6 border-b dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50">

            <h3 className="font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-widest text-xs">
              Attendance History
            </h3>

            <button
              onClick={onClose}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/40 hover:text-red-500 rounded-xl transition-all"
            >
              <X size={20}/>
            </button>

          </div>

          {/* Calendar */}
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
/>

            {/* Legend */}
            <div className="mt-6 grid grid-cols-3 gap-2">

              <div className="p-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold rounded-lg text-center uppercase">
                Present
              </div>

              <div className="p-2 bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-bold rounded-lg text-center uppercase">
                Half Day
              </div>

              <div className="p-2 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-bold rounded-lg text-center uppercase">
                Absent
              </div>

            </div>

          </div>

        </div>

      </div>
    </>
  );
}