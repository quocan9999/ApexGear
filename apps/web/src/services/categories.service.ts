import api from './api';
import type { ApiResponse, Category } from '../types';

export const categoriesService = {
  getAll: () =>
    api.get<ApiResponse<Category[]>>('/categories').then((r) => r.data.data),
};
