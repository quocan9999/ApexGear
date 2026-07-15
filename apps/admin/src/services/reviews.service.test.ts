import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from './api';
import { reviewsService } from './reviews.service';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const review: import('../types').Review = {
  id: 'r1',
  productId: 'p1',
  userId: 'u1',
  rating: 4,
  comment: 'Good product!',
  status: 'PENDING',
  user: { id: 'u1', email: 'test@example.com', name: 'Test' },
  product: { id: 'p1', name: 'Sony WH-1000XM5', slug: 'sony-wh-1000xm5' },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('reviewsService', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.patch).mockReset();
  });

  it('list hits /admin/reviews with params and keeps meta', async () => {
    const payload = {
      data: [review],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };
    vi.mocked(api.get).mockResolvedValueOnce({ data: payload });

    const result = await reviewsService.list({ page: 1, status: 'PENDING' });

    expect(api.get).toHaveBeenCalledWith('/admin/reviews', {
      params: { page: 1, status: 'PENDING' },
    });
    expect(result).toEqual(payload);
  });

  it('updateStatus unwraps data', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: { data: review } });
    const result = await reviewsService.updateStatus('r1', 'APPROVED');
    expect(api.patch).toHaveBeenCalledWith('/admin/reviews/r1/status', {
      status: 'APPROVED',
    });
    expect(result).toEqual(review);
  });
});
