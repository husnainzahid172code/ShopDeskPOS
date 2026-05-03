// frontend/src/utils/api.js
import axios from 'axios';

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL || '/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('sd_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sd_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ─────────────────────────────────────────────────
export const authAPI = {
  login:    (data)  => api.post('/auth/login', data),
  register: (data)  => api.post('/auth/register', data),
  logout:   ()      => api.post('/auth/logout'),
  me:       ()      => api.get('/auth/me'),
};

// ── Products ──────────────────────────────────────────────
export const productAPI = {
  getAll:       (p) => api.get('/products', { params: p }),
  getById:      (id)=> api.get(`/products/${id}`),
  getByBarcode: (b) => api.get(`/products/barcode/${b}`),
  getLowStock:  ()  => api.get('/products/low-stock'),
  getCategories:()  => api.get('/products/categories'),
  create:       (d) => api.post('/products', d),
  update:       (id,d)=> api.put(`/products/${id}`, d),
  remove:       (id)=> api.delete(`/products/${id}`),
};

// ── Invoices ──────────────────────────────────────────────
export const invoiceAPI = {
  getAll:       (p) => api.get('/invoices', { params: p }),
  getById:      (id)=> api.get(`/invoices/${id}`),
  create:       (d) => api.post('/invoices', d),
  updateStatus: (id,s)=> api.put(`/invoices/${id}/status`, { status: s }),
  remove:       (id)=> api.delete(`/invoices/${id}`),
};

// ── Expenses ──────────────────────────────────────────────
export const expenseAPI = {
  getAll:       (p) => api.get('/expenses', { params: p }),
  getCategories:()  => api.get('/expenses/categories'),
  create:       (d) => api.post('/expenses', d),
  update:       (id,d)=> api.put(`/expenses/${id}`, d),
  remove:       (id)=> api.delete(`/expenses/${id}`),
};

// ── Customers ─────────────────────────────────────────────
export const customerAPI = {
  getAll:      (p) => api.get('/customers', { params: p }),
  getById:     (id)=> api.get(`/customers/${id}`),
  getPurchases:(id)=> api.get(`/customers/${id}/purchases`),
  create:      (d) => api.post('/customers', d),
  update:      (id,d)=> api.put(`/customers/${id}`, d),
  remove:      (id)=> api.delete(`/customers/${id}`),
};

// ── Dashboard ─────────────────────────────────────────────
export const dashboardAPI = {
  getSummary:    ()  => api.get('/dashboard/summary'),
  getSalesChart: (p) => api.get('/dashboard/sales-chart', { params: p }),
  getTopProducts:(p) => api.get('/dashboard/top-products', { params: p }),
};

// ── Reports ───────────────────────────────────────────────
export const reportAPI = {
  getSales:    (p) => api.get('/reports/sales',    { params: p }),
  getExpenses: (p) => api.get('/reports/expenses', { params: p }),
  getProfit:   (p) => api.get('/reports/profit',   { params: p }),
  downloadCSV: (type, p) => api.get(`/reports/${type}`, {
    params: { ...p, format: 'csv' }, responseType: 'blob' }),
};

// ── Users ─────────────────────────────────────────────────
export const userAPI = {
  getAll:       ()     => api.get('/users'),
  getById:      (id)   => api.get(`/users/${id}`),
  updateRole:   (id,r) => api.put(`/users/${id}/role`, { role: r }),
  toggleActive: (id)   => api.put(`/users/${id}/toggle-active`),
};

export default api;
