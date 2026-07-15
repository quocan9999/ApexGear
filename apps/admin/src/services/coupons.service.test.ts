import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from './api';
import { couponsService } from './coupons.service';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const coupon: import('../types').Coupon = {
  id: 'c1',
  code: 'WELCOME10',
  type: 'PERCENTAGE',
  description: null,
  value: 10,
  minOrderValue: null,
  maxDiscount: null,
  maxUses: null,
  usedCount: 0,
  startsAt: null,
  expiresAt: null,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('couponsService', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset();
    vi.mocked(api.patch).mockReset();
    vi.mocked(api.delete).mockReset();
  });

  it('list hits /coupons with params and keeps meta', async () => {
    const payload = { data: [coupon], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } };
    vi.mocked(api.get).mockResolvedValueOnce({ data: payload });

    const result = await couponsService.list({ page: 1 });

    expect(api.get).toHaveBeenCalledWith('/coupons', { params: { page: 1 } });
    expect(result).toEqual(payload);
  });

  it('create sends POST /coupons with payload and unwraps data', async () => {
    const dto = {
      code: 'SALE20',
      type: 'PERCENTAGE' as const,
      value: 20,
    };
    vi.mocked(api.post).mockResolvedValueOnce({ data: { data: { ...coupon, code: 'SALE20', value: 20 } } });

    const result = await couponsService.create(dto);

    expect(api.post).toHaveBeenCalledWith('/coupons', dto);
    expect(result).toEqual({ ...coupon, code: 'SALE20', value: 20 });
  });

  it('update sends PATCH /coupons/:id with payload and unwraps data', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: { data: { ...coupon, value: 15 } } });

    const result = await couponsService.update('c1', { value: 15 });

    expect(api.patch).toHaveBeenCalledWith('/coupons/c1', { value: 15 });
    expect(result).toEqual({ ...coupon, value: 15 });
  });

  it('remove calls DELETE /coupons/:id', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({ data: {} });

    await couponsService.remove('c1');

    expect(api.delete).toHaveBeenCalledWith('/coupons/c1');
  });
});
