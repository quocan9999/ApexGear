import api from './api';
import type { ApiResponse, Order, CreateOrderPayload, OrderQueryParams } from '../types';

export const ordersService = {
  create: (payload: CreateOrderPayload) =>
    api.post<ApiResponse<Order>>('/orders', payload).then((r) => r.data.data),

  getAll: (params?: OrderQueryParams) =>
    api.get<ApiResponse<Order[]>>('/orders', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<ApiResponse<Order>>(`/orders/${id}`).then((r) => r.data.data),

  cancel: (id: string) =>
    api.patch<ApiResponse<Order>>(`/orders/${id}/cancel`).then((r) => r.data.data),
};
