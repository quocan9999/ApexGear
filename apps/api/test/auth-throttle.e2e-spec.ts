/**
 * Verifies the login endpoint enforces the spec-mandated rate limit:
 *   5 attempts per 15 minutes per IP, returns 429 Too Many Requests.
 *
 * Spec §4.2: "Rate limiting: 5 attempts / 15 minutes per IP".
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

  it('POST /api/auth/login returns 429 after 5 failed attempts within 15 minutes', async () => {
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

    // 6th attempt — must be throttled by IP, regardless of credentials.
    const blocked = await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: user.email, password: 'wrong-password' });

    expect(blocked.status).toBe(429);
  });
});
