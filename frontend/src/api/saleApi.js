import API from './apiConfig';

/**
 * Sale API Module - Dharashakti Agro Products
 */

// 1. Create New Sale
export const createSale = (saleData) => API.post('/sales', saleData);

// 2. Get All Sales (with filter support)
export const getAllSales = (filters = '') => API.get(`/sales?${filters}`);

// 3. Get Single Sale by ID
export const getSaleById = (id) => API.get(`/sales/${id}`);

// 4. Update Existing Sale 👈 (ADD THIS)
export const updateSale = (id, saleData) => API.put(`/sales/${id}`, saleData);

// 5. Delete Sale (Stock & Ledger Reversal)
export const deleteSale = (id) => API.delete(`/sales/${id}`);
  
// 6. Print/PDF Invoice
export const getInvoicePDF = (id) => API.get(`/sales/${id}/print`, { responseType: 'blob' });