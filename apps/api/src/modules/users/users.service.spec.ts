import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { createPrismaMock } from '../../test-utils/prisma-mock';
import { Role } from '../../common/enums';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: ReturnType<typeof createPrismaMock>;

  const user = {
    id: 'u1',
    email: 'a@b.com',
    name: 'A',
    role: Role.CUSTOMER,
    isActive: true,
    password: 'x',
    phone: null,
    avatar: null,
    provider: 'LOCAL',
    googleId: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    tokenVersion: 0,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new UsersService(prisma as never);
  });

  it('findAll returns UserEntity list with meta', async () => {
    prisma.user.findMany.mockResolvedValue([user]);
    prisma.user.count.mockResolvedValue(1);
    const result = await service.findAll({});
    expect(result.data[0].email).toBe('a@b.com');
    expect(result.meta.total).toBe(1);
  });

  it('findOne throws when missing', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('prevents self role change', async () => {
    prisma.user.findFirst.mockResolvedValue(user);
    await expect(
      service.update('u1', { role: Role.ADMIN }, 'u1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows admin to change other user role', async () => {
    prisma.user.findFirst.mockResolvedValue(user);
    prisma.user.update.mockResolvedValue({ ...user, role: Role.ADMIN });
    const result = await service.update('u1', { role: Role.ADMIN }, 'admin');
    expect(result.role).toBe(Role.ADMIN);
  });

  it('prevents self delete', async () => {
    await expect(service.remove('u1', 'u1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('soft-deletes other user', async () => {
    prisma.user.findFirst.mockResolvedValue(user);
    prisma.user.update.mockResolvedValue({
      ...user,
      deletedAt: new Date(),
      isActive: false,
    });
    await service.remove('u1', 'admin');
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isActive: false }),
      }),
    );
  });

  it('unlock clears lock fields', async () => {
    prisma.user.findFirst.mockResolvedValue(user);
    prisma.user.update.mockResolvedValue({
      ...user,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
    await service.unlock('u1');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  });

  it('restore only works for deleted users', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    await expect(service.restore('u1')).rejects.toBeInstanceOf(NotFoundException);
  });
});
