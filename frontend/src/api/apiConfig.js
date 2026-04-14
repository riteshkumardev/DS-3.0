import axios from 'axios';

// 🌍 Vercal/Production vs Local Development environment check
// .env file mein REACT_APP_API_URL define karna hoga
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const API = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request Interceptor: Auth Token handle karne ke liye
API.interceptors.request.use((req) => {
    const userInfo = localStorage.getItem('userInfo') 
        ? JSON.parse(localStorage.getItem('userInfo')) 
        : null;

    if (userInfo && userInfo.token) {
        req.headers.Authorization = `Bearer ${userInfo.token}`;
    }
    return req;
});

export default API;