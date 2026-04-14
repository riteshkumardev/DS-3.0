import API from './apiConfig';

export const getInventory = () => API.get('/stocks');
export const updateStock = (id, data) => API.put(`/stocks/${id}`, data);
export const adjustStockManual = (adjustmentData) => API.post('/stocks/adjust', adjustmentData);
export const getLowStockAlerts = () => API.get('/stocks/low-stock');