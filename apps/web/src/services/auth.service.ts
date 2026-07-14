import api from './api';
import type { ApiResponse, User, LoginPayload, RegisterPayload } from '../types';

export const authService = {
  login: (data: LoginPayload) =>
    api.post<ApiResponse<User>>('/auth/login', data).then((r) => r.data.data),

  register: (data: RegisterPayload) =>
    api.post<ApiResponse<User>>('/auth/register', data).then((r) => r.data.data),

  logout: () =>
    api.post('/auth/logout').then((r) => r.data),

  getMe: () =>
    api.get<ApiResponse<User>>('/auth/me').then((r) => r.data.data),

  updateProfile: (data: { name?: string; phone?: string }) =>
    api.patch<ApiResponse<User>>('/auth/profile', data).then((r) => r.data.data),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }).then((r) => r.data),
};
