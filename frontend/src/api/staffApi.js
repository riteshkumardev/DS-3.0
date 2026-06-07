import API from './apiConfig';

/**
 * ========================================================
 * 🔹 1. STAFF MASTER SERVICES (Administrative Control)
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
 * 🔹 4. DEDICATED PROFILE MANAGEMENT SERVICES (Isolated Sync)
 * ========================================================
 * 🎯 Handshake Matrix: Matches the /api/profile mounting base inside server.js
 */

// Logged-in user ki verified current profile fetch karne ke liye
export const getSelfProfileData = () => 
    API.get('/profile/me');

// User ki personal details (Name/Phone) update karne ke liye
export const updateProfileDetails = (profileData) => 
    API.post('/profile/update', profileData);

// User ka password/access PIN change karne ke liye
export const changeProfilePassword = (passwordData) => 
    API.post('/profile/change-password', passwordData);

// Cloudinary image multipart data stream handler
// CRITICAL: Ensure frontend UI appends file payload using formData.append("photo", file);
export const uploadProfileImage = (formData) => 
    API.post('/profile/upload', formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });

// Session cleanly off karne ke liye (Optional frontend trigger)
export const logoutProfileSession = () => 
    API.post('/profile/logout');