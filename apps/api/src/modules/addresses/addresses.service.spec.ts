import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { createPrismaMock } from '../../test-utils/prisma-mock';

describe('AddressesService', () => {
  let service: AddressesService;
  let prisma: ReturnType<typeof createPrismaMock>;

  const dto = {
    name: 'An',
    phone: '090',
    provinceCode: '01',
    provinceName: 'HN',
    districtCode: '001',
    districtName: 'D',
    wardCode: '0001',
    wardName: 'W',
    detail: '1 St',
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new AddressesService(prisma as never);
  });

  it('create rejects when max addresses reached', async () => {
    prisma.address.count.mockResolvedValue(10);
    await expect(service.create('u1', dto)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('create forces default when first address', async () => {
    prisma.address.count.mockResolvedValue(0);
    prisma.address.updateMany.mockResolvedValue({ count: 0 });
    prisma.address.create.mockResolvedValue({ id: 'a1', isDefault: true });

    await service.create('u1', dto);
    expect(prisma.address.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isDefault: true }),
      }),
    );
  });

  it('create clears previous default when isDefault true', async () => {
    prisma.address.count.mockResolvedValue(2);
    prisma.address.updateMany.mockResolvedValue({ count: 1 });
    prisma.address.create.mockResolvedValue({ id: 'a2', isDefault: true });

    await service.create('u1', { ...dto, isDefault: true });
    expect(prisma.address.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u1', isDefault: true },
      data: { isDefault: false },
    });
  });

  it('ensureOwned throws NotFound / Forbidden', async () => {
    prisma.address.findUnique.mockResolvedValue(null);
    await expect(service.update('u1', 'a1', { name: 'X' })).rejects.toBeInstanceOf(
      NotFoundException,
    );

    prisma.address.findUnique.mockResolvedValue({ id: 'a1', userId: 'other' });
    await expect(service.update('u1', 'a1', { name: 'X' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('remove promotes next address as default', async () => {
    prisma.address.findUnique.mockResolvedValue({
      id: 'a1',
      userId: 'u1',
      isDefault: true,
    });
    prisma.address.delete.mockResolvedValue({});
    prisma.address.findFirst.mockResolvedValue({ id: 'a2' });
    prisma.address.update.mockResolvedValue({ id: 'a2', isDefault: true });

    await service.remove('u1', 'a1');
    expect(prisma.address.update).toHaveBeenCalledWith({
      where: { id: 'a2' },
      data: { isDefault: true },
    });
  });

  it('setDefault clears others then sets target', async () => {
    prisma.address.findUnique.mockResolvedValue({ id: 'a1', userId: 'u1' });
    prisma.address.updateMany.mockResolvedValue({ count: 1 });
    prisma.address.update.mockResolvedValue({ id: 'a1', isDefault: true });

    await service.setDefault('u1', 'a1');
    expect(prisma.address.updateMany).toHaveBeenCalled();
    expect(prisma.address.update).toHaveBeenCalledWith({
      where: { id: 'a1' },
      data: { isDefault: true },
    });
  });
});
