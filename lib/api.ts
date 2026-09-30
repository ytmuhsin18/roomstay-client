import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Attach access token to every request
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// On 401, try refresh token (except for login/refresh endpoints)
api.interceptors.response.use(
    (res) => res,
    async (err) => {
        const original = err.config;
        const isAuthEndpoint = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh');
        if (err.response?.status === 401 && !original?._retry && !isAuthEndpoint) {
            original._retry = true;
            try {
                const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
                if (!refreshToken) throw new Error('No refresh token');
                const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
                localStorage.setItem('accessToken', res.data.accessToken);
                localStorage.setItem('refreshToken', res.data.refreshToken);
                original.headers.Authorization = `Bearer ${res.data.accessToken}`;
                return api(original);
            } catch {
                if (typeof window !== 'undefined') {
                    localStorage.clear();
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                }
            }
        }
        return Promise.reject(err);
    }
);

export default api;

// Typed API helpers
export const authApi = {
    login: (email: string, password: string) => api.post('/auth/login', { email, password }),
    me: () => api.get('/auth/me'),
};

export const roomsApi = {
    list: (params?: object) => api.get('/rooms', { params }),
    get: (id: string) => api.get(`/rooms/${id}`),
    create: (data: object) => api.post('/rooms', data),
    update: (id: string, data: object) => api.put(`/rooms/${id}`, data),
    delete: (id: string) => api.delete(`/rooms/${id}`),
    uploadPhotos: (id: string, form: FormData) => api.post(`/rooms/${id}/photos`, form, { headers: { 'Content-Type': 'multipart/form-data' } }),
    deletePhoto: (id: string, photoUrl: string) => api.delete(`/rooms/${id}/photos`, { data: { photoUrl } }),
};

export const bookingsApi = {
    list: (params?: object) => api.get('/bookings', { params }),
    calendar: (month: number, year: number) => api.get('/bookings/calendar', { params: { month, year } }),
    get: (id: string) => api.get(`/bookings/${id}`),
    create: (data: object) => api.post('/bookings', data),
    update: (id: string, data: object) => api.put(`/bookings/${id}`, data),
    checkIn: (id: string) => api.post(`/bookings/${id}/checkin`),
    checkOut: (id: string) => api.post(`/bookings/${id}/checkout`),
    cancel: (id: string) => api.post(`/bookings/${id}/cancel`),
};

export const customersApi = {
    list: (params?: object) => api.get('/customers', { params }),
    get: (id: string) => api.get(`/customers/${id}`),
    create: (data: object) => api.post('/customers', data),
    update: (id: string, data: object) => api.put(`/customers/${id}`, data),
    delete: (id: string) => api.delete(`/customers/${id}`),
};

export const paymentsApi = {
    list: (params?: object) => api.get('/payments', { params }),
    record: (data: object) => api.post('/payments', data),
    invoiceUrl: (bookingId: string) => `${API_URL}/payments/invoice/${bookingId}`,
};

export const reportsApi = {
    dashboard: () => api.get('/reports/dashboard'),
    revenue: (params?: object) => api.get('/reports/revenue', { params }),
    occupancy: (params?: object) => api.get('/reports/occupancy', { params }),
    roomStats: () => api.get('/reports/room-stats'),
};

export const notificationsApi = {
    list: (params?: object) => api.get('/notifications', { params }),
    markRead: (id: string) => api.put(`/notifications/${id}/read`),
    markAllRead: () => api.put('/notifications/read-all'),
    sendReminder: (data: object) => api.post('/notifications/send-reminder', data),
    delete: (id: string) => api.delete(`/notifications/${id}`),
};

export const channelsApi = {
    list: () => api.get('/channels'),
    update: (id: string, data: object) => api.put(`/channels/${id}`, data),
    sync: () => api.post('/channels/sync'),
    getBookings: () => api.get('/channels/bookings'),
};

export const pricingApi = {
    list: () => api.get('/pricing'),
    create: (data: object) => api.post('/pricing', data),
    update: (id: string, data: object) => api.put(`/pricing/${id}`, data),
    delete: (id: string) => api.delete(`/pricing/${id}`),
    preview: (data: object) => api.post('/pricing/preview', data),
};

export const auditApi = {
    list: (params?: object) => api.get('/audit', { params }),
};

export const usersApi = {
    list: () => api.get('/users'),
    create: (data: object) => api.post('/users', data),
    update: (id: string, data: object) => api.put(`/users/${id}`, data),
    delete: (id: string) => api.delete(`/users/${id}`),
};
