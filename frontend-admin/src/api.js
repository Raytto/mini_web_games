import axios from 'axios';

// In production (via Nginx), /api is routed to backend.
// In local dev (via Vite), /api is proxied to backend.
const API_URL = '/api';

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            if (window.location.pathname !== '/login') {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const login = async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    const response = await api.post('/token', formData);
    return response.data;
};

export const getMe = async () => {
    const response = await api.get('/users/me');
    return response.data;
}

export const getStats = async (endpoint, params = {}) => {
    const response = await api.get(`/admin/stats/${endpoint}`, { params });
    return response.data;
};

export default api;
