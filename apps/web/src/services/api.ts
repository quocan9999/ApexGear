import axios from 'axios';
import i18n from '../i18n';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // Send httpOnly cookies
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor: unwrap { data } envelope and translate errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message =
      error.response?.data?.error?.message || error.response?.data?.message || error.message || 'Something went wrong';
    const status = error.response?.status;

    // Map technical or backend errors to user-friendly messages
    if (!status || status >= 500 || message.includes('Request failed with status code') || message.includes('Network Error')) {
      message = i18n.t('errors.network');
    } else if (status === 401 && (message.toLowerCase().includes('credential') || message.toLowerCase().includes('password'))) {
      message = i18n.t('errors.invalidCredentials');
    } else if (status === 401) {
      message = i18n.t('errors.unauthorized');
    } else if (status === 403) {
      message = i18n.t('errors.forbidden');
    }

    return Promise.reject({ message, status });
  },
);

export default api;
