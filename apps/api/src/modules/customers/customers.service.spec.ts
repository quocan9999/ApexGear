import { NotFoundException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { Role } from '../../common/enums';
import { createPrismaMock } from '../../test-utils/prisma-mock';

describe('CustomersService', () => {
  it('lists only customers and excludes private internal notes', async () => {
    const prisma = createPrismaMock();
    const service = new CustomersService(prisma as never, {} as never);
    prisma.user.findMany.mockResolvedValue([{ id: 'c1', role: Role.CUSTOMER }]);
    prisma.user.count.mockResolvedValue(1);

    const result = await service.findAll({}, Role.ADMIN);

    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ role: Role.CUSTOMER, deletedAt: null }) }));
    expect(result.data[0]).not.toHaveProperty('internalNote');
  });

  it('rejects missing customer targets', async () => {
    const prisma = createPrismaMock();
    const service = new CustomersService(prisma as never, {} as never);
    prisma.user.findFirst.mockResolvedValue(null);
    await expect(service.findOne('missing', Role.ADMIN)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates an address only after validating the customer target', async () => {
    const prisma = createPrismaMock();
    const addresses = { updateForAdmin: jest.fn().mockResolvedValue({ id: 'a1', detail: 'New detail' }) };
    const service = new CustomersService(prisma as never, addresses as never);
    prisma.user.findFirst.mockResolvedValue({ id: 'c1' });

    await expect(
      service.updateAddress('c1', 'a1', { detail: 'New detail' }, Role.ADMIN),
    ).resolves.toEqual({ id: 'a1', detail: 'New detail' });

    expect(addresses.updateForAdmin).toHaveBeenCalledWith('c1', 'a1', { detail: 'New detail' });
  });
});
