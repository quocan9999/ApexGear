import request from 'supertest';
import * as bcrypt from 'bcrypt';
import {
  createTestApp,
  cookieFrom,
  baseUser,
  E2EContext,
} from './create-test-app';

describe('Coupons (e2e)', () => {
  let ctx: E2EContext;
  let cookies: string[];

  beforeAll(async () => {
    ctx = await createTestApp();
    const hash = await bcrypt.hash('Password123', 10);
    const user = baseUser({ password: hash });
    ctx.prisma.user.findFirst.mockResolvedValue(user);
    ctx.prisma.user.findUnique.mockResolvedValue(user);
    const login = await request(ctx.app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: user.email, password: 'Password123' });
    cookies = cookieFrom(login);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('POST /api/coupons/validate requires auth', async () => {
    await request(ctx.app.getHttpServer())
      .post('/api/coupons/validate')
      .send({ code: 'WELCOME10', subtotal: 500000 })
      .expect(401);
  });

  it('POST /api/coupons/validate returns discount for valid coupon', async () => {
    ctx.prisma.coupon.findUnique.mockResolvedValue({
      id: 'cp1',
      code: 'WELCOME10',
      type: 'PERCENTAGE',
      value: 10,
      description: 'Welcome',
      minOrderValue: null,
      maxDiscount: 50000,
      maxUses: null,
      usedCount: 0,
      startsAt: null,
      expiresAt: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(ctx.app.getHttpServer())
      .post('/api/coupons/validate')
      .set('Cookie', cookies)
      .send({ code: 'welcome10', subtotal: 1_000_000 })
      .expect(201);

    expect(res.body.data).toEqual(
      expect.objectContaining({
        valid: true,
        discount: 50000,
        code: 'WELCOME10',
      }),
    );
  });
});
