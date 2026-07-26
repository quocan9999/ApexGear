import api from './api';
import type { ApiResponse, PageMeta, Role, User } from '../types';

export interface StaffQuery {
  page?: number;
  limit?: number;
  role?: Role;
  isActive?: boolean;
  includeDeleted?: boolean;
}

export interface CreateStaffInput {
  email: string;
  name: string;
  role: Exclude<Role, 'CUSTOMER' | 'SUPER_ADMIN'>;
}

export interface UpdateStaffInput {
  name?: string;
  role?: Exclude<Role, 'CUSTOMER' | 'SUPER_ADMIN'>;
  isActive?: boolean;
}

export interface StaffUser extends User {
  activationStatus?: 'PENDING_ACTIVATION' | 'ACTIVE';
}

export interface StaffListResponse {
  data: StaffUser[];
  meta: PageMeta;
}

export const staffService = {
  list: (params?: StaffQuery) =>
    api.get<StaffListResponse>('/staff', { params }).then((response) => response.data),

  create: (dto: CreateStaffInput) =>
    api.post<ApiResponse<StaffUser>>('/staff', dto).then((response) => response.data.data),

  update: (id: string, dto: UpdateStaffInput) =>
    api.patch<ApiResponse<StaffUser>>(`/staff/${id}`, dto).then((response) => response.data.data),

  remove: (id: string) => api.delete<ApiResponse<StaffUser>>(`/staff/${id}`).then((response) => response.data.data),

  restore: (id: string) =>
    api.post<ApiResponse<StaffUser>>(`/staff/${id}/restore`).then((response) => response.data.data),

  resendInvite: (id: string) =>
    api.post<{ message: string }>(`/staff/${id}/resend-invite`).then((response) => response.data),
};
