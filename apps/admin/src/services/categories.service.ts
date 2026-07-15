import api from './api';
import type { ApiResponse, Category } from '../types';

export const categoriesService = {
  /** Staff tree list (parents with children). */
  list: () =>
    api.get<ApiResponse<Category[]>>('/categories').then((response) => response.data.data),
};
