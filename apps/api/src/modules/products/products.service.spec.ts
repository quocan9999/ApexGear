import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { createPrismaMock } from '../../test-utils/prisma-mock';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new ProductsService(prisma as never);
  });

  describe('findAll', () => {
    it('hides exact stock for public and exposes stockStatus', async () => {
      prisma.product.findMany.mockResolvedValue([
        {
          id: 'p1',
          name: 'Mouse',
          variants: [
            {
              id: 'v1',
              name: 'Default',
              price: 100,
              stockAvailable: 3,
              lowStockThreshold: 5,
              isDefault: true,
            },
          ],
        },
      ]);
      prisma.product.count.mockResolvedValue(1);

      const result = await service.findAll({}, false);
      expect(result.data[0].variants[0]).toEqual(
        expect.objectContaining({
          stockStatus: 'LOW_STOCK',
        }),
      );
      expect(result.data[0].variants[0]).not.toHaveProperty('stockAvailable');
    });

    it('keeps stockAvailable for staff', async () => {
      prisma.product.findMany.mockResolvedValue([
        {
          id: 'p1',
          variants: [
            {
              id: 'v1',
              name: 'Default',
              price: 100,
              stockAvailable: 3,
              lowStockThreshold: 5,
              isDefault: true,
            },
          ],
        },
      ]);
      prisma.product.count.mockResolvedValue(1);

      const result = await service.findAll({}, true);
      expect(result.data[0].variants[0]).toHaveProperty('stockAvailable', 3);
    });

    it('uses FREETEXT $queryRaw for ids+count and filters Prisma findMany by FTS ids in FTS order', async () => {
      // FTS id query first, COUNT query second.
      prisma.$queryRaw
        .mockResolvedValueOnce([{ id: 'p2' }, { id: 'p1' }])
        .mockResolvedValueOnce([{ count: 2 }]);
      prisma.product.findMany.mockResolvedValue([
        { id: 'p2', name: 'Tai nghe Sony', variants: [] },
        { id: 'p1', name: 'Chuột Logitech', variants: [] },
      ]);

      const result = await service.findAll({ search: 'tai nghe' } as never, false);

      // 1. raw FREETEXT was called twice (ids + count), and Prisma's count
      //    helper is NOT used in the FTS path (we use a raw COUNT).
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
      expect(prisma.product.count).not.toHaveBeenCalled();

      // 2. Prisma findMany was called with the FTS ids in the IN clause.
      const findManyArgs = prisma.product.findMany.mock.calls[0][0];
      expect(findManyArgs.where.id).toEqual({ in: ['p2', 'p1'] });

      // 3. Response preserves the FTS (id-page) order, not Prisma's default.
      expect(result.data.map((p: { id: string }) => p.id)).toEqual(['p2', 'p1']);
      expect(result.meta.total).toBe(2);
    });
  });

  describe('findBySlug', () => {
    it('throws when product not found', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      await expect(service.findBySlug('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('rejects missing category', async () => {
      prisma.category.findFirst.mockResolvedValue(null);
      prisma.brand.findFirst.mockResolvedValue({ id: 'b1' });
      await expect(
        service.create({
          name: 'X',
          basePrice: 100,
          categoryId: 'c1',
          brandId: 'b1',
        } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
