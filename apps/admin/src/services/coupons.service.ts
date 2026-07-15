import api from './api';
import type { ApiResponse, Coupon } from '../types';

export interface CouponPayload {
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  description?: string;
  minOrderValue?: number;
  maxDiscount?: number;
  maxUses?: number;
  startsAt?: string;
  expiresAt?: string;
}

export interface CouponUpdatePayload extends Partial<CouponPayload> {
  isActive?: boolean;
}

export interface CouponListParams {
  page?: number;
  limit?: number;
}

export const couponsService = {
  /** Paginated coupon list — keeps envelope meta. */
  list: (params?: CouponListParams) =>
    api.get<ApiResponse<Coupon[]>>('/coupons', { params }).then((response) => response.data),

  create: (dto: CouponPayload) =>
    api.post<ApiResponse<Coupon>>('/coupons', dto).then((response) => response.data.data),

  update: (id: string, dto: CouponUpdatePayload) =>
    api.patch<ApiResponse<Coupon>>(`/coupons/${id}`, dto).then((response) => response.data.data),

  remove: (id: string) =>
    api.delete<ApiResponse<void>>(`/coupons/${id}`).then((response) => response.data),
};
