import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
    timeout: 15000,
    // No cookies needed:
    withCredentials: false,
});

// Don’t set a global Content-Type; let Axios set it per request.
// (Important for FormData on iOS — prevents bad preflights.)
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token'); // or another secure store
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (r) => r,
    (err) => {
        console.error('API Error:', err.response?.data || err.message);
        if (err.response?.status === 401) {
            // e.g., redirect to login or refresh token
        }
        return Promise.reject(err);
    }
);

export default api;
