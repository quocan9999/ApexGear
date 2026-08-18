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
import { MailDeliveryError } from '../../common/errors/mail-delivery.error';
import { createPrismaMock } from '../../test-utils/prisma-mock';
import { Role } from '../../common/enums';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let jwtService: { sign: jest.Mock };
  let emailService: {
    sendResetPasswordEmail: jest.Mock;
    sendEmailVerificationEmail: jest.Mock;
  };
  let configService: { get: jest.Mock };
  let loginFailureThrottle: { recordFailedAttempt: jest.Mock };

  const baseUser = {
    id: 'u1',
    email: 'user@example.com',
    password: 'hashed',
    name: 'User',
    phone: null,
    avatar: null,
    role: Role.CUSTOMER,
    provider: 'LOCAL',
    emailVerifiedAt: new Date(),
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
    emailService = {
      sendResetPasswordEmail: jest.fn().mockResolvedValue(undefined),
      sendEmailVerificationEmail: jest.fn().mockResolvedValue(undefined),
    };
    configService = {
      get: jest.fn(
        (_key: string, def?: string) => def ?? 'http://localhost:5173',
      ),
    };
    loginFailureThrottle = {
      recordFailedAttempt: jest.fn().mockResolvedValue(undefined),
    };

    service = new AuthService(
      prisma as never,
      jwtService as unknown as JwtService,
      emailService as unknown as EmailService,
      configService as unknown as ConfigService,
      loginFailureThrottle as never,
    );
  });

  describe('register', () => {
    it('registers an unverified local user and sends verification email (no JWT returned)', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      prisma.user.create.mockResolvedValue({
        ...baseUser,
        password: 'hashed-pw',
        emailVerifiedAt: null,
      });
      prisma.emailVerificationToken.updateMany.mockResolvedValue({ count: 0 });
      prisma.emailVerificationToken.create.mockResolvedValue({ id: 't1' });

      const result = await service.register({
        email: 'user@example.com',
        password: 'Password1',
        name: 'User',
      });

      expect(result).toBeUndefined();
      expect(jwtService.sign).not.toHaveBeenCalled();
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'user@example.com',
            password: 'hashed-pw',
            name: 'User',
            emailVerifiedAt: null,
          }),
        }),
      );
      expect(prisma.emailVerificationToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'u1',
            token: expect.any(String),
            expiresAt: expect.any(Date),
          }),
        }),
      );
      expect(prisma.emailVerificationToken.updateMany).not.toHaveBeenCalled();
      expect(emailService.sendEmailVerificationEmail).toHaveBeenCalledWith(
        'user@example.com',
        'User',
        expect.stringContaining('/verify-email?token='),
      );
      expect(emailService.sendEmailVerificationEmail).toHaveBeenCalledWith(
        'user@example.com',
        'User',
        expect.stringContaining('/verify-email?token='),
      );
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

    it('throws BadRequestException when verification email fails to send', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      prisma.user.create.mockResolvedValue({
        ...baseUser,
        password: 'hashed-pw',
        emailVerifiedAt: null,
      });
      prisma.emailVerificationToken.create.mockResolvedValue({ id: 't1' });
      emailService.sendEmailVerificationEmail.mockRejectedValueOnce(
        new MailDeliveryError(
          'Failed',
          'email-verification',
          'user@example.com',
        ),
      );

      await expect(
        service.register({
          email: 'user@example.com',
          password: 'Password1',
          name: 'User',
        }),
      ).rejects.toThrow(
        new BadRequestException(
          'Không thể gửi email xác minh. Vui lòng thử lại sau.',
        ),
      );
      expect(prisma.emailVerificationToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'u1',
            token: expect.any(String),
            expiresAt: expect.any(Date),
          }),
        }),
      );
      expect(prisma.emailVerificationToken.updateMany).not.toHaveBeenCalled();
    });

    it('rethrows unexpected verification send errors instead of converting them to mail-delivery errors', async () => {
      const unexpectedError = new Error('template rendering failed');
      prisma.user.findFirst.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      prisma.user.create.mockResolvedValue({
        ...baseUser,
        password: 'hashed-pw',
        emailVerifiedAt: null,
      });
      prisma.emailVerificationToken.create.mockResolvedValue({ id: 't1' });
      emailService.sendEmailVerificationEmail.mockRejectedValueOnce(unexpectedError);

      await expect(
        service.register({
          email: 'user@example.com',
          password: 'Password1',
          name: 'User',
        }),
      ).rejects.toBe(unexpectedError);
    });
  });

  describe('verifyEmail', () => {
    it('verifies an email token and marks the user verified', async () => {
      prisma.emailVerificationToken.findUnique.mockResolvedValue({
        id: 't1',
        token: 'token-1',
        userId: 'u1',
        usedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        user: { ...baseUser, emailVerifiedAt: null },
      });
      prisma.user.update.mockResolvedValue({
        ...baseUser,
        emailVerifiedAt: new Date(),
      });
      prisma.emailVerificationToken.updateMany.mockResolvedValue({ count: 1 });

      await service.verifyEmail({ token: 'token-1' });

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.emailVerificationToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 't1',
            usedAt: null,
          }),
          data: { usedAt: expect.any(Date) },
        }),
      );
      expect(prisma.emailVerificationToken.update).not.toHaveBeenCalled();
    });

    it('rejects when the verification token was consumed concurrently', async () => {
      prisma.emailVerificationToken.findUnique.mockResolvedValue({
        id: 't1',
        token: 'token-1',
        userId: 'u1',
        usedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        user: { ...baseUser, emailVerifiedAt: null },
      });
      prisma.emailVerificationToken.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.verifyEmail({ token: 'token-1' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects missing token', async () => {
      prisma.emailVerificationToken.findUnique.mockResolvedValue(null);
      await expect(
        service.verifyEmail({ token: 'invalid-token' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('treats an already-used token for an already-verified user as success', async () => {
      prisma.emailVerificationToken.findUnique.mockResolvedValue({
        id: 't1',
        token: 'used-token',
        userId: 'u1',
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
        user: baseUser,
      });

      await expect(
        service.verifyEmail({ token: 'used-token' }),
      ).resolves.toBeUndefined();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects already used token when the user is still unverified', async () => {
      prisma.emailVerificationToken.findUnique.mockResolvedValue({
        id: 't1',
        token: 'used-token',
        userId: 'u1',
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
        user: { ...baseUser, emailVerifiedAt: null },
      });
      await expect(
        service.verifyEmail({ token: 'used-token' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects expired token', async () => {
      prisma.emailVerificationToken.findUnique.mockResolvedValue({
        id: 't1',
        token: 'expired-token',
        userId: 'u1',
        usedAt: null,
        expiresAt: new Date(Date.now() - 1000),
        user: baseUser,
      });
      await expect(
        service.verifyEmail({ token: 'expired-token' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects token for deleted user', async () => {
      prisma.emailVerificationToken.findUnique.mockResolvedValue({
        id: 't1',
        token: 'token-deleted-user',
        userId: 'u1',
        usedAt: null,
        expiresAt: new Date(Date.now() + 60_000),
        user: { ...baseUser, deletedAt: new Date() },
      });
      await expect(
        service.verifyEmail({ token: 'token-deleted-user' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('resendVerification', () => {
    it('creates a new verification token on resend for an unverified user', async () => {
      prisma.user.findFirst.mockResolvedValue({
        ...baseUser,
        emailVerifiedAt: null,
      });
      prisma.emailVerificationToken.create.mockResolvedValue({ id: 't2' });
      prisma.emailVerificationToken.updateMany.mockResolvedValue({ count: 1 });

      await service.resendVerification({ email: 'user@example.com' });

      expect(prisma.emailVerificationToken.create).toHaveBeenCalled();
      expect(emailService.sendEmailVerificationEmail).toHaveBeenCalledWith(
        'user@example.com',
        'User',
        expect.stringContaining('/verify-email?token='),
      );
      expect(prisma.emailVerificationToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u1', usedAt: null, NOT: { id: 't2' } },
        data: { usedAt: expect.any(Date) },
      });
      expect(
        prisma.emailVerificationToken.updateMany.mock.invocationCallOrder[0],
      ).toBeGreaterThan(
        emailService.sendEmailVerificationEmail.mock.invocationCallOrder[0],
      );
    });

    it('keeps existing verification tokens active when resend delivery fails', async () => {
      prisma.user.findFirst.mockResolvedValue({
        ...baseUser,
        emailVerifiedAt: null,
      });
      prisma.emailVerificationToken.create.mockResolvedValue({ id: 't2' });
      emailService.sendEmailVerificationEmail.mockRejectedValueOnce(
        new MailDeliveryError(
          'Failed',
          'email-verification',
          'user@example.com',
        ),
      );

      await expect(
        service.resendVerification({ email: 'user@example.com' }),
      ).rejects.toThrow(
        new BadRequestException(
          'Không thể gửi email xác minh. Vui lòng thử lại sau.',
        ),
      );
      expect(prisma.emailVerificationToken.updateMany).not.toHaveBeenCalled();
    });

    it('silently ignores non-existent user', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      await service.resendVerification({ email: 'unknown@example.com' });
      expect(prisma.emailVerificationToken.create).not.toHaveBeenCalled();
      expect(emailService.sendEmailVerificationEmail).not.toHaveBeenCalled();
    });

    it('silently ignores already verified user', async () => {
      prisma.user.findFirst.mockResolvedValue(baseUser);
      await service.resendVerification({ email: 'user@example.com' });
      expect(prisma.emailVerificationToken.create).not.toHaveBeenCalled();
      expect(emailService.sendEmailVerificationEmail).not.toHaveBeenCalled();
    });

    it('silently ignores OAuth Google user', async () => {
      prisma.user.findFirst.mockResolvedValue({
        ...baseUser,
        provider: 'GOOGLE',
        emailVerifiedAt: null,
      });
      await service.resendVerification({ email: 'user@example.com' });
      expect(prisma.emailVerificationToken.create).not.toHaveBeenCalled();
      expect(emailService.sendEmailVerificationEmail).not.toHaveBeenCalled();
    });

    it('rethrows unexpected resend email errors', async () => {
      const unexpectedError = new Error('template rendering failed');
      prisma.user.findFirst.mockResolvedValue({
        ...baseUser,
        emailVerifiedAt: null,
      });
      prisma.emailVerificationToken.create.mockResolvedValue({ id: 't2' });
      emailService.sendEmailVerificationEmail.mockRejectedValueOnce(unexpectedError);

      await expect(
        service.resendVerification({ email: 'user@example.com' }),
      ).rejects.toBe(unexpectedError);
    });
  });

  describe('login', () => {
    it('returns user and token on valid credentials for verified user', async () => {
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
      expect(loginFailureThrottle.recordFailedAttempt).not.toHaveBeenCalled();
    });

    it('rejects login for an unverified local user', async () => {
      prisma.user.findFirst.mockResolvedValue({
        ...baseUser,
        emailVerifiedAt: null,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.login({ email: 'user@example.com', password: 'Password1' }),
      ).rejects.toThrow(
        new BadRequestException('Vui lòng xác minh email trước khi đăng nhập'),
      );
    });

    it('throws UnauthorizedException for unknown email', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      await expect(
        service.login({ email: 'x@y.com', password: 'x' }, '127.0.0.1'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(loginFailureThrottle.recordFailedAttempt).toHaveBeenCalledWith(
        '127.0.0.1',
      );
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
      prisma.user.findFirst.mockResolvedValue({
        ...baseUser,
        isActive: false,
      });
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
        service.login(
          { email: 'user@example.com', password: 'wrong' },
          '127.0.0.1',
        ),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(loginFailureThrottle.recordFailedAttempt).toHaveBeenCalledWith(
        '127.0.0.1',
      );
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

      await service.login({
        email: 'user@example.com',
        password: 'Password1',
      });

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
      prisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        password: null,
      });
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

    it('creates a reset token and throws when reset-email delivery fails in dev', async () => {
      prisma.user.findFirst.mockResolvedValue(baseUser);
      prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
      prisma.passwordResetToken.create.mockResolvedValue({ id: 'r1' });
      emailService.sendResetPasswordEmail.mockRejectedValueOnce(
        new MailDeliveryError(
          'Failed',
          'reset-password',
          'user@example.com',
        ),
      );

      await expect(
        service.forgotPassword({ email: 'user@example.com' }),
      ).rejects.toThrow(
        new BadRequestException(
          'Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.',
        ),
      );
    });

    it('rethrows unexpected reset email errors instead of treating them as delivery failures', async () => {
      const unexpectedError = new Error('template rendering failed');
      prisma.user.findFirst.mockResolvedValue(baseUser);
      prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
      prisma.passwordResetToken.create.mockResolvedValue({ id: 'r1' });
      emailService.sendResetPasswordEmail.mockRejectedValueOnce(unexpectedError);

      await expect(
        service.forgotPassword({ email: 'user@example.com' }),
      ).rejects.toBe(unexpectedError);
    });

    it('swallows delivery failures in production for forgot-password anti-enumeration', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        prisma.user.findFirst.mockResolvedValue(baseUser);
        prisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
        prisma.passwordResetToken.create.mockResolvedValue({ id: 'r1' });
        emailService.sendResetPasswordEmail.mockRejectedValueOnce(
          new MailDeliveryError(
            'Failed',
            'reset-password',
            'user@example.com',
          ),
        );

        await expect(
          service.forgotPassword({ email: 'user@example.com' }),
        ).resolves.toBeUndefined();
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
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
    it('sets google users as verified when creating new user', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        ...baseUser,
        provider: 'GOOGLE',
        googleId: 'g1',
        emailVerifiedAt: new Date(),
        password: null,
      });

      const result = await service.googleLogin({
        googleId: 'g1',
        email: 'user@example.com',
        name: 'User',
        avatar: null,
      });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            emailVerifiedAt: expect.any(Date),
          }),
        }),
      );
      expect(result.token).toBe('jwt-token');
    });

    it('links googleId to existing email account and sets emailVerifiedAt if needed', async () => {
      prisma.user.findFirst.mockResolvedValue({
        ...baseUser,
        googleId: null,
        emailVerifiedAt: null,
      });
      prisma.user.update.mockResolvedValue({
        ...baseUser,
        googleId: 'g1',
        provider: 'GOOGLE',
        emailVerifiedAt: new Date(),
      });

      await service.googleLogin({
        googleId: 'g1',
        email: 'user@example.com',
        name: 'User',
        avatar: null,
      });

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            googleId: 'g1',
            provider: 'GOOGLE',
            emailVerifiedAt: expect.any(Date),
          }),
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
