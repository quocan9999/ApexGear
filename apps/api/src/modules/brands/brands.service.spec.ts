import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { BrandsService } from './brands.service';
import { createPrismaMock } from '../../test-utils/prisma-mock';

describe('BrandsService', () => {
  let service: BrandsService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new BrandsService(prisma as never);
  });

  it('findAll returns paginated brands', async () => {
    prisma.brand.findMany.mockResolvedValue([{ id: 'b1', name: 'Sony' }]);
    prisma.brand.count.mockResolvedValue(1);

    const result = await service.findAll({ page: 1, limit: 20 });
    expect(result.data).toHaveLength(1);
    expect(result.meta.total).toBe(1);
    expect(result.meta.totalPages).toBe(1);
  });

  it('findOne throws when missing', async () => {
    prisma.brand.findFirst.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create maps P2002 to conflict', async () => {
    prisma.brand.findFirst.mockResolvedValue(null);
    prisma.brand.create.mockRejectedValue({ code: 'P2002' });
    await expect(service.create({ name: 'Sony' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('remove rejects brand with products', async () => {
    prisma.brand.findFirst.mockResolvedValue({
      id: 'b1',
      _count: { products: 3 },
    });
    await expect(service.remove('b1')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('remove soft-deletes empty brand', async () => {
    prisma.brand.findFirst.mockResolvedValue({
      id: 'b1',
      _count: { products: 0 },
    });
    prisma.brand.update.mockResolvedValue({ id: 'b1', deletedAt: new Date() });
    await service.remove('b1');
    expect(prisma.brand.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ deletedAt: expect.any(Date) }),
      }),
    );
  });
});
