import api from './api';
import type { ApiResponse, Order, OrderQueryParams, OrderStatus } from '../types';

export const ordersService = {
  list: (params?: OrderQueryParams) =>
    api
      .get<ApiResponse<Order[]>>('/admin/orders', { params })
      .then((response) => response.data),

  getById: (id: string) =>
    api
      .get<ApiResponse<Order>>(`/admin/orders/${id}`)
      .then((response) => response.data.data),

  updateStatus: (id: string, payload: { status: OrderStatus; cancelReason?: string }) =>
    api
      .patch<ApiResponse<Order>>(`/admin/orders/${id}/status`, payload)
      .then((response) => response.data.data),
};
