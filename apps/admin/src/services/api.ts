import axios from 'axios';
import i18n from '../i18n';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const candidate = error as {
      message?: string;
      response?: { status?: number; data?: { message?: string } };
    };
    const message =
      candidate.response?.data?.message || candidate.message || i18n.t('common.genericError');

    return Promise.reject({ message, status: candidate.response?.status });
  },
);

export default api;
