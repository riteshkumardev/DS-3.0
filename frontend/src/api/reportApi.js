import API from './apiConfig';

/**
 * Dharashakti Profit & Loss Report
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 */
export const getProfitLossReport = (startDate, endDate) => 
    API.get(`/reports/profit-loss?startDate=${startDate}&endDate=${endDate}`);

// Business Overview Stats (Dashboard ke liye)
export const getDashboardStats = () => API.get('/reports/dashboard-stats');

// GSTR-1 (Sales Report for Tax)
export const getGSTR1Report = (month, year) => 
    API.get(`/reports/gstr1?month=${month}&year=${year}`);

// Party-wise Outstanding (Kis se kitna paisa lena baki hai)
export const getOutstandingReport = () => API.get('/reports/outstanding');