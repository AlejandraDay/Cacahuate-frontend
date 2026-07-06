import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = 'https://localhost:7191/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken') || Cookies.get('authToken');
  if (token && token !== 'undefined') {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  console.log('[API] request:', config.method?.toUpperCase(), config.url, '| auth:', !!config.headers.get('Authorization'));
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      console.error('[API] 401 en:', error.config?.url);
      console.error('[API] Authorization enviado:', error.config?.headers?.Authorization ?? error.config?.headers?.get?.('Authorization') ?? 'NO');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
