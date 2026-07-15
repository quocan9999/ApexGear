import api from './api';
import type { ApiResponse, Category } from '../types';

export interface CategoryPayload {
  name: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export const categoriesService = {
  /** Staff tree list (parents with children). */
  list: (params?: { includeInactive?: boolean }) =>
    api
      .get<ApiResponse<Category[]>>('/categories', {
        params: {
          includeInactive: params?.includeInactive ?? true,
        },
      })
      .then((response) => response.data.data),

  create: (dto: CategoryPayload) =>
    api
      .post<ApiResponse<Category>>('/categories', dto)
      .then((response) => response.data.data),

  update: (id: string, dto: CategoryPayload) =>
    api
      .patch<ApiResponse<Category>>(`/categories/${id}`, dto)
      .then((response) => response.data.data),

  remove: (id: string) =>
    api
      .delete<ApiResponse<Category>>(`/categories/${id}`)
      .then((response) => response.data.data),
};
