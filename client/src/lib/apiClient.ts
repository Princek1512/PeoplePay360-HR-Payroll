import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token to every outgoing request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('peoplepay360_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response interceptor for token expiry handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't auto-redirect if already on /login to allow error message display
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('peoplepay360_token');
        localStorage.removeItem('peoplepay360_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
