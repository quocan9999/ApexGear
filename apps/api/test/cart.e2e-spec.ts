import request from 'supertest';
import * as bcrypt from 'bcrypt';
import {
  createTestApp,
  cookieFrom,
  baseUser,
  E2EContext,
} from './create-test-app';

describe('Cart (e2e)', () => {
  let ctx: E2EContext;
  let cookies: string[];
  const userId = '33333333-3333-4333-8333-333333333333';
  const variantId = '44444444-4444-4444-8444-444444444444';
  let user: ReturnType<typeof baseUser>;

  beforeAll(async () => {
    ctx = await createTestApp();
    const hash = await bcrypt.hash('Password123', 10);
    user = baseUser({ id: userId, password: hash });
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

  beforeEach(() => {
    // Keep auth user resolvable for JwtStrategy between cases
    ctx.prisma.user.findUnique.mockResolvedValue(user);
  });

  it('GET /api/cart requires auth', async () => {
    await request(ctx.app.getHttpServer()).get('/api/cart').expect(401);
  });

  it('GET /api/cart returns cart for user', async () => {
    ctx.prisma.cart.findUnique.mockResolvedValue({
      id: 'cart1',
      userId,
      items: [],
    });

    const res = await request(ctx.app.getHttpServer())
      .get('/api/cart')
      .set('Cookie', cookies)
      .expect(200);

    expect(res.body.data.userId).toBe(userId);
  });

  it('POST /api/cart/items validates UUID variantId', async () => {
    await request(ctx.app.getHttpServer())
      .post('/api/cart/items')
      .set('Cookie', cookies)
      .send({ variantId: 'not-uuid', quantity: 1 })
      .expect(400);
  });

  it('POST /api/cart/items adds item when stock ok', async () => {
    ctx.prisma.productVariant.findFirst.mockResolvedValue({
      id: variantId,
      name: 'Black',
      stockAvailable: 5,
      isActive: true,
      deletedAt: null,
    });
    // getOrCreateCart + getCart both call cart.findUnique
    ctx.prisma.cart.findUnique.mockResolvedValue({
      id: 'cart1',
      userId,
      items: [{ id: 'i1', variantId, quantity: 1 }],
    });
    ctx.prisma.cartItem.findUnique.mockResolvedValue(null);
    ctx.prisma.cartItem.create.mockResolvedValue({});

    const res = await request(ctx.app.getHttpServer())
      .post('/api/cart/items')
      .set('Cookie', cookies)
      .send({ variantId, quantity: 1 })
      .expect(201);

    expect(ctx.prisma.cartItem.create).toHaveBeenCalled();
    expect(res.body.data.items).toHaveLength(1);
  });
});
