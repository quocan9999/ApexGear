import api from './api';
import type { ApiResponse, User } from '../types';

export interface UserQuery {
  page?: number;
  limit?: number;
  role?: string;
  isActive?: boolean;
  isLocked?: boolean;
}

export const usersService = {
  list: (params?: UserQuery) =>
    api.get<ApiResponse<User[]>>('/users', { params }).then((response) => response.data),

  update: (id: string, dto: { role?: string; isActive?: boolean }) =>
    api.patch<ApiResponse<User>>(`/users/${id}`, dto).then((response) => response.data.data),

  remove: (id: string) =>
    api.delete<ApiResponse<void>>(`/users/${id}`).then((response) => response.data),

  restore: (id: string) =>
    api.post<ApiResponse<User>>(`/users/${id}/restore`).then((response) => response.data.data),

  unlock: (id: string) =>
    api.post<ApiResponse<User>>(`/users/${id}/unlock`).then((response) => response.data.data),
};
