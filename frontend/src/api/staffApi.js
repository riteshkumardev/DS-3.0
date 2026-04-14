import API from './apiConfig';

// Staff Master
export const getAllStaff = () => API.get('/staff');
export const addStaff = (data) => API.post('/staff', data);
export const updateStaff = (id, data) => API.put(`/staff/${id}`, data);

// Attendance Logic
export const markAttendance = (attendanceData) => API.post('/attendance', attendanceData);
export const getAttendanceByDate = (date) => API.get(`/attendance?date=${date}`);
export const getStaffMonthlyReport = (staffId, month, year) => 
    API.get(`/attendance/report/${staffId}?month=${month}&year=${year}`);