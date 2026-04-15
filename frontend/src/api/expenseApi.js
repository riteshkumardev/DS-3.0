import API from './apiConfig';

/**
 * Expense API - Dharashakti Agro Products
 * Backend Endpoints Mapping:
 * - GET /expenses          -> getAllExpenses
 * - POST /expenses         -> createExpense
 * - GET /expenses/stats    -> getExpenseStats
 * - PUT /expenses/:id      -> updateExpense
 * - DELETE /expenses/:id   -> deleteExpense
 */

// 1. Sabhi expenses fetch karne ke liye (Sabhi staff ke liye)
export const getAllExpenses = () => API.get('/expenses');

// 2. Naya kharcha (expense) add karne ke liye
export const createExpense = (expenseData) => API.post('/expenses', expenseData);

// 3. Expense Analytics/Stats dekhne ke liye (Sirf ADMIN aur MANAGER)
export const getExpenseStats = () => API.get('/expenses/stats');

// 4. Kisi specific expense ko update karne ke liye (ADMIN aur MANAGER)
export const updateExpense = (id, expenseData) => API.put(`/expenses/${id}`, expenseData);

// 5. Expense record ko delete karne ke liye (Sirf ADMIN)
export const deleteExpense = (id) => API.delete(`/expenses/${id}`);

// Sabhi functions ko ek object mein wrap karke default export
const expenseApi = {
    getAllExpenses,
    createExpense,
    getExpenseStats,
    updateExpense,
    deleteExpense
};

export default expenseApi;