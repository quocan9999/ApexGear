import { DashboardService } from './dashboard.service';
import { createPrismaMock } from '../../test-utils/prisma-mock';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new DashboardService(prisma as never);
  });

  describe('getStats', () => {
    it('aggregates counts and low stock', async () => {
      prisma.order.count
        .mockResolvedValueOnce(10) // totalOrders
        .mockResolvedValueOnce(2); // pendingOrders
      prisma.order.aggregate.mockResolvedValue({
        _sum: { total: 1_500_000 },
      });
      prisma.product.count.mockResolvedValue(20);
      prisma.user.count.mockResolvedValue(5);
      prisma.productVariant.findMany.mockResolvedValue([
        { stockAvailable: 3, lowStockThreshold: 5 }, // low
        { stockAvailable: 0, lowStockThreshold: 5 }, // out — not low
        { stockAvailable: 10, lowStockThreshold: 5 }, // ok
      ]);

      const stats = await service.getStats();
      expect(stats).toEqual({
        totalOrders: 10,
        totalRevenue: 1_500_000,
        totalProducts: 20,
        totalUsers: 5,
        pendingOrders: 2,
        lowStockCount: 1,
      });
    });
  });

  describe('getRevenue', () => {
    it('defaults to 7 days and buckets by date', async () => {
      // Mirror service window: local midnight (safeDays-1) days ago.
      // Use that exact Date so toISOString() key matches a bucket key.
      const since = new Date();
      since.setHours(0, 0, 0, 0);
      since.setDate(since.getDate() - 6);

      prisma.order.findMany.mockResolvedValue([
        { total: 100000, createdAt: new Date(since) },
        { total: 50000, createdAt: new Date(since) },
      ]);

      const result = await service.getRevenue(7);
      expect(result).toHaveLength(7);
      const key = since.toISOString().slice(0, 10);
      const bucket = result.find((r) => r.date === key);
      expect(bucket?.revenue).toBe(150000);
      expect(result.reduce((sum, r) => sum + r.revenue, 0)).toBe(150000);
    });

    it('supports 30 days only (else 7)', async () => {
      prisma.order.findMany.mockResolvedValue([]);
      const result30 = await service.getRevenue(30);
      expect(result30).toHaveLength(30);

      const resultOther = await service.getRevenue(14);
      expect(resultOther).toHaveLength(7);
    });
  });
});
