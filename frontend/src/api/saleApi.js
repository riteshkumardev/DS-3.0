import API from './apiConfig';

export const createSale = (saleData) => API.post('/sales', saleData);
export const getAllSales = (filters = '') => API.get(`/sales?${filters}`);
export const getSaleById = (id) => API.get(`/sales/${id}`);
export const deleteSale = (id) => API.delete(`/sales/${id}`);
// Print/PDF ke liye agar backend par route hai
export const getInvoicePDF = (id) => API.get(`/sales/${id}/print`, { responseType: 'blob' });