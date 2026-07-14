import api from './api';
import type { ApiResponse, Address, CreateAddressPayload } from '../types';

export const addressesService = {
  getAll: () => api.get<ApiResponse<Address[]>>('/addresses').then((r) => r.data.data ?? []),

  create: (payload: CreateAddressPayload) =>
    api.post<ApiResponse<Address>>('/addresses', payload).then((r) => r.data.data),

  update: (id: string, payload: Partial<CreateAddressPayload>) =>
    api.patch<ApiResponse<Address>>(`/addresses/${id}`, payload).then((r) => r.data.data),

  remove: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/addresses/${id}`).then((r) => r.data.data),

  setDefault: (id: string) =>
    api.patch<ApiResponse<Address>>(`/addresses/${id}/default`).then((r) => r.data.data),
};
