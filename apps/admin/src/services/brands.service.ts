import api from './api';
import type { ApiResponse, Brand } from '../types';

export interface BrandPayload {
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  isActive?: boolean;
}

export interface BrandListParams {
  page?: number;
  limit?: number;
}

export const brandsService = {
  /** Paginated brand list — keeps envelope meta. API returns active brands only. */
  list: (params?: BrandListParams) =>
    api
      .get<ApiResponse<Brand[]>>('/brands', { params })
      .then((response) => response.data),

  create: (dto: BrandPayload) =>
    api
      .post<ApiResponse<Brand>>('/brands', dto)
      .then((response) => response.data.data),

  update: (id: string, dto: BrandPayload) =>
    api
      .patch<ApiResponse<Brand>>(`/brands/${id}`, dto)
      .then((response) => response.data.data),

  remove: (id: string) =>
    api
      .delete<ApiResponse<Brand>>(`/brands/${id}`)
      .then((response) => response.data.data),
};
