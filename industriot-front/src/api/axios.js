import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const user  = JSON.parse(localStorage.getItem('user') || '{}');

  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Ajoute user_id automatiquement à tous les GET
  if (config.method === 'get' && user?.id) {
    config.params = { ...config.params, user_id: user.id };
  }

  return config;
});

export default api;