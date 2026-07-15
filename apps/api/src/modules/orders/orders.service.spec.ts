import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { createPrismaMock } from '../../test-utils/prisma-mock';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../../common/enums';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let cartService: { getCart: jest.Mock };
  let couponsService: { validate: jest.Mock };
  let emailService: {
    sendOrderConfirmation: jest.Mock;
    sendDeliveryConfirmation: jest.Mock;
  };

  const address = {
    id: 'a1',
    userId: 'u1',
    name: 'An',
    phone: '090',
    detail: '1 St',
    wardName: 'W',
    provinceName: 'P',
  };

  const cartItem = {
    variantId: 'v1',
    quantity: 2,
    variant: {
      id: 'v1',
      name: 'Black',
      price: 100000,
      product: {
        name: 'Mouse',
        basePrice: 120000,
        salePrice: null,
      },
    },
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    cartService = {
      getCart: jest.fn().mockResolvedValue({
        id: 'cart1',
        items: [cartItem],
      }),
    };
    couponsService = { validate: jest.fn() };
    emailService = {
      sendOrderConfirmation: jest.fn().mockResolvedValue(undefined),
      sendDeliveryConfirmation: jest.fn().mockResolvedValue(undefined),
    };
    service = new OrdersService(
      prisma as never,
      cartService as never,
      couponsService as never,
      emailService as never,
    );
  });

  describe('validateTransition', () => {
    it('allows PENDING -> CONFIRMED', () => {
      expect(() =>
        service.validateTransition(OrderStatus.PENDING, OrderStatus.CONFIRMED),
      ).not.toThrow();
    });

    it('rejects invalid transitions', () => {
      expect(() =>
        service.validateTransition(OrderStatus.PENDING, OrderStatus.DELIVERED),
      ).toThrow(BadRequestException);
      expect(() =>
        service.validateTransition(OrderStatus.COMPLETED, OrderStatus.SHIPPING),
      ).toThrow(BadRequestException);
    });
  });

  describe('checkout', () => {
    it('rejects empty cart', async () => {
      cartService.getCart.mockResolvedValue({ id: 'cart1', items: [] });
      await expect(
        service.checkout('u1', {
          addressId: 'a1',
          paymentMethod: PaymentMethod.COD,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects missing address', async () => {
      prisma.address.findFirst.mockResolvedValue(null);
      await expect(
        service.checkout('u1', {
          addressId: 'a1',
          paymentMethod: PaymentMethod.COD,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects insufficient stock', async () => {
      prisma.address.findFirst.mockResolvedValue(address);
      prisma.productVariant.findFirst.mockResolvedValue({
        id: 'v1',
        name: 'Black',
        stockAvailable: 1,
        price: 100000,
      });
      await expect(
        service.checkout('u1', {
          addressId: 'a1',
          paymentMethod: PaymentMethod.COD,
        }),
      ).rejects.toThrow(/Only 1 available/);
    });

    it('creates COD order, deducts stock, clears cart, sends email', async () => {
      prisma.address.findFirst.mockResolvedValue(address);
      prisma.productVariant.findFirst.mockResolvedValue({
        id: 'v1',
        name: 'Black',
        stockAvailable: 10,
        price: 100000,
      });
      prisma.setting.findUnique.mockResolvedValue({
        key: 'shipping_fee',
        value: '30000',
      });
      prisma.productVariant.updateMany.mockResolvedValue({ count: 1 });
      prisma.cartItem.deleteMany.mockResolvedValue({ count: 1 });
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'u@x.com',
        name: 'An',
      });

      const createdOrder = {
        id: 'o1',
        orderNumber: 'AG-20260714-ABCD',
        paymentMethod: PaymentMethod.COD,
        paymentStatus: PaymentStatus.UNPAID,
        subtotal: 200000,
        shippingFee: 30000,
        discount: 0,
        total: 230000,
        items: [{ price: 100000, quantity: 2 }],
        coupon: null,
      };
      prisma.order.create.mockResolvedValue(createdOrder);

      const result = await service.checkout('u1', {
        addressId: 'a1',
        paymentMethod: PaymentMethod.COD,
      });

      expect(prisma.productVariant.updateMany).toHaveBeenCalled();
      expect(prisma.cartItem.deleteMany).toHaveBeenCalled();
      expect(emailService.sendOrderConfirmation).toHaveBeenCalled();
      expect(result.total).toBe(230000);
      expect(typeof result.subtotal).toBe('number');
    });

    it('applies valid coupon discount', async () => {
      prisma.address.findFirst.mockResolvedValue(address);
      prisma.productVariant.findFirst.mockResolvedValue({
        id: 'v1',
        name: 'Black',
        stockAvailable: 10,
        price: 100000,
      });
      couponsService.validate.mockResolvedValue({
        valid: true,
        discount: 20000,
        couponId: 'cp1',
      });
      prisma.setting.findUnique.mockResolvedValue({
        key: 'shipping_fee',
        value: '30000',
      });
      prisma.productVariant.updateMany.mockResolvedValue({ count: 1 });
      prisma.coupon.update.mockResolvedValue({});
      prisma.cartItem.deleteMany.mockResolvedValue({ count: 1 });
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.order.create.mockResolvedValue({
        id: 'o1',
        orderNumber: 'AG-1',
        paymentMethod: PaymentMethod.COD,
        subtotal: 200000,
        shippingFee: 30000,
        discount: 20000,
        total: 210000,
        items: [],
        coupon: null,
      });

      await service.checkout('u1', {
        addressId: 'a1',
        paymentMethod: PaymentMethod.COD,
        couponCode: 'WELCOME10',
      });

      expect(couponsService.validate).toHaveBeenCalledWith('WELCOME10', 200000);
      expect(prisma.coupon.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { usedCount: { increment: 1 } },
        }),
      );
    });

    it('rejects invalid coupon', async () => {
      prisma.address.findFirst.mockResolvedValue(address);
      prisma.productVariant.findFirst.mockResolvedValue({
        id: 'v1',
        name: 'Black',
        stockAvailable: 10,
        price: 100000,
      });
      couponsService.validate.mockResolvedValue({
        valid: false,
        message: 'expired',
      });

      await expect(
        service.checkout('u1', {
          addressId: 'a1',
          paymentMethod: PaymentMethod.COD,
          couponCode: 'BAD',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('retries checkout when orderNumber unique constraint collides (P2002)', async () => {
      prisma.address.findFirst.mockResolvedValue(address);
      prisma.productVariant.findFirst.mockResolvedValue({
        id: 'v1',
        name: 'Black',
        stockAvailable: 10,
        price: 100000,
      });
      prisma.setting.findUnique.mockResolvedValue({
        key: 'shipping_fee',
        value: '30000',
      });
      prisma.productVariant.updateMany.mockResolvedValue({ count: 1 });
      prisma.cartItem.deleteMany.mockResolvedValue({ count: 1 });
      prisma.user.findUnique.mockResolvedValue(null);

      const collision = Object.assign(new Error('Unique constraint'), {
        code: 'P2002',
        meta: { target: ['orderNumber'] },
      });
      const successOrder = {
        id: 'o1',
        orderNumber: 'AG-20260714-DEADBEEF',
        paymentMethod: PaymentMethod.COD,
        subtotal: 200000,
        shippingFee: 30000,
        discount: 0,
        total: 230000,
        items: [],
        coupon: null,
      };

      // First transaction attempt throws P2002, second succeeds.
      (prisma.$transaction as jest.Mock)
        .mockRejectedValueOnce(collision)
        .mockImplementationOnce(
          async (arg: unknown) =>
            typeof arg === 'function'
              ? (arg as (tx: typeof prisma) => Promise<unknown>)(prisma)
              : arg,
        );
      prisma.order.create.mockResolvedValue(successOrder);

      const result = await service.checkout('u1', {
        addressId: 'a1',
        paymentMethod: PaymentMethod.COD,
      });

      expect(result.id).toBe('o1');
      // Two transaction attempts were made (first collided, second succeeded).
      expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    });

    it('throws when orderNumber keeps colliding after retries', async () => {
      prisma.address.findFirst.mockResolvedValue(address);
      prisma.productVariant.findFirst.mockResolvedValue({
        id: 'v1',
        name: 'Black',
        stockAvailable: 10,
        price: 100000,
      });

      const collision = Object.assign(new Error('Unique constraint'), {
        code: 'P2002',
        meta: { target: ['orderNumber'] },
      });
      (prisma.$transaction as jest.Mock).mockRejectedValue(collision);

      await expect(
        service.checkout('u1', {
          addressId: 'a1',
          paymentMethod: PaymentMethod.COD,
        }),
      ).rejects.toThrow();
      // Bounded retries — never thrash the DB forever.
      expect(prisma.$transaction).toHaveBeenCalledTimes(3);
    });
  });

  describe('cancelOrder', () => {
    it('only allows PENDING customer cancel', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'o1',
        userId: 'u1',
        status: OrderStatus.CONFIRMED,
        items: [],
      });
      await expect(service.cancelOrder('u1', 'o1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('restores stock on cancel', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'o1',
        userId: 'u1',
        status: OrderStatus.PENDING,
        items: [{ variantId: 'v1', quantity: 2 }],
      });
      prisma.order.update.mockResolvedValue({
        id: 'o1',
        status: OrderStatus.CANCELLED,
        subtotal: 0,
        shippingFee: 0,
        discount: 0,
        total: 0,
        items: [],
        coupon: null,
      });
      prisma.productVariant.update.mockResolvedValue({});

      await service.cancelOrder('u1', 'o1');
      expect(prisma.productVariant.update).toHaveBeenCalledWith({
        where: { id: 'v1' },
        data: { stockAvailable: { increment: 2 } },
      });
    });
  });

  describe('updateStatus', () => {
    it('sends delivery email when status becomes DELIVERED', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'o1',
        status: OrderStatus.SHIPPING,
        orderNumber: 'AG-1',
        items: [],
        user: { email: 'u@x.com', name: 'An' },
      });
      prisma.order.update.mockResolvedValue({
        id: 'o1',
        status: OrderStatus.DELIVERED,
        subtotal: 0,
        shippingFee: 0,
        discount: 0,
        total: 0,
        items: [],
        coupon: null,
      });

      await service.updateStatus('o1', { status: OrderStatus.DELIVERED });
      expect(emailService.sendDeliveryConfirmation).toHaveBeenCalledWith(
        'u@x.com',
        'An',
        { orderNumber: 'AG-1' },
      );
    });
  });
});
