import { ConflictException, NotFoundException } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { createPrismaMock } from '../../test-utils/prisma-mock';
import { CouponType } from '../../common/enums';

describe('CouponsService', () => {
  let service: CouponsService;
  let prisma: ReturnType<typeof createPrismaMock>;

  const coupon = {
    id: 'c1',
    code: 'WELCOME10',
    type: CouponType.PERCENTAGE,
    value: 10,
    description: 'Welcome',
    minOrderValue: null as number | null,
    maxDiscount: 50000,
    maxUses: null as number | null,
    usedCount: 0,
    startsAt: null as Date | null,
    expiresAt: null as Date | null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new CouponsService(prisma as never);
  });

  describe('validate', () => {
    it('returns invalid when coupon missing/inactive', async () => {
      prisma.coupon.findUnique.mockResolvedValue(null);
      await expect(service.validate('NOPE', 100000)).resolves.toEqual({
        valid: false,
        message: 'Coupon not found or inactive',
      });
    });

    it('returns invalid when not started yet', async () => {
      prisma.coupon.findUnique.mockResolvedValue({
        ...coupon,
        startsAt: new Date(Date.now() + 86_400_000),
      });
      const result = await service.validate('WELCOME10', 100000);
      expect(result.valid).toBe(false);
      expect(result.message).toMatch(/not active yet/i);
    });

    it('returns invalid when expired', async () => {
      prisma.coupon.findUnique.mockResolvedValue({
        ...coupon,
        expiresAt: new Date(Date.now() - 1000),
      });
      const result = await service.validate('WELCOME10', 100000);
      expect(result.valid).toBe(false);
      expect(result.message).toMatch(/expired/i);
    });

    it('returns invalid when usage limit reached', async () => {
      prisma.coupon.findUnique.mockResolvedValue({
        ...coupon,
        maxUses: 5,
        usedCount: 5,
      });
      const result = await service.validate('WELCOME10', 100000);
      expect(result.valid).toBe(false);
      expect(result.message).toMatch(/usage limit/i);
    });

    it('returns invalid when below min order value', async () => {
      prisma.coupon.findUnique.mockResolvedValue({
        ...coupon,
        minOrderValue: 200000,
      });
      const result = await service.validate('WELCOME10', 100000);
      expect(result.valid).toBe(false);
      expect(result.message).toMatch(/Minimum order/i);
    });

    it('calculates percentage discount capped by maxDiscount', async () => {
      prisma.coupon.findUnique.mockResolvedValue(coupon);
      // 10% of 1_000_000 = 100_000, capped at 50_000
      const result = await service.validate('welcome10', 1_000_000);
      expect(result).toEqual(
        expect.objectContaining({
          valid: true,
          discount: 50000,
          couponId: 'c1',
          code: 'WELCOME10',
        }),
      );
    });

    it('calculates fixed discount and caps at subtotal', async () => {
      prisma.coupon.findUnique.mockResolvedValue({
        ...coupon,
        type: CouponType.FIXED,
        value: 20000,
        maxDiscount: null,
      });
      const result = await service.validate('WELCOME10', 15000);
      expect(result.valid).toBe(true);
      expect(result.discount).toBe(15000);
    });
  });

  describe('create', () => {
    it('uppercases code and rejects duplicates', async () => {
      prisma.coupon.findUnique.mockResolvedValue(coupon);
      await expect(
        service.create({
          code: 'welcome10',
          type: CouponType.PERCENTAGE,
          value: 10,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates coupon with normalized code', async () => {
      prisma.coupon.findUnique.mockResolvedValue(null);
      prisma.coupon.create.mockResolvedValue(coupon);
      const result = await service.create({
        code: ' save20 ',
        type: CouponType.FIXED,
        value: 20000,
      });
      expect(prisma.coupon.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ code: 'SAVE20' }),
        }),
      );
      expect(result.value).toBe(10);
    });
  });

  it('remove throws when missing', async () => {
    prisma.coupon.findUnique.mockResolvedValue(null);
    await expect(service.remove('x')).rejects.toBeInstanceOf(NotFoundException);
  });
});
