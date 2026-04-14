import API from './apiConfig';

/**
 * Product Master API - Dharashakti Agro Products ERP
 * Saare Products (Corn, Rice Grit, etc.) manage karne ke liye
 */

// 1. Saare products fetch karne ke liye (Master Table aur Dropdowns ke liye)
// Isme search aur category filters bhi use kar sakte hain
export const getAllProducts = (params) => API.get('/products', { params });

// 2. Naya product master mein add karne ke liye
export const createProduct = (productData) => API.post('/products', productData);

// 3. Single product ki details lene ke liye
export const getProductById = (id) => API.get(`/products/${id}`);

// 4. Existing product ko update karne ke liye (Price, HSN, etc.)
export const updateProduct = (id, data) => API.put(`/products/${id}`, data);

// 5. Product ko master list se delete karne ke liye
export const deleteProduct = (id) => API.delete(`/products/${id}`);

/**
 * 💡 Compatibility Tip: 
 * Agar aapko sirf active products chahiye dropdown ke liye, 
 * toh aap getAllProducts({ isActive: true }) call kar sakte hain.
 */