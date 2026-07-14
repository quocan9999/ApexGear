import { describe, it, expect } from 'vitest';
import type { Order, Cart, Address, CouponValidation, SepayQr } from './index';

describe('commerce types', () => {
  it('allows constructing a well-formed Order fixture', () => {
    const order: Order = {
      id: 'o1',
      orderNumber: 'AG-20260714-0001',
      userId: 'u1',
      status: 'PENDING',
      paymentMethod: 'SEPAY',
      paymentStatus: 'UNPAID',
      subtotal: 500000,
      shippingFee: 30000,
      discount: 0,
      total: 530000,
      shippingName: 'Nguyen Van A',
      shippingPhone: '0900000000',
      shippingAddress: '12 Le Loi',
      shippingWard: 'Ben Nghe',
      shippingDistrict: 'Quan 1',
      shippingProvince: 'TP HCM',
      couponId: null,
      sepayRef: 'AG1234567890AB',
      note: null,
      paidAt: null,
      confirmedAt: null,
      shippedAt: null,
      deliveredAt: null,
      completedAt: null,
      cancelledAt: null,
      cancelReason: null,
      createdAt: '2026-07-14T00:00:00.000Z',
      updatedAt: '2026-07-14T00:00:00.000Z',
      items: [
        { id: 'oi1', orderId: 'o1', variantId: 'v1', productName: 'Bàn phím', variantInfo: 'Đen', price: 500000, quantity: 1 },
      ],
    };
    expect(order.total).toBe(530000);
    expect(order.items[0].productName).toBe('Bàn phím');
  });

  it('allows a validated coupon and a SePay QR fixture', () => {
    const coupon: CouponValidation = { valid: true, discount: 50000, couponId: 'c1', code: 'WELCOME10', type: 'PERCENTAGE' };
    const qr: SepayQr = { bankAccount: '0123', amount: 530000, content: 'AG1234567890AB', orderNumber: 'AG-20260714-0001', expiresAt: '2026-07-14T00:10:00.000Z' };
    const cart: Cart = { id: 'k1', userId: 'u1', items: [] };
    const addr: Address = {
      id: 'a1', userId: 'u1', name: 'A', phone: '0900000000',
      provinceCode: '79', provinceName: 'TP HCM', districtCode: '760', districtName: 'Quan 1',
      wardCode: '26734', wardName: 'Ben Nghe', detail: '12 Le Loi', isDefault: true,
      createdAt: '2026-07-14T00:00:00.000Z', updatedAt: '2026-07-14T00:00:00.000Z',
    };
    expect(coupon.discount).toBe(50000);
    expect(qr.amount).toBe(530000);
    expect(cart.items).toEqual([]);
    expect(addr.isDefault).toBe(true);
  });
});
