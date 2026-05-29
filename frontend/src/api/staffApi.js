import API from './apiConfig';

/**
 * ========================================================
 * 🔹 1. STAFF MASTER SERVICES
 * ========================================================
 */
export const getAllStaff = () => API.get('/staff');
export const addStaff = (data) => API.post('/staff', data);
export const updateStaff = (id, data) => API.put(`/staff/${id}`, data);

/**
 * ========================================================
 * 🔹 2. ATTENDANCE SYSTEM SERVICES
 * ========================================================
 */
export const markAttendance = (attendanceData) => API.post('/attendance/bulk', attendanceData);
export const getAttendanceByDate = (date) => API.get(`/attendance/daily?date=${date}`);
export const getStaffMonthlyReport = (staffId, month, year) => 
    API.get(`/attendance/report/${staffId}?month=${month}&year=${year}`);

/**
 * ========================================================
 * 🔹 3. SALARY PAYMENTS & LEDGER SERVICES
 * ========================================================
 */
export const getSalaryPaymentsByEmployee = (employeeId) => 
    API.get(`/salary-payments/${employeeId}`);
export const recordSalaryPayment = (paymentData) => 
    API.post('/salary-payments', paymentData);

/**
 * ========================================================
 * 🔹 4. PROFILE MANAGEMENT SERVICES (Newly Added Sync)
 * ========================================================
 */

// User ki personal details update karne ke liye
export const updateProfileDetails = (profileData) => 
    API.post('/staff/profile-update', profileData);

// User ka password/access PIN change karne ke liye
export const changeProfilePassword = (passwordData) => 
    API.post('/staff/change-password', passwordData);

// Cloudinary standard upload logic (Multipart payload automated by API config)
export const uploadProfileImage = (formData) => 
    API.post('/staff/profile-upload', formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });