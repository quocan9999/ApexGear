import api from './api';
import type { ApiResponse, PageMeta, User } from '../types';

export interface CustomerQuery {
  page?: number;
  limit?: number;
  isActive?: boolean;
  isLocked?: boolean;
}

export interface CustomerUpdate {
  name?: string;
  phone?: string;
  internalNote?: string | null;
  isActive?: boolean;
}

export interface CustomerAddress {
  id: string;
  name: string;
  phone: string;
  provinceCode: string;
  provinceName: string;
  wardCode: string;
  wardName: string;
  detail: string;
  isDefault: boolean;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
}

export interface CustomerDetail extends User {
  internalNote?: string | null;
  addresses?: CustomerAddress[];
  orders?: CustomerOrder[];
}

export interface CustomerListResponse {
  data: User[];
  meta: PageMeta;
}

export const customersService = {
  list: (params?: CustomerQuery) =>
    api.get<CustomerListResponse>('/customers', { params }).then((response) => response.data),

  get: (id: string) =>
    api.get<ApiResponse<CustomerDetail>>(`/customers/${id}`).then((response) => response.data.data),

  update: (id: string, dto: CustomerUpdate) =>
    api.patch<ApiResponse<User>>(`/customers/${id}`, dto).then((response) => response.data.data),

  unlock: (id: string) =>
    api.post<ApiResponse<User>>(`/customers/${id}/unlock`).then((response) => response.data.data),
};
