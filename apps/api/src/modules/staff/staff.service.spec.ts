import { ConflictException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { StaffService } from './staff.service';
import { Role } from '../../common/enums';
import { createPrismaMock } from '../../test-utils/prisma-mock';

jest.mock('bcrypt');

describe('StaffService', () => {
  it('creates a pending staff account without a password and sends an invite', async () => {
    const prisma = createPrismaMock();
    const emailService = { sendStaffInvitationEmail: jest.fn().mockResolvedValue(undefined) };
    const config = { get: jest.fn().mockReturnValue('http://localhost:5173') };
    const service = new StaffService(prisma as never, emailService as never, config as never);
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: 's1', email: 'staff@example.com', name: 'Staff', role: Role.CONTENT_MANAGER });
    prisma.staffInvitationToken.create.mockResolvedValue({ id: 'i1' });
    await service.create({ email: 'staff@example.com', name: 'Staff', role: Role.CONTENT_MANAGER }, Role.ADMIN);

    expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ password: null, activationStatus: 'PENDING_ACTIVATION', isActive: false }) }));
    expect(emailService.sendStaffInvitationEmail).toHaveBeenCalled();
  });

  it('rejects ADMIN assigning ADMIN', async () => {
    const prisma = createPrismaMock();
    const service = new StaffService(prisma as never, {} as never, {} as never);
    await expect(service.create({ email: 'admin@example.com', name: 'Admin', role: Role.ADMIN }, Role.ADMIN)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects duplicate email', async () => {
    const prisma = createPrismaMock();
    const service = new StaffService(prisma as never, {} as never, {} as never);
    prisma.user.findFirst.mockResolvedValue({ id: 'existing' });
    await expect(service.create({ email: 'staff@example.com', name: 'Staff', role: Role.CONTENT_MANAGER }, Role.SUPER_ADMIN)).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects customer roles even when called without DTO validation', async () => {
    const prisma = createPrismaMock();
    const service = new StaffService(prisma as never, {} as never, {} as never);
    await expect(service.create({ email: 'customer@example.com', name: 'Customer', role: Role.CUSTOMER as never }, Role.SUPER_ADMIN)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('scopes staff queries to staff roles', async () => {
    const prisma = createPrismaMock();
    const service = new StaffService(prisma as never, {} as never, {} as never);
    prisma.user.findMany.mockResolvedValue([]);
    prisma.user.count.mockResolvedValue(0);

    await service.findAll({}, Role.SUPER_ADMIN);

    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ role: { in: expect.arrayContaining([Role.SUPER_ADMIN, Role.ADMIN]) } }),
    }));
  });
});
