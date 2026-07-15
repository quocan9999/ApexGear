import api from './api';
import type { ApiResponse, Brand } from '../types';

export const brandsService = {
  /** Paginated brand list — request a high limit for filter dropdowns. */
  list: (params?: { page?: number; limit?: number }) =>
    api
      .get<ApiResponse<Brand[]>>('/brands', { params })
      .then((response) => response.data),
};
