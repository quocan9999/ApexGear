import api from './api';
import type {
  ApiResponse,
  User,
  LoginPayload,
  RegisterPayload,
  AuthMessageResponse,
  VerifyEmailPayload,
  ResendVerificationPayload,
} from '../types';

export const authService = {
  login: (data: LoginPayload) =>
    api.post<ApiResponse<User>>('/auth/login', data).then((r) => r.data.data),

  register: (data: RegisterPayload) =>
    api.post<ApiResponse<AuthMessageResponse>>('/auth/register', data).then((r) => r.data.data),

  verifyEmail: (token: string) =>
    api.post<ApiResponse<AuthMessageResponse>>('/auth/verify-email', { token } satisfies VerifyEmailPayload).then((r) => r.data.data),

  resendVerification: (email: string) =>
    api.post<ApiResponse<AuthMessageResponse>>('/auth/resend-verification', { email } satisfies ResendVerificationPayload).then((r) => r.data.data),

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

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    api.patch<ApiResponse<{ message: string }>>('/auth/change-password', payload).then((r) => r.data.data),
};
