import { describe, it, expect, vi } from 'vitest';
import api from './api';
import { dashboardService } from './dashboard.service';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('dashboardService', () => {
  it('getStats hits /dashboard/stats and unwraps data', async () => {
    const data = {
      totalOrders: 1,
      totalRevenue: 2,
      totalProducts: 3,
      totalUsers: 4,
      pendingOrders: 5,
      lowStockCount: 6,
    };
    (api.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { data } });
    const result = await dashboardService.getStats();
    expect(api.get).toHaveBeenCalledWith('/dashboard/stats');
    expect(result).toEqual(data);
  });

  it('getRevenue passes days=7 as query param', async () => {
    const data = [{ date: '2026-07-10', revenue: 100 }];
    (api.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { data } });
    const result = await dashboardService.getRevenue(7);
    expect(api.get).toHaveBeenCalledWith('/dashboard/revenue', { params: { days: 7 } });
    expect(result).toEqual(data);
  });

  it('getRevenue passes days=30 as query param', async () => {
    (api.get as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { data: [] } });
    await dashboardService.getRevenue(30);
    expect(api.get).toHaveBeenCalledWith('/dashboard/revenue', { params: { days: 30 } });
  });
});
