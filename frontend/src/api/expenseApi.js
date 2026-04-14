import API from './apiConfig';

export const addExpense = (data) => API.post('/expenses', data);
export const getExpenses = (filters) => API.get('/expenses', { params: filters });
export const deleteExpense = (id) => API.delete(`/expenses/${id}`);