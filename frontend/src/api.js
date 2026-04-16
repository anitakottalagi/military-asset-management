import axios from 'axios';

const API_URL = '/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const login = (username, password) => api.post('/auth/login', { username, password });
export const getMe = () => api.get('/auth/me');

export const getAssets = (params) => api.get('/assets', { params });
export const getBases = () => api.get('/assets/bases');
export const getDashboard = (params) => api.get('/assets/dashboard', { params });

export const getPurchases = (params) => api.get('/purchases', { params });
export const createPurchase = (data) => api.post('/purchases', data);

export const getTransfers = (params) => api.get('/transfers', { params });
export const createTransfer = (data) => api.post('/transfers', data);

export const getAssignments = (params) => api.get('/assignments', { params });
export const createAssignment = (data) => api.post('/assignments', data);

export const getExpenditures = (params) => api.get('/assignments/expenditures', { params });
export const createExpenditure = (data) => api.post('/assignments/expenditures', data);

export default api;
