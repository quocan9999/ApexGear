import request from 'supertest';
import { createTestApp, E2EContext } from './create-test-app';

describe('Health (e2e)', () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('GET /api/health is public and wraps response', async () => {
    const res = await request(ctx.app.getHttpServer())
      .get('/api/health')
      .expect(200);

    expect(res.body).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'ok',
          timestamp: expect.any(String),
        }),
        meta: expect.objectContaining({
          timestamp: expect.any(String),
        }),
      }),
    );
  });
});
