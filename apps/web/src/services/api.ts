import axios from 'axios';
import i18n from '../i18n';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // Send httpOnly cookies
  headers: { 'Content-Type': 'application/json' },
});

function asMessage(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return asMessage(value[0]);
  return null;
}

function normalizeErrorMessage(message: string | null, status?: number): string {
  if (!status || status >= 500 || !message || message.includes('Request failed with status code') || message.includes('Network Error')) {
    return i18n.t('errors.network');
  }

  switch (message) {
    case 'Invalid credentials':
      return i18n.t('errors.invalidCredentials');
    case 'Vui lòng xác minh email trước khi đăng nhập':
      return i18n.t('auth.loginUnverifiedResent');
    case 'Invalid or expired verification token':
      return i18n.t('auth.verifyEmailMissingToken');
    case 'Invalid or expired reset token':
      return i18n.t('auth.resetMissingToken');
    case 'Email already registered':
      return i18n.t('auth.emailAlreadyRegisteredResent');
    default:
      break;
  }

  if (status === 401 && (message.toLowerCase().includes('credential') || message.toLowerCase().includes('password'))) {
    return i18n.t('errors.invalidCredentials');
  }
  if (status === 401) return i18n.t('errors.unauthorized');
  if (status === 403) return i18n.t('errors.forbidden');
  if (status === 429) return i18n.t('errors.tooManyRequests');

  return message;
}

// Response interceptor: unwrap { data } envelope and translate errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = normalizeErrorMessage(
      asMessage(error.response?.data?.error?.message) ||
        asMessage(error.response?.data?.message) ||
        asMessage(error.message),
      status,
    );

    return Promise.reject({ message, status });
  },
);

export default api;
