import { ShippingService } from './shipping.service';
import { createPrismaMock } from '../../test-utils/prisma-mock';

describe('ShippingService', () => {
  let service: ShippingService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new ShippingService(prisma as never);
  });

  it('returns zero when matching rule has a free shipping threshold met by subtotal', async () => {
    prisma.shippingRegion.findFirst.mockResolvedValue({
      rule: { isActive: true, fee: 30000, freeShippingThreshold: 500000 },
    });

    await expect(service.calculateFee('79', '760', 500000)).resolves.toBe(0);
  });

  it('returns matching rule fee when subtotal is below free shipping threshold', async () => {
    prisma.shippingRegion.findFirst.mockResolvedValue({
      rule: { isActive: true, fee: 30000, freeShippingThreshold: 500000 },
    });

    await expect(service.calculateFee('79', '760', 499999)).resolves.toBe(30000);
  });
});
