import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  HttpException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../common/services/email.service';
import { MailDeliveryError } from '../../common/errors/mail-delivery.error';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { UserEntity } from './entities/user.entity';
import { LoginFailureThrottleService } from './services/login-failure-throttle.service';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private configService: ConfigService,
    private loginFailureThrottle: LoginFailureThrottleService,
  ) {}

  private getFrontendUrl(): string {
    return this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5173',
    );
  }

  private async createVerificationToken(userId: string): Promise<string> {
    const token = randomUUID();
    await this.prisma.emailVerificationToken.create({
      data: {
        token,
        userId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return token;
  }

  private async invalidateOtherVerificationTokens(
    userId: string,
    tokenId: string,
    usedAt: Date,
  ): Promise<void> {
    await this.prisma.emailVerificationToken.updateMany({
      where: { userId, usedAt: null, NOT: { id: tokenId } },
      data: { usedAt },
    });
  }

  async register(dto: RegisterDto): Promise<void> {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        emailVerifiedAt: null,
      },
    });

    const token = await this.createVerificationToken(user.id);
    const verificationUrl = `${this.getFrontendUrl()}/verify-email?token=${token}`;

    try {
      await this.emailService.sendEmailVerificationEmail(
        user.email,
        user.name,
        verificationUrl,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send email verification to ${user.email}`,
        error,
      );
      if (error instanceof MailDeliveryError) {
        throw new BadRequestException(
          'Không thể gửi email xác minh. Vui lòng thử lại sau.',
        );
      }
      throw error;
    }
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<void> {
    const verificationToken =
      await this.prisma.emailVerificationToken.findUnique({
        where: { token: dto.token },
        include: { user: true },
      });

    if (
      !verificationToken ||
      verificationToken.expiresAt < new Date() ||
      !verificationToken.user ||
      verificationToken.user.deletedAt
    ) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (verificationToken.usedAt) {
      if (verificationToken.user.emailVerifiedAt) return;
      throw new BadRequestException('Invalid or expired verification token');
    }

    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      const consumeResult = await tx.emailVerificationToken.updateMany({
        where: { id: verificationToken.id, usedAt: null },
        data: { usedAt: now },
      });
      if (consumeResult.count !== 1) {
        const refreshedToken = await tx.emailVerificationToken.findUnique({
          where: { id: verificationToken.id },
          include: { user: true },
        });
        if (refreshedToken?.user?.emailVerifiedAt) return;
        throw new BadRequestException('Invalid or expired verification token');
      }

      await tx.user.update({
        where: { id: verificationToken.userId },
        data: {
          emailVerifiedAt: verificationToken.user.emailVerifiedAt ?? now,
        },
      });
      await tx.emailVerificationToken.updateMany({
        where: {
          userId: verificationToken.userId,
          usedAt: null,
          NOT: { id: verificationToken.id },
        },
        data: { usedAt: now },
      });
    });
  }

  async resendVerification(dto: ResendVerificationDto): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });
    if (!user || user.emailVerifiedAt || user.provider !== 'LOCAL') return;

    const token = randomUUID();
    const createdToken = await this.prisma.emailVerificationToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    const verificationUrl = `${this.getFrontendUrl()}/verify-email?token=${token}`;

    try {
      await this.emailService.sendEmailVerificationEmail(
        user.email,
        user.name,
        verificationUrl,
      );
    } catch (error) {
      this.logger.error(
        `Failed to resend verification email to ${user.email}`,
        error,
      );
      if (error instanceof MailDeliveryError) {
        if (process.env.NODE_ENV !== 'production') {
          throw new BadRequestException(
            'Không thể gửi email xác minh. Vui lòng thử lại sau.',
          );
        }
        return;
      }
      throw error;
    }

    await this.invalidateOtherVerificationTokens(
      user.id,
      createdToken.id,
      new Date(),
    );
  }

  async login(
    dto: LoginDto,
    ip = 'unknown',
  ): Promise<{ user: UserEntity; token: string }> {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });

    if (!user || !user.password) {
      await this.loginFailureThrottle.recordFailedAttempt(ip);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const retryAfter = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 1000,
      );
      throw new HttpException(
        { message: 'Account is locked', retry_after: retryAfter },
        423, // Locked
      );
    }

    // Check if account is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      // Increment failed login attempts
      const attempts = user.failedLoginAttempts + 1;
      const updateData: {
        failedLoginAttempts: number;
        lockedUntil?: Date;
      } = { failedLoginAttempts: attempts };
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        updateData.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      }
      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      await this.loginFailureThrottle.recordFailedAttempt(ip);

      const remaining = MAX_LOGIN_ATTEMPTS - attempts;
      throw new UnauthorizedException({
        message: 'Invalid credentials',
        remaining_attempts: Math.max(remaining, 0),
      });
    }

    // Block local users where email is not verified
    if (user.provider === 'LOCAL' && !user.emailVerifiedAt) {
      throw new BadRequestException(
        'Vui lòng xác minh email trước khi đăng nhập',
      );
    }

    // Reset failed attempts on successful login
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    const token = this.generateToken(user);
    return { user: new UserEntity(user), token };
  }

  async getProfile(userId: string): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return new UserEntity(user);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserEntity> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
    });
    return new UserEntity(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || !user.password) {
      throw new BadRequestException(
        'Cannot change password for OAuth accounts',
      );
    }

    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });
    // Always return success (don't reveal if email exists)
    if (!user) return;

    // Invalidate old tokens
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = randomUUID();
    await this.prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    const resetUrl = `${this.getFrontendUrl()}/reset-password?token=${token}`;
    try {
      await this.emailService.sendResetPasswordEmail(
        user.email,
        user.name,
        resetUrl,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send reset password email to ${user.email}`,
        error,
      );
      if (error instanceof MailDeliveryError) {
        if (process.env.NODE_ENV !== 'production') {
          throw new BadRequestException(
            'Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.',
          );
        }
        return;
      }
      throw error;
    }
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token: dto.token },
      include: { user: true },
    });

    if (
      !resetToken ||
      resetToken.usedAt ||
      resetToken.expiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);
  }

  async googleLogin(googleUser: {
    googleId: string;
    email: string;
    name: string;
    avatar: string | null;
  }): Promise<{ user: UserEntity; token: string }> {
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { googleId: googleUser.googleId },
          { email: googleUser.email, deletedAt: null },
        ],
      },
    });

    if (user) {
      if (!user.googleId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: googleUser.googleId,
            provider: 'GOOGLE',
            avatar: user.avatar || googleUser.avatar,
            emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
          },
        });
      }
    } else {
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          name: googleUser.name,
          googleId: googleUser.googleId,
          avatar: googleUser.avatar,
          provider: 'GOOGLE',
          emailVerifiedAt: new Date(),
        },
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const token = this.generateToken(user);
    return { user: new UserEntity(user), token };
  }

  private generateToken(user: {
    id: string;
    email: string;
    role: string;
  }): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }
}
