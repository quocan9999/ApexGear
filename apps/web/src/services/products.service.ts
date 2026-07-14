import api from './api';
import type { ApiResponse, Product, ProductQueryParams } from '../types';

export const productsService = {
  getAll: (params?: ProductQueryParams) =>
    api.get<ApiResponse<Product[]>>('/products', { params }).then((r) => r.data),

  getBySlug: (slug: string) =>
    api.get<ApiResponse<Product>>(`/products/${slug}`).then((r) => r.data.data),
};
