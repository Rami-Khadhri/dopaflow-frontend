import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data,
    });
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('API response:', {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error) => {
    const url = error.config?.url || 'unknown';
    console.error('API error:', {
      url,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
    });
    // Temporarily disable 401 redirect to test
    /*
    const is2FARelated = url.includes('/auth/verify-2fa') || url.includes('suspend-self');
    if (error.response?.status === 401 && !is2FARelated) {
      console.log('401 error detected, would redirect to /login for:', url);
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    */
    return Promise.reject(error);
  }
);

export default api;