/**
 * Verifies the login endpoint enforces the spec-mandated rate limit:
 *   5 incorrect attempts per 20 minutes per IP, returns 429 Too Many Requests.
 *
 * Spec §4.2: "Rate limiting: 5 attempts / 15 minutes per IP".
 * Product decision (2026-07-18): count incorrect credentials only and block
 * failed attempts for 20 minutes.
 *
 * Lives in a separate file from auth.e2e-spec.ts so it gets a fresh
 * AppModule + fresh in-memory throttler storage.
 */
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { createTestApp, E2EContext, baseUser } from './create-test-app';

describe('Auth login throttling (e2e)', () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    // Opt in to the real ThrottlerGuard so this suite exercises the
    // production-grade 5/15min/IP behaviour.
    ctx = await createTestApp({ withThrottle: true });
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/auth/login throttles only incorrect attempts from the same IP', async () => {
    const user = baseUser({
      password: await bcrypt.hash('correct-password', 4), // cheap hash for test
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
    ctx.prisma.user.findFirst.mockResolvedValue(user);
    ctx.prisma.user.update.mockResolvedValue(user);

    // 5 failed attempts — each must return 401 (Invalid credentials).
    for (let i = 0; i < 5; i++) {
      const res = await request(ctx.app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: user.email, password: 'wrong-password' });
      expect(res.status).toBe(401);
    }

    // Correct credentials are not counted as failed attempts and must still log in.
    const allowed = await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: user.email, password: 'correct-password' });
    expect(allowed.status).toBe(200);

    // The next incorrect attempt is throttled by IP.
    const blocked = await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: user.email, password: 'wrong-password' });

    expect(blocked.status).toBe(429);
    expect(blocked.body.error.message).toBe('Too many failed login attempts');
  });
});
