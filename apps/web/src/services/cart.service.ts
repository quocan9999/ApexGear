import api from './api';
import type { ApiResponse, Cart } from '../types';

export const cartService = {
  get: () => api.get<ApiResponse<Cart>>('/cart').then((r) => r.data.data),

  addItem: (variantId: string, quantity: number) =>
    api.post<ApiResponse<Cart>>('/cart/items', { variantId, quantity }).then((r) => r.data.data),

  updateItem: (itemId: string, quantity: number) =>
    api.patch<ApiResponse<Cart>>(`/cart/items/${itemId}`, { quantity }).then((r) => r.data.data),

  removeItem: (itemId: string) =>
    api.delete<ApiResponse<Cart>>(`/cart/items/${itemId}`).then((r) => r.data.data),

  merge: (items: { variantId: string; quantity: number }[]) =>
    api.post<ApiResponse<Cart>>('/cart/merge', { items }).then((r) => r.data.data),
};
