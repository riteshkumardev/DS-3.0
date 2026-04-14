import API from './apiConfig';

// Saari parties fetch karne ke liye (Admin Table ke liye)
export const fetchParties = (params) => API.get('/parties', { params });

// 🚨 Compatibility Fix: Sales/Purchase Entry ke dropdown ke liye
// Yeh backend ke '/api/parties/list' route ko call karega
export const fetchPartiesList = (type) => API.get('/parties/list', { 
    params: { type } // Type: 'SUPPLIER' ya 'CUSTOMER' filter bhej sakte hain
});

export const createParty = (partyData) => API.post('/parties', partyData);

export const getPartyDetails = (id) => API.get(`/parties/${id}`);

export const updateParty = (id, data) => API.put(`/parties/${id}`, data);

export const deleteParty = (id) => API.delete(`/parties/${id}`);