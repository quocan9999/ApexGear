import {
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { EmailService } from '../../common/services/email.service';
import { createPrismaMock } from '../../test-utils/prisma-mock';
import { Role } from '../../common/enums';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let jwtService: { sign: jest.Mock };
  let emailService: {
    sendResetPasswordEmail: jest.Mock;
  };
  let configService: { get: jest.Mock };

  const baseUser = {
    id: 'u1',
    email: 'user@example.com',
    password: 'hashed',
    name: 'User',
    phone: null,
    avatar: null,
    role: Role.CUSTOMER,
    provider: 'LOCAL',
    isActive: true,
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
    jwtService = { sign: jest.fn().mockReturnValue('jwt-token') };
    emailService = { sendResetPasswordEmail: jest.fn().mockResolvedValue(undefined) };
    configService = {
      get: jest.fn((_key: string, def?: string) => def ?? 'http://localhost:5173'),
    };

    service = new AuthService(
      prisma as never,
      jwtService as unknown as JwtService,
      emailService as unknown as EmailService,
      configService as unknown as ConfigService,
    );
  });

  describe('register', () => {
    it('creates a user when email is free', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      prisma.user.create.mockResolvedValue({ ...baseUser, password: 'hashed-pw' });

      const result = await service.register({
        email: 'user@example.com',
        password: 'Password1',
        name: 'User',
      });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'user@example.com',
            password: 'hashed-pw',
            name: 'User',
          }),
        }),
      );
      expect(result.email).toBe('user@example.com');
    });

    it('throws ConflictException when email exists', async () => {
      prisma.user.findFirst.mockResolvedValue(baseUser);
      await expect(
        service.register({
          email: 'user@example.com',
          password: 'Password1',
          name: 'User',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('returns user and token on valid credentials', async () => {
      prisma.user.findFirst.mockResolvedValue(baseUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login({
        email: 'user@example.com',
        password: 'Password1',
      });

      expect(result.token).toBe('jwt-token');
      expect(result.user.email).toBe('user@example.com');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'u1',
        email: 'user@example.com',
        role: Role.CUSTOMER,
      });
    });

    it('throws UnauthorizedException for unknown email', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(
        service.login({ email: 'x@y.com', password: 'x' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws 423 when account is locked', async () => {
      prisma.user.findFirst.mockResolvedValue({
        ...baseUser,
        lockedUntil: new Date(Date.now() + 60_000),
      });
      await expect(
        service.login({ email: 'user@example.com', password: 'x' }),
      ).rejects.toBeInstanceOf(HttpException);
    });

    it('throws when account is deactivated', async () => {
      prisma.user.findFirst.mockResolvedValue({ ...baseUser, isActive: false });
      await expect(
        service.login({ email: 'user@example.com', password: 'x' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('increments failed attempts and throws on bad password', async () => {
      prisma.user.findFirst.mockResolvedValue({
        ...baseUser,
        failedLoginAttempts: 0,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      prisma.user.update.mockResolvedValue(baseUser);

      await expect(
        service.login({ email: 'user@example.com', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { failedLoginAttempts: 1 },
        }),
      );
    });

    it('locks account after 5 failed attempts', async () => {
      prisma.user.findFirst.mockResolvedValue({
        ...baseUser,
        failedLoginAttempts: 4,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      prisma.user.update.mockResolvedValue(baseUser);

      await expect(
        service.login({ email: 'user@example.com', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            failedLoginAttempts: 5,
            lockedUntil: expect.any(Date),
          }),
        }),
      );
    });

    it('resets failed attempts on successful login', async () => {
      prisma.user.findFirst.mockResolvedValue({
        ...baseUser,
        failedLoginAttempts: 2,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.user.update.mockResolvedValue(baseUser);

      await service.login({ email: 'user@example.com', password: 'Password1' });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { failedLoginAttempts: 0, lockedUntil: null },
        }),
      );
    });
  });

  describe('getProfile', () => {
    it('returns user entity', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      const user = await service.getProfile('u1');
      expect(user.email).toBe('user@example.com');
    });

    it('throws when user missing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getProfile('missing')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('changePassword', () => {
    it('rejects OAuth accounts without password', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...baseUser, password: null });
      await expect(
        service.changePassword('u1', {
          currentPassword: 'x',
          newPassword: 'Newpass1',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects incorrect current password', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(
        service.changePassword('u1', {
          currentPassword: 'wrong',
          newPassword: 'Newpass1',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('updates password when current is valid', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      prisma.user.update.mockResolvedValue(baseUser);

      await service.changePassword('u1', {
        currentPassword: 'old',
        newPassword: 'Newpass1',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { password: 'new-hash' },
      });
    });
  });

  describe('forgotPassword', () => {
    it('does nothing when email not found (no leak)', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      await service.forgotPassword({ email: 'missing@x.com' });
      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
      expect(emailService.sendResetPasswordEmail).not.toHaveBeenCalled();
    });

    it('creates token and sends email when user exists', async () => {
      prisma.user.findFirst.mockResolvedValue(baseUser);
      prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
      prisma.passwordResetToken.create.mockResolvedValue({});

      await service.forgotPassword({ email: 'user@example.com' });

      expect(prisma.passwordResetToken.create).toHaveBeenCalled();
      expect(emailService.sendResetPasswordEmail).toHaveBeenCalledWith(
        'user@example.com',
        'User',
        expect.stringContaining('/reset-password?token='),
      );
    });
  });

  describe('resetPassword', () => {
    it('throws on missing/expired/used token', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue(null);
      await expect(
        service.resetPassword({ token: 'x', newPassword: 'Newpass1' }),
      ).rejects.toBeInstanceOf(BadRequestException);

      prisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 't1',
        userId: 'u1',
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
        user: baseUser,
      });
      await expect(
        service.resetPassword({ token: 'x', newPassword: 'Newpass1' }),
      ).rejects.toBeInstanceOf(BadRequestException);

      prisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 't1',
        userId: 'u1',
        usedAt: null,
        expiresAt: new Date(Date.now() - 1000),
        user: baseUser,
      });
      await expect(
        service.resetPassword({ token: 'x', newPassword: 'Newpass1' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('updates password and marks token used', async () => {
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 't1',
        userId: 'u1',
        usedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        user: baseUser,
      });
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      prisma.user.update.mockResolvedValue(baseUser);
      prisma.passwordResetToken.update.mockResolvedValue({});

      await service.resetPassword({ token: 'valid', newPassword: 'Newpass1' });

      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('googleLogin', () => {
    it('creates new Google user', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        ...baseUser,
        provider: 'GOOGLE',
        googleId: 'g1',
        password: null,
      });

      const result = await service.googleLogin({
        googleId: 'g1',
        email: 'user@example.com',
        name: 'User',
        avatar: null,
      });

      expect(prisma.user.create).toHaveBeenCalled();
      expect(result.token).toBe('jwt-token');
    });

    it('links googleId to existing email account', async () => {
      prisma.user.findFirst.mockResolvedValue({ ...baseUser, googleId: null });
      prisma.user.update.mockResolvedValue({
        ...baseUser,
        googleId: 'g1',
        provider: 'GOOGLE',
      });

      await service.googleLogin({
        googleId: 'g1',
        email: 'user@example.com',
        name: 'User',
        avatar: null,
      });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ googleId: 'g1', provider: 'GOOGLE' }),
        }),
      );
    });

    it('rejects deactivated accounts', async () => {
      prisma.user.findFirst.mockResolvedValue({
        ...baseUser,
        googleId: 'g1',
        isActive: false,
      });
      await expect(
        service.googleLogin({
          googleId: 'g1',
          email: 'user@example.com',
          name: 'User',
          avatar: null,
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
