import { PaymentTimeoutService } from './payment-timeout.service';
import { createPrismaMock } from '../../test-utils/prisma-mock';
import { OrderStatus } from '../../common/enums';

describe('PaymentTimeoutService', () => {
  let service: PaymentTimeoutService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new PaymentTimeoutService(prisma as never);
  });

  it('does nothing when no expired orders', async () => {
    prisma.order.findMany.mockResolvedValue([]);
    await service.handleSepayTimeout();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('cancels expired unpaid SePay orders and restores stock', async () => {
    prisma.order.findMany.mockResolvedValue([
      {
        id: 'o1',
        orderNumber: 'AG-1',
        items: [
          { variantId: 'v1', quantity: 2 },
          { variantId: 'v2', quantity: 1 },
        ],
      },
    ]);
    prisma.order.update.mockResolvedValue({});
    prisma.productVariant.update.mockResolvedValue({});

    await service.handleSepayTimeout();

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'o1' },
      data: expect.objectContaining({
        status: OrderStatus.CANCELLED,
        cancelReason: 'Payment timeout (10 minutes)',
      }),
    });
    expect(prisma.productVariant.update).toHaveBeenCalledTimes(2);
    expect(prisma.productVariant.update).toHaveBeenCalledWith({
      where: { id: 'v1' },
      data: { stockAvailable: { increment: 2 } },
    });
  });
});
