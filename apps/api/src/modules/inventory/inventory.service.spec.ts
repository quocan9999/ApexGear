import { NotFoundException, BadRequestException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { createPrismaMock } from '../../test-utils/prisma-mock';

describe('InventoryService', () => {
  let service: InventoryService;
  let prisma: ReturnType<typeof createPrismaMock>;

  const variant = {
    id: 'v1',
    sku: 'SKU-1',
    name: 'Black',
    stockTotal: 10,
    stockAvailable: 8,
    lowStockThreshold: 5,
    product: { id: 'p1', name: 'Mouse', slug: 'mouse' },
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new InventoryService(prisma as never);
  });

  it('findVariant throws when missing', async () => {
    prisma.productVariant.findFirst.mockResolvedValue(null);
    await expect(service.findVariant('x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('adjustStock rejects negative available', async () => {
    prisma.productVariant.findFirst.mockResolvedValue(variant);
    await expect(
      service.adjustStock('v1', { adjustment: -20 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('adjustStock applies positive adjustment', async () => {
    prisma.productVariant.findFirst.mockResolvedValue(variant);
    prisma.productVariant.update.mockResolvedValue({
      ...variant,
      stockAvailable: 13,
      stockTotal: 15,
    });

    await service.adjustStock('v1', { adjustment: 5 });
    expect(prisma.productVariant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { stockAvailable: 13, stockTotal: 15 },
      }),
    );
  });

  it('lowStock filters by threshold and paginates', async () => {
    prisma.productVariant.findMany.mockResolvedValue([
      { ...variant, stockAvailable: 3, lowStockThreshold: 5 },
      { ...variant, id: 'v2', stockAvailable: 10, lowStockThreshold: 5 },
      { ...variant, id: 'v3', stockAvailable: 0, lowStockThreshold: 5 },
    ]);

    // filter low uses stockAvailable > 0 in where; mock returns candidates
    prisma.productVariant.findMany.mockResolvedValue([
      { ...variant, stockAvailable: 3, lowStockThreshold: 5 },
      { ...variant, id: 'v2', stockAvailable: 10, lowStockThreshold: 5 },
    ]);

    const result = await service.lowStock({ page: 1, limit: 20 });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('v1');
    expect(result.meta.total).toBe(1);
  });
});
