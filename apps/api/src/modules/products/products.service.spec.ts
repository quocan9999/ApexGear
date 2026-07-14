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
          stockStatus: 'low_stock',
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
