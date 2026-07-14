import request from 'supertest';
import { createTestApp, E2EContext } from './create-test-app';

describe('Catalog public routes (e2e)', () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('GET /api/categories is public', async () => {
    ctx.prisma.category.findMany.mockResolvedValue([
      {
        id: 'c1',
        name: 'Tai nghe',
        slug: 'tai-nghe',
        children: [],
      },
    ]);

    const res = await request(ctx.app.getHttpServer())
      .get('/api/categories')
      .expect(200);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].slug).toBe('tai-nghe');
  });

  it('GET /api/categories/:slug 404 when missing', async () => {
    ctx.prisma.category.findFirst.mockResolvedValue(null);
    await request(ctx.app.getHttpServer())
      .get('/api/categories/missing')
      .expect(404);
  });

  it('GET /api/brands is public and paginated', async () => {
    ctx.prisma.brand.findMany.mockResolvedValue([
      { id: 'b1', name: 'Sony', slug: 'sony' },
    ]);
    ctx.prisma.brand.count.mockResolvedValue(1);

    const res = await request(ctx.app.getHttpServer())
      .get('/api/brands')
      .expect(200);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toEqual(
      expect.objectContaining({
        page: 1,
        total: 1,
        timestamp: expect.any(String),
      }),
    );
  });

  it('GET /api/products is public and hides stock numbers', async () => {
    ctx.prisma.product.findMany.mockResolvedValue([
      {
        id: 'p1',
        name: 'Mouse',
        slug: 'mouse',
        variants: [
          {
            id: 'v1',
            name: 'Default',
            price: 100,
            stockAvailable: 3,
            lowStockThreshold: 5,
            isDefault: true,
          },
        ],
        brand: { id: 'b1', name: 'Sony', slug: 'sony' },
        category: { id: 'c1', name: 'Chuột', slug: 'chuot' },
        images: [],
      },
    ]);
    ctx.prisma.product.count.mockResolvedValue(1);

    const res = await request(ctx.app.getHttpServer())
      .get('/api/products')
      .expect(200);

    expect(res.body.data[0].variants[0].stockStatus).toBe('low_stock');
    expect(res.body.data[0].variants[0].stockAvailable).toBeUndefined();
  });

  it('GET /api/settings/public is public with defaults', async () => {
    ctx.prisma.setting.findMany.mockResolvedValue([]);

    const res = await request(ctx.app.getHttpServer())
      .get('/api/settings/public')
      .expect(200);

    expect(res.body.data).toEqual({
      shipping_fee: '30000',
      store_name: 'ApexGear',
    });
  });
});
