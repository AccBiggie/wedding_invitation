import axios from 'axios';

const KEY = 'wedding.auth.token';
export const tokenStore = { get: () => localStorage.getItem(KEY), set: token => localStorage.setItem(KEY, token), clear: () => localStorage.removeItem(KEY) };

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api' });
api.interceptors.request.use(config => { const token = tokenStore.get(); if (token) config.headers.Authorization = `Bearer ${token}`; return config; });
// Token expirado ou revogado: descarta a sessao e avisa a aplicacao para voltar ao login.
api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 && !error.config?.url?.endsWith('/auth/login')) { tokenStore.clear(); window.dispatchEvent(new Event('auth:expired')); }
  return Promise.reject(error);
});
export default api;
