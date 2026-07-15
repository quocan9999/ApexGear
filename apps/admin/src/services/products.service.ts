import api from './api';
import type { ApiResponse, Product, ProductQueryParams } from '../types';

export const productsService = {
  list: (params?: ProductQueryParams) =>
    api
      .get<ApiResponse<Product[]>>('/products', { params })
      .then((response) => response.data),

  getBySlug: (slug: string) =>
    api
      .get<ApiResponse<Product>>(`/products/${slug}`)
      .then((response) => response.data.data),

  create: (dto: unknown) =>
    api
      .post<ApiResponse<Product>>('/products', dto)
      .then((response) => response.data.data),

  update: (id: string, dto: unknown) =>
    api
      .patch<ApiResponse<Product>>(`/products/${id}`, dto)
      .then((response) => response.data.data),

  remove: (id: string) =>
    api
      .delete<ApiResponse<Product>>(`/products/${id}`)
      .then((response) => response.data.data),
};
