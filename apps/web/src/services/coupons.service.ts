import api from './api';
import type { ApiResponse, CouponValidation } from '../types';

export const couponsService = {
  validate: (code: string, subtotal: number) =>
    api
      .post<ApiResponse<CouponValidation>>('/coupons/validate', { code, subtotal })
      .then((r) => r.data.data),
};
