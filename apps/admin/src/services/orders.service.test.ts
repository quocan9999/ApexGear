import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from './api';
import { ordersService } from './orders.service';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const order = {
  id: 'o1',
  orderNumber: 'AG-20260101-AB12',
  userId: 'u1',
  status: 'PENDING' as const,
  paymentMethod: 'COD' as const,
  paymentStatus: 'UNPAID' as const,
  subtotal: 1000000,
  shippingFee: 30000,
  discount: 0,
  total: 1030000,
  shippingName: 'An',
  shippingPhone: '0900000000',
  shippingAddress: '1 Đường A',
  shippingWard: 'Phường 1',
  shippingProvince: 'HCM',
  couponId: null,
  sepayRef: null,
  note: null,
  paidAt: null,
  confirmedAt: null,
  shippedAt: null,
  deliveredAt: null,
  completedAt: null,
  cancelledAt: null,
  cancelReason: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  items: [],
};

describe('ordersService', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.patch).mockReset();
  });

  it('list hits /admin/orders with params and keeps meta', async () => {
    const payload = {
      data: [order],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };
    vi.mocked(api.get).mockResolvedValueOnce({ data: payload });

    const result = await ordersService.list({ page: 1, status: 'PENDING' });

    expect(api.get).toHaveBeenCalledWith('/admin/orders', {
      params: { page: 1, status: 'PENDING' },
    });
    expect(result).toEqual(payload);
  });

  it('getById unwraps data', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { data: order } });
    const result = await ordersService.getById('o1');
    expect(api.get).toHaveBeenCalledWith('/admin/orders/o1');
    expect(result).toEqual(order);
  });

  it('updateStatus unwraps data', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: { data: order } });
    const result = await ordersService.updateStatus('o1', {
      status: 'CANCELLED',
      cancelReason: 'Out of stock',
    });
    expect(api.patch).toHaveBeenCalledWith('/admin/orders/o1/status', {
      status: 'CANCELLED',
      cancelReason: 'Out of stock',
    });
    expect(result).toEqual(order);
  });
});
