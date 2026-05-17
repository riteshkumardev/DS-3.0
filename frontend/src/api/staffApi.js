import API from './apiConfig';

/**
 * ========================================================
 * 🔹 1. STAFF MASTER SERVICES
 * ========================================================
 */

// Fetch all staff members (Admin/Accountant/Manager view)
export const getAllStaff = () => API.get('/staff');

// Create a new employee with flat JSON data (Handles payload wrapping on backend)
export const addStaff = (data) => API.post('/staff', data);

// Update existing staff details using their unique Employee ID
export const updateStaff = (id, data) => API.put(`/staff/${id}`, data);


/**
 * ========================================================
 * 🔹 2. ATTENDANCE SYSTEM SERVICES
 * ========================================================
 */

// Mark or update daily bulk attendance for the workforce
export const markAttendance = (attendanceData) => API.post('/attendance/bulk', attendanceData);

// Fetch daily attendance records for a specific date (Format: YYYY-MM-DD)
export const getAttendanceByDate = (date) => API.get(`/attendance/daily?date=${date}`);

// Fetch a detailed monthly report for a specific staff member using their ObjectId
export const getStaffMonthlyReport = (staffId, month, year) => 
    API.get(`/attendance/report/${staffId}?month=${month}&year=${year}`);


/**
 * ========================================================
 * 🔹 3. SALARY PAYMENTS & LEDGER SERVICES (Newly Added Fix)
 * ========================================================
 */

// Fetch all advance and salary payments for a specific employee using their EmployeeID (e.g., DS-2026-001)
export const getSalaryPaymentsByEmployee = (employeeId) => 
    API.get(`/salary-payments/${employeeId}`);

// Record a new advance payment or voucher transaction for an employee
export const recordSalaryPayment = (paymentData) => 
    API.post('/salary-payments', paymentData);