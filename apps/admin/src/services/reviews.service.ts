import api from './api';
import type { ApiResponse, Review, ReviewStatus } from '../types';

export interface ReviewQuery {
  page?: number;
  limit?: number;
  status?: ReviewStatus;
  productId?: string;
}

export const reviewsService = {
  list: (params?: ReviewQuery) =>
    api
      .get<ApiResponse<Review[]>>('/admin/reviews', { params })
      .then((response) => response.data),

  updateStatus: (id: string, status: ReviewStatus) =>
    api
      .patch<ApiResponse<Review>>(`/admin/reviews/${id}/status`, { status })
      .then((response) => response.data.data),
};
