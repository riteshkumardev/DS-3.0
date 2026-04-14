import API from './apiConfig';

// Transactions (Payment In/Out)
export const postTransaction = (data) => API.post('/transactions', data);
export const getPartyLedger = (partyId, startDate, endDate) => 
    API.get(`/transactions?partyId=${partyId}&startDate=${startDate}&endDate=${endDate}`);

// Reports
export const getDailyCashbook = (date) => API.get(`/reports/cashbook?date=${date}`);