import API from './apiConfig';

/**
 * Ledger & Transaction API - Dharashakti Agro Products
 * Base URL: /api/ledger (as per your backend routes)
 */

// 1. Naya Transaction (Payment In / Payment Out) add karne ke liye
export const postTransaction = (data) => API.post('/ledger/transactions', data);

// 2. Sabhi Transactions mangwane ke liye (With Filters)
export const getAllTransactions = (filters = {}) => {
    const { startDate, endDate, type } = filters;
    // Query params build kar rahe hain taaki backend filter kar sake
    return API.get('/ledger/transactions', {
        params: { startDate, endDate, type }
    });
};

// 3. Party-wise Detailed Ledger Statement (Credit/Debit Format ke liye)
// Backend endpoint: /api/ledger/statement
export const getPartyStatement = (partyId, startDate, endDate) => {
    return API.get('/ledger/statement', {
        params: { 
            partyId, 
            startDate, 
            endDate 
        }
    });
};

// 4. Dashboard Financial Summary (Today's Sales, Purchases, Receivables)
// Backend endpoint: /api/ledger/summary
export const getFinancialSummary = () => API.get('/ledger/summary');

// 5. Transaction Delete (Admin Only)
export const deleteTransaction = (id) => API.delete(`/ledger/transactions/${id}`);

// 6. Expense Summary Report (Category-wise)
export const getExpenseSummary = (startDate, endDate) => {
    return API.get('/ledger/expense-summary', {
        params: { startDate, endDate }
    });
};