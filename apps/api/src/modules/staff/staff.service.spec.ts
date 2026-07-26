import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
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

  it('rejects an email already held by a soft-deleted staff account', async () => {
    const prisma = createPrismaMock();
    const service = new StaffService(prisma as never, {} as never, {} as never);
    prisma.user.findUnique.mockResolvedValue({ id: 'deleted-staff' });

    await expect(
      service.create(
        { email: 'staff@example.com', name: 'Staff', role: Role.CONTENT_MANAGER },
        Role.SUPER_ADMIN,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
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

  it('restores a pending staff account without activating it', async () => {
    const prisma = createPrismaMock();
    const service = new StaffService(prisma as never, {} as never, {} as never);
    prisma.user.findFirst.mockResolvedValue({
      id: 's1',
      role: Role.CONTENT_MANAGER,
      activationStatus: 'PENDING_ACTIVATION',
    });
    prisma.user.update.mockResolvedValue({ id: 's1' });

    await service.restore('s1', Role.SUPER_ADMIN);

    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 's1' },
      data: expect.objectContaining({
        deletedAt: null,
        activationStatus: 'PENDING_ACTIVATION',
        isActive: false,
      }),
    }));
  });

  it('restores an active staff account as active', async () => {
    const prisma = createPrismaMock();
    const service = new StaffService(prisma as never, {} as never, {} as never);
    prisma.user.findFirst.mockResolvedValue({
      id: 's1',
      role: Role.CONTENT_MANAGER,
      activationStatus: 'ACTIVE',
    });
    prisma.user.update.mockResolvedValue({ id: 's1' });

    await service.restore('s1', Role.SUPER_ADMIN);

    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        activationStatus: 'ACTIVE',
        isActive: true,
      }),
    }));
  });

  it('rejects an expired invitation before hashing a password', async () => {
    const prisma = createPrismaMock();
    const service = new StaffService(prisma as never, {} as never, {} as never);
    prisma.staffInvitationToken.findUnique.mockResolvedValue({
      id: 'i1',
      userId: 's1',
      usedAt: null,
      expiresAt: new Date('2026-01-01T00:00:00.000Z'),
      user: { activationStatus: 'PENDING_ACTIVATION', deletedAt: null },
    });

    await expect(
      service.acceptInvitation('raw-token', { password: 'Admin123' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(prisma.staffInvitationToken.updateMany).not.toHaveBeenCalled();
  });

  it('atomically consumes a valid invitation and activates its staff account', async () => {
    const prisma = createPrismaMock();
    const service = new StaffService(prisma as never, {} as never, {} as never);
    prisma.staffInvitationToken.findUnique.mockResolvedValue({
      id: 'i1',
      userId: 's1',
      usedAt: null,
      expiresAt: new Date('2099-01-01T00:00:00.000Z'),
      user: { activationStatus: 'PENDING_ACTIVATION', deletedAt: null },
    });
    prisma.staffInvitationToken.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 });
    jest.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);

    await expect(
      service.acceptInvitation('raw-token', { password: 'Admin123' }),
    ).resolves.toEqual({ message: 'Invitation accepted' });

    expect(prisma.staffInvitationToken.updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ where: { id: 'i1', usedAt: null } }),
    );
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: {
        password: 'hashed-password',
        activationStatus: 'ACTIVE',
        isActive: true,
      },
    });
  });

  it('rejects a concurrent invitation acceptance that loses token consumption', async () => {
    const prisma = createPrismaMock();
    const service = new StaffService(prisma as never, {} as never, {} as never);
    prisma.staffInvitationToken.findUnique.mockResolvedValue({
      id: 'i1',
      userId: 's1',
      usedAt: null,
      expiresAt: new Date('2099-01-01T00:00:00.000Z'),
      user: { activationStatus: 'PENDING_ACTIVATION', deletedAt: null },
    });
    prisma.staffInvitationToken.updateMany.mockResolvedValue({ count: 0 });
    jest.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);

    await expect(
      service.acceptInvitation('raw-token', { password: 'Admin123' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('invalidates an older pending invitation before creating a replacement', async () => {
    const prisma = createPrismaMock();
    const emailService = { sendStaffInvitationEmail: jest.fn().mockResolvedValue(undefined) };
    const config = { get: jest.fn().mockReturnValue('http://localhost:5173') };
    const service = new StaffService(prisma as never, emailService as never, config as never);
    prisma.user.findFirst.mockResolvedValue({
      id: 's1',
      role: Role.CONTENT_MANAGER,
      email: 'staff@example.com',
      name: 'Staff',
      activationStatus: 'PENDING_ACTIVATION',
    });
    prisma.staffInvitationToken.create.mockResolvedValue({ id: 'i2' });

    await expect(
      service.resendInvite('s1', 'super-admin-1', Role.SUPER_ADMIN),
    ).resolves.toEqual({ message: 'Invitation sent' });

    expect(prisma.staffInvitationToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 's1', usedAt: null },
        data: expect.objectContaining({ usedAt: expect.any(Date) }),
      }),
    );
    expect(prisma.staffInvitationToken.create).toHaveBeenCalled();
  });
});
