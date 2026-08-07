import request from 'supertest';
import { createHmac } from 'crypto';
import { createTestApp, E2EContext } from './create-test-app';

const SECRET = process.env.SEPAY_WEBHOOK_SECRET || 'e2e-sepay-secret';

function sign(body: Record<string, unknown>) {
  return createHmac('sha256', SECRET)
    .update(JSON.stringify(body))
    .digest('hex');
}

describe('Payments webhook (e2e)', () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('POST /api/payments/sepay/webhook is public but requires signature', async () => {
    await request(ctx.app.getHttpServer())
      .post('/api/payments/sepay/webhook')
      .send({ content: 'AGREF', transferAmount: 1000 })
      .expect(400);
  });

  it('rejects invalid signature', async () => {
    await request(ctx.app.getHttpServer())
      .post('/api/payments/sepay/webhook')
      .set('x-sepay-signature', 'invalid')
      .send({ content: 'AGREF', transferAmount: 1000 })
      .expect(400);
  });

  it('marks order paid on valid signed webhook with sha256 prefix and timestamp', async () => {
    const body = {
      gateway: 'MBBank',
      transactionDate: '2026-08-08 00:16:48',
      accountNumber: '0867944070',
      code: 'AGF024ED533748',
      content: 'AGF024ED533748',
      transferType: 'in',
      description: 'AGF024ED533748',
      transferAmount: 6090000,
      referenceCode: 'SB4CAB8D0C8C71',
    };
    const rawBody = JSON.stringify(body);
    const timestamp = '1786122906';
    const sig = createHmac('sha256', SECRET)
      .update(`${timestamp}.${rawBody}`)
      .digest('hex');

    ctx.prisma.order.findFirst.mockResolvedValue({
      id: 'o2',
      total: 6090000,
      orderNumber: 'AG-E2E-2',
      status: 'PENDING',
      paymentMethod: 'SEPAY',
    });
    ctx.prisma.order.update.mockResolvedValue({});

    const res = await request(ctx.app.getHttpServer())
      .post('/api/payments/sepay/webhook')
      .set('x-sepay-signature', `sha256=${sig}`)
      .set('x-sepay-timestamp', timestamp)
      .send(body)
      .expect(200);

    expect(res.body.data).toEqual({
      success: true,
      orderNumber: 'AG-E2E-2',
    });
  });

  it('marks order paid on valid signed webhook', async () => {
    const body = { content: 'AGREF123', transferAmount: 250000 };
    ctx.prisma.order.findFirst.mockResolvedValue({
      id: 'o1',
      total: 250000,
      orderNumber: 'AG-E2E-1',
      status: 'PENDING',
      paymentMethod: 'SEPAY',
    });
    ctx.prisma.order.update.mockResolvedValue({});

    const res = await request(ctx.app.getHttpServer())
      .post('/api/payments/sepay/webhook')
      .set('x-sepay-signature', sign(body))
      .send(body)
      .expect(200);

    expect(res.body.data).toEqual({
      success: true,
      orderNumber: 'AG-E2E-1',
    });
    expect(ctx.prisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'o1' },
        data: expect.objectContaining({ paymentStatus: 'PAID' }),
      }),
    );
  });
});
