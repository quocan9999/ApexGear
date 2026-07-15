import api from './api';
import type { ApiResponse, InventoryItem } from '../types';

export interface InventoryQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export const inventoryService = {
  list: (params?: InventoryQuery) =>
    api
      .get<ApiResponse<InventoryItem[]>>('/inventory', { params })
      .then((response) => response.data),

  lowStock: (params?: InventoryQuery) =>
    api
      .get<ApiResponse<InventoryItem[]>>('/inventory/low-stock', { params })
      .then((response) => response.data),

  outOfStock: (params?: InventoryQuery) =>
    api
      .get<ApiResponse<InventoryItem[]>>('/inventory/out-of-stock', { params })
      .then((response) => response.data),

  adjust: (variantId: string, adjustment: number) =>
    api
      .patch<ApiResponse<InventoryItem>>(`/inventory/variants/${variantId}/adjust`, {
        adjustment,
      })
      .then((response) => response.data.data),
};
