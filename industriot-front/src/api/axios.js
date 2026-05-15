import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Envoyer user_id uniquement si nécessaire (pas remplacé par le middleware)
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (user?.id && config.method === 'get') {
    config.params = { ...config.params, user_id: user.id };
  }

  return config;
});

// Intercepteur réponse — déconnexion automatique si token expiré
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('lastActivity');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;