import axios from 'axios';
import i18n from '../i18n';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let refreshTokenPromise: Promise<any> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: any) => {
    const originalConfig = error.config;
    const candidate = error as {
      message?: string;
      response?: { status?: number; data?: { message?: string, error?: { message?: string } } };
    };
    
    const status = candidate.response?.status;

    if (status === 401 && originalConfig && originalConfig.url !== '/auth/refresh' && !originalConfig._retry) {
      originalConfig._retry = true;

      if (!refreshTokenPromise) {
        refreshTokenPromise = api.post('/auth/refresh').finally(() => {
          refreshTokenPromise = null;
        });
      }

      try {
        await refreshTokenPromise;
        return api(originalConfig);
      } catch (refreshError) {
        const { useAuthStore } = await import('../stores/auth.store');
        useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false, error: null });
      }
    }

    const rawMessage =
      candidate.response?.data?.error?.message || candidate.response?.data?.message || candidate.message;
    let message = rawMessage || i18n.t('common.genericError');

    // Map technical or backend errors to user-friendly messages
    if (status && status >= 500) {
      message = i18n.t('errors.server');
    } else if (!status || message.includes('Request failed with status code') || message.includes('Network Error')) {
      message = i18n.t('errors.network');
    } else if (status === 401 && (message.toLowerCase().includes('credential') || message.toLowerCase().includes('password'))) {
      message = i18n.t('errors.invalidCredentials');
    } else if (status === 401) {
      message = i18n.t('errors.unauthorized');
    } else if (status === 403) {
      message = i18n.t('errors.forbidden');
    } else if (status === 429) {
      message = i18n.t('errors.tooManyRequests');
    }

    return Promise.reject({ message, rawMessage, status, config: originalConfig });
  },
);

export default api;
