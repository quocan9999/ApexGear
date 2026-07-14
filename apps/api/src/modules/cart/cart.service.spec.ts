import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CartService } from './cart.service';
import { createPrismaMock } from '../../test-utils/prisma-mock';

describe('CartService', () => {
  let service: CartService;
  let prisma: ReturnType<typeof createPrismaMock>;

  const cart = { id: 'cart1', userId: 'u1', items: [] };
  const variant = {
    id: 'v1',
    name: 'Black',
    stockAvailable: 5,
    isActive: true,
    deletedAt: null,
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new CartService(prisma as never);
  });

  it('getCart creates cart when missing', async () => {
    prisma.cart.findUnique.mockResolvedValueOnce(null);
    prisma.cart.create.mockResolvedValue(cart);
    const result = await service.getCart('u1');
    expect(prisma.cart.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { userId: 'u1' } }),
    );
    expect(result).toEqual(cart);
  });

  describe('addItem', () => {
    it('throws when variant not found', async () => {
      prisma.productVariant.findFirst.mockResolvedValue(null);
      await expect(
        service.addItem('u1', { variantId: 'v1', quantity: 1 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws when quantity exceeds stock', async () => {
      prisma.productVariant.findFirst.mockResolvedValue(variant);
      await expect(
        service.addItem('u1', { variantId: 'v1', quantity: 10 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates new cart item', async () => {
      prisma.productVariant.findFirst.mockResolvedValue(variant);
      prisma.cart.findUnique
        .mockResolvedValueOnce(cart) // getOrCreateCart
        .mockResolvedValueOnce({ ...cart, items: [{ id: 'i1' }] }); // getCart
      prisma.cartItem.findUnique.mockResolvedValue(null);
      prisma.cartItem.create.mockResolvedValue({});

      await service.addItem('u1', { variantId: 'v1', quantity: 2 });
      expect(prisma.cartItem.create).toHaveBeenCalledWith({
        data: { cartId: 'cart1', variantId: 'v1', quantity: 2 },
      });
    });

    it('increments existing cart item within stock', async () => {
      prisma.productVariant.findFirst.mockResolvedValue(variant);
      prisma.cart.findUnique
        .mockResolvedValueOnce(cart)
        .mockResolvedValueOnce(cart);
      prisma.cartItem.findUnique.mockResolvedValue({
        id: 'i1',
        quantity: 2,
      });
      prisma.cartItem.update.mockResolvedValue({});

      await service.addItem('u1', { variantId: 'v1', quantity: 1 });
      expect(prisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'i1' },
        data: { quantity: 3 },
      });
    });

    it('rejects when existing + new exceeds stock', async () => {
      prisma.productVariant.findFirst.mockResolvedValue(variant);
      prisma.cart.findUnique.mockResolvedValue(cart);
      prisma.cartItem.findUnique.mockResolvedValue({
        id: 'i1',
        quantity: 4,
      });

      await expect(
        service.addItem('u1', { variantId: 'v1', quantity: 2 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('mergeCart', () => {
    it('takes max quantity and clamps to stock', async () => {
      prisma.cart.findUnique
        .mockResolvedValueOnce(cart)
        .mockResolvedValueOnce(cart);
      prisma.productVariant.findFirst.mockResolvedValue({
        ...variant,
        stockAvailable: 3,
      });
      prisma.cartItem.findUnique.mockResolvedValue({
        id: 'i1',
        quantity: 1,
      });
      prisma.cartItem.update.mockResolvedValue({});

      await service.mergeCart('u1', {
        items: [{ variantId: 'v1', quantity: 10 }],
      });

      expect(prisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'i1' },
        data: { quantity: 3 },
      });
    });

    it('skips missing variants', async () => {
      prisma.cart.findUnique
        .mockResolvedValueOnce(cart)
        .mockResolvedValueOnce(cart);
      prisma.productVariant.findFirst.mockResolvedValue(null);

      await service.mergeCart('u1', {
        items: [{ variantId: 'missing', quantity: 1 }],
      });
      expect(prisma.cartItem.create).not.toHaveBeenCalled();
    });
  });

  it('clearCart deletes items when cart exists', async () => {
    prisma.cart.findUnique.mockResolvedValue(cart);
    prisma.cartItem.deleteMany.mockResolvedValue({ count: 2 });
    await service.clearCart('u1');
    expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
      where: { cartId: 'cart1' },
    });
  });

  it('removeItem throws when item not in cart', async () => {
    prisma.cart.findUnique.mockResolvedValue(cart);
    prisma.cartItem.findFirst.mockResolvedValue(null);
    await expect(service.removeItem('u1', 'i1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
