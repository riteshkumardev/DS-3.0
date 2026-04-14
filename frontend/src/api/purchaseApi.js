import API from './apiConfig';

export const createPurchase = (purchaseData) => API.post('/purchases', purchaseData);
export const getAllPurchases = (params) => API.get('/purchases', { params });
export const getPurchaseById = (id) => API.get(`/purchases/${id}`);

