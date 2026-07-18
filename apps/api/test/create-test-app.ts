/**
 * Nest e2e harness: boots AppModule with mocked Prisma + Email,
 * same global pipes/filters/interceptors as main.ts (minus Swagger).
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'e2e-jwt-secret-key-32chars!!';
process.env.JWT_EXPIRES_IN = '1d';
process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'e2e-google-client';
process.env.GOOGLE_CLIENT_SECRET =
  process.env.GOOGLE_CLIENT_SECRET || 'e2e-google-secret';
process.env.GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback';
process.env.SEPAY_WEBHOOK_SECRET =
  process.env.SEPAY_WEBHOOK_SECRET || 'e2e-sepay-secret';
process.env.SEPAY_BANK_ACCOUNT =
  process.env.SEPAY_BANK_ACCOUNT || '0123456789';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
process.env.SMTP_HOST = 'localhost';
process.env.SMTP_USER = 'test';
process.env.SMTP_PASS = 'test';

import {
  INestApplication,
  ValidationPipe,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { EmailService } from '../src/common/services/email.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import {
  createPrismaMock,
  PrismaMock,
} from '../src/test-utils/prisma-mock';

export type CreateTestAppOptions = {
  /**
   * Default false: skip the global ThrottlerGuard so suites that do many
   * logins from the same supertest IP don't exhaust the 5/15min budget and
   * block their own subsequent calls. The dedicated throttling test opts
   * in with `{ withThrottle: true }` to exercise the real guard.
   *
   * `NODE_ENV=test` causes AppModule to omit the APP_GUARD provider for
   * ThrottlerGuard (see app.module.ts); when this option is true we add it
   * back so the suite exercises the production-grade behaviour.
   */
  withThrottle?: boolean;
};

export type E2EContext = {
  app: INestApplication;
  prisma: PrismaMock;
  email: {
    sendResetPasswordEmail: jest.Mock;
    sendOrderConfirmation: jest.Mock;
    sendDeliveryConfirmation: jest.Mock;
  };
  module: TestingModule;
};

export async function createTestApp(
  options: CreateTestAppOptions = {},
): Promise<E2EContext> {
  const prisma = createPrismaMock();
  // JwtStrategy / PrismaService lifecycle — no real DB
  (prisma as unknown as { $connect: jest.Mock }).$connect = jest
    .fn()
    .mockResolvedValue(undefined);
  (prisma as unknown as { $disconnect: jest.Mock }).$disconnect = jest
    .fn()
    .mockResolvedValue(undefined);

  const email = {
    sendResetPasswordEmail: jest.fn().mockResolvedValue(undefined),
    sendOrderConfirmation: jest.fn().mockResolvedValue(undefined),
    sendDeliveryConfirmation: jest.fn().mockResolvedValue(undefined),
  };

  let testingModuleBuilder = Test.createTestingModule({
    imports: [AppModule],
    providers: options.withThrottle
      ? // AppModule skips ThrottlerGuard in NODE_ENV=test so multi-login
        // suites aren't blocked by the spec-mandated 5/15min budget. The
        // throttle suite re-registers the guard via APP_GUARD so it
        // exercises the production behaviour.
        [{ provide: APP_GUARD, useClass: ThrottlerGuard }]
      : [],
  })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .overrideProvider(EmailService)
    .useValue(email);

  const module = await testingModuleBuilder.compile();

  const app = module.createNestApplication();
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new TransformInterceptor(),
  );
  await app.init();

  return { app, prisma, email, module };
}

export function cookieFrom(res: { headers: Record<string, unknown> }): string[] {
  const raw = res.headers['set-cookie'];
  if (!raw) return [];
  return Array.isArray(raw) ? (raw as string[]) : [raw as string];
}

export function baseUser(overrides: Record<string, unknown> = {}) {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'user@example.com',
    password: null as string | null,
    name: 'Test User',
    phone: null,
    avatar: null,
    role: 'CUSTOMER',
    provider: 'LOCAL',
    isActive: true,
    googleId: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    tokenVersion: 0,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
