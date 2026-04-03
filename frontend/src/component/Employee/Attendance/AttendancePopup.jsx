import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar'; 
import 'react-calendar/dist/Calendar.css';
import axios from 'axios'; // Firebase ki jagah Axios use karenge
import './AttendancePopup.css';

const AttendancePopup = ({ employeeId, onClose }) => {
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);

  // Live Backend URL dynamically handle karne ke liye
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchEmployeeAttendance = async () => {
      try {
        setLoading(true);
        // MongoDB backend se is specific employee ki puri history fetch karein
        const res = await axios.get(`${API_URL}/api/attendance/employee/${employeeId}`);
        
        if (res.data.success) {
          const filteredData = {};
          // MongoDB data format ko Calendar format mein convert karein
          // Expected data: [{ date: "2023-12-01", status: "Present" }, ...]
          res.data.data.forEach(record => {
             // Date format: "2023-12-01T00:00:00.000Z" se sirf date part nikalna
             const dateStr = record.date.split('T')[0];
             filteredData[dateStr] = record.status;
          });
          setAttendanceData(filteredData);
        }
      } catch (err) {
        console.error("Error fetching individual attendance:", err);
      } finally {
        setLoading(false);
      }
    };

    if (employeeId) {
      fetchEmployeeAttendance();
    }
  }, [employeeId, API_URL]);

  // Calendar ke tiles ko color karne ka function
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      // Locale handling ke liye date string sahi format mein chahiye
      const dateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
      
      const status = attendanceData[dateStr];
      if (status === 'Present') return 'bg-success';   // Green (CSS mein handle karein)
      if (status === 'Absent') return 'bg-danger';    // Red
      if (status === 'Half-Day') return 'bg-warning'; // Yellow
    }
  };

  return (
    <div className="attendance-modal-overlay">
      <div className="attendance-modal-content">
        <div className="modal-header">
          <h3>📅 History: {employeeId}</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        
        <div className="calendar-container">
          {loading ? (
            <p>Loading records...</p>
          ) : (
            <Calendar 
              tileClassName={tileClassName}
            />
          )}
        </div>

        <div className="legend">
          <div className="legend-item"><span className="dot green"></span> Present</div>
          <div className="legend-item"><span className="dot red"></span> Absent</div>
          <div className="legend-item"><span className="dot yellow"></span> Half-Day</div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePopup;