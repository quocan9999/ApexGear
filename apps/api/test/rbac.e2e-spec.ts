import request from 'supertest';
import * as bcrypt from 'bcrypt';
import {
  createTestApp,
  cookieFrom,
  baseUser,
  E2EContext,
} from './create-test-app';

async function loginAs(
  ctx: E2EContext,
  role: string,
  id = '22222222-2222-2222-2222-222222222222',
) {
  const hash = await bcrypt.hash('Password123', 10);
  const user = baseUser({ id, role, password: hash, email: `${role.toLowerCase()}@example.com` });
  ctx.prisma.user.findFirst.mockResolvedValue(user);
  ctx.prisma.user.findUnique.mockResolvedValue(user);

  const res = await request(ctx.app.getHttpServer())
    .post('/api/auth/login')
    .send({ email: user.email, password: 'Password123' });
  return { user, cookies: cookieFrom(res) };
}

describe('RBAC (e2e)', () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('POST /api/categories requires staff role', async () => {
    await request(ctx.app.getHttpServer())
      .post('/api/categories')
      .send({ name: 'New Cat' })
      .expect(401);

    const customer = await loginAs(ctx, 'CUSTOMER');
    await request(ctx.app.getHttpServer())
      .post('/api/categories')
      .set('Cookie', customer.cookies)
      .send({ name: 'New Cat' })
      .expect(403);
  });

  it('POST /api/categories allowed for ADMIN', async () => {
    const admin = await loginAs(ctx, 'ADMIN');
    ctx.prisma.category.findFirst.mockResolvedValue(null);
    ctx.prisma.category.create.mockResolvedValue({
      id: 'c1',
      name: 'New Cat',
      slug: 'new-cat',
    });

    const res = await request(ctx.app.getHttpServer())
      .post('/api/categories')
      .set('Cookie', admin.cookies)
      .send({ name: 'New Cat' })
      .expect(201);

    expect(res.body.data.slug).toBe('new-cat');
  });

  it('GET /api/settings requires ADMIN', async () => {
    const customer = await loginAs(ctx, 'CUSTOMER');
    await request(ctx.app.getHttpServer())
      .get('/api/settings')
      .set('Cookie', customer.cookies)
      .expect(403);

    const admin = await loginAs(ctx, 'ADMIN');
    ctx.prisma.setting.findMany.mockResolvedValue([
      { key: 'shipping_fee', value: '30000' },
    ]);
    const res = await request(ctx.app.getHttpServer())
      .get('/api/settings')
      .set('Cookie', admin.cookies)
      .expect(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('GET /api/dashboard/stats requires staff', async () => {
    const customer = await loginAs(ctx, 'CUSTOMER');
    await request(ctx.app.getHttpServer())
      .get('/api/dashboard/stats')
      .set('Cookie', customer.cookies)
      .expect(403);

    const admin = await loginAs(ctx, 'ADMIN');
    ctx.prisma.order.count.mockResolvedValue(0);
    ctx.prisma.order.aggregate.mockResolvedValue({ _sum: { total: null } });
    ctx.prisma.product.count.mockResolvedValue(0);
    ctx.prisma.user.count.mockResolvedValue(0);
    ctx.prisma.productVariant.findMany.mockResolvedValue([]);

    const res = await request(ctx.app.getHttpServer())
      .get('/api/dashboard/stats')
      .set('Cookie', admin.cookies)
      .expect(200);

    expect(res.body.data).toEqual(
      expect.objectContaining({
        totalOrders: 0,
        totalRevenue: 0,
      }),
    );
  });
});
