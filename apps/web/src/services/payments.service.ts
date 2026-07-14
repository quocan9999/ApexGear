import api from './api';
import type { ApiResponse, SepayQr } from '../types';

export const paymentsService = {
  getSepayQr: (orderId: string) =>
    api.get<ApiResponse<SepayQr>>(`/payments/sepay/qr/${orderId}`).then((r) => r.data.data),
};
