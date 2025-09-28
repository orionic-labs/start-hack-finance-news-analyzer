// src/lib/axios.ts
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? '/api',
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
});

// Works with Axios v1 types too
api.interceptors.request.use((cfg) => {
    if (typeof (cfg.headers as any)?.set === 'function') {
        (cfg.headers as any).set('ngrok-skip-browser-warning', '1');
    } else {
        (cfg.headers as any) = (cfg.headers as any) || {};
        (cfg.headers as any)['ngrok-skip-browser-warning'] = '1';
    }
    return cfg;
});

export default api;
