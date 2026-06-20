import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '';

// Suffix '/api' automatically if not present in the base path
const baseURL = apiBaseUrl
  ? (apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl.replace(/\/$/, '')}/api`)
  : '/api';

const api = axios.create({
  baseURL,
});

api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
