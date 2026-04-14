import API from './apiConfig';

/**
 * Dharashakti Agro Products - Attendance API Service
 */

// 1. Mark or Update Daily Attendance (Bulk)
// data format: { attendanceData: [...], date: '2026-04-14', performedBy: 'ADMIN_ID' }
export const markAttendance = (attendanceData) => {
    return API.post('/attendance/bulk', attendanceData);
};

// 2. Get All Attendance Records for a Specific Date
// Example usage: getAttendanceByDate('2026-04-14')
export const getAttendanceByDate = (date) => {
    return API.get(`/attendance/daily?date=${date}`);
};

// 3. Get Monthly Report for a Specific Staff Member
// Example usage: getStaffMonthlyReport('STAFF_ID', '04', '2026')
export const getStaffMonthlyReport = (staffId, month, year) => {
    return API.get(`/attendance/report/${staffId}?month=${month}&year=${year}`);
};

// 4. (Extra) Get Daily Status Summary
// Agar dashboard par dikhana ho ki aaj kitne Present/Absent hain
export const getDailySummary = (date) => {
    return API.get(`/attendance/summary?date=${date}`);
};