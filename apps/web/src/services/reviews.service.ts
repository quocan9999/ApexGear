import api from './api';
import type { ApiResponse, Review } from '../types';

export interface ReviewQueryParams {
  page?: number;
  limit?: number;
}

export interface ReviewCreatePayload {
  productId: string;
  rating: number;
  comment?: string;
}

export const reviewsService = {
  getByProduct: (productId: string, params?: ReviewQueryParams) =>
    api
      .get<ApiResponse<Review[]>>(`/products/${productId}/reviews`, {
        params: { limit: 10, ...(params ?? {}) },
      })
      .then((r) => r.data),

  create: (payload: ReviewCreatePayload) =>
    api
      .post<ApiResponse<Review>>(`/products/${payload.productId}/reviews`, {
        rating: payload.rating,
        comment: payload.comment,
      })
      .then((r) => r.data.data),
};
