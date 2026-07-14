import { NotFoundException, BadRequestException } from '@nestjs/common';
import { VariantsService } from './variants.service';
import { createPrismaMock } from '../../test-utils/prisma-mock';

describe('VariantsService', () => {
  let service: VariantsService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new VariantsService(prisma as never);
  });

  it('findByProduct throws when product missing', async () => {
    prisma.product.findFirst.mockResolvedValue(null);
    await expect(service.findByProduct('p1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('findByProduct maps stockStatus for public', async () => {
    prisma.product.findFirst.mockResolvedValue({ id: 'p1' });
    prisma.productVariant.findMany.mockResolvedValue([
      {
        id: 'v1',
        name: 'A',
        stockTotal: 10,
        stockAvailable: 0,
        lowStockThreshold: 5,
        isActive: true,
      },
    ]);

    const result = await service.findByProduct('p1', false);
    expect(result[0]).toEqual(
      expect.objectContaining({ stockStatus: 'out_of_stock' }),
    );
    expect(result[0]).not.toHaveProperty('stockTotal');
  });

  it('remove blocks deleting only default variant', async () => {
    prisma.productVariant.findFirst.mockResolvedValue({
      id: 'v1',
      productId: 'p1',
      isDefault: true,
    });
    prisma.productVariant.count.mockResolvedValue(0);

    await expect(service.remove('p1', 'v1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('create unsets other defaults when isDefault', async () => {
    prisma.product.findFirst.mockResolvedValue({ id: 'p1', slug: 'mouse' });
    prisma.productVariant.updateMany.mockResolvedValue({ count: 1 });
    prisma.productVariant.create.mockResolvedValue({ id: 'v1', name: 'Black' });
    prisma.productVariant.findFirst.mockResolvedValue(null); // sku unique

    await service.create('p1', {
      name: 'Black',
      sku: 'SKU-BLACK',
      isDefault: true,
    });

    expect(prisma.productVariant.updateMany).toHaveBeenCalled();
    expect(prisma.productVariant.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isDefault: true, sku: 'SKU-BLACK' }),
      }),
    );
  });
});
