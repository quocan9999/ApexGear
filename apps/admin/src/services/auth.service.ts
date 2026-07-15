import api from './api';
import type { ApiResponse, User } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export const authService = {
  login: (credentials: LoginCredentials) =>
    api.post<ApiResponse<User>>('/auth/login', credentials).then((response) => response.data.data),

  logout: () => api.post('/auth/logout').then(() => undefined),

  getMe: () =>
    api.get<ApiResponse<User>>('/auth/me').then((response) => response.data.data),
};
