import api from './api';
import type { ApiResponse, Brand } from '../types';

export const brandsService = {
  getAll: (params?: { page?: number; limit?: number }) =>
    api
      .get<ApiResponse<Brand[]>>('/brands', { params: { limit: 100, ...(params ?? {}) } })
      .then((r) => r.data.data ?? []),
};
