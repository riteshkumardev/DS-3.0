// src/api/purchaseApi.js
import API from './apiConfig';

export const createPurchase = (purchaseData) => API.post('/purchases', purchaseData);
export const getAllPurchases = (params) => API.get('/purchases', { params });
export const getPurchaseById = (id) => API.get(`/purchases/${id}`);
export const updatePurchase = (id, data) => API.put(`/purchases/${id}`, data); // 👈 Add this
export const deletePurchase = (id) => API.delete(`/purchases/${id}`);           // 👈 Add this