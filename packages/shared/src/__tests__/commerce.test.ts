import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  ALL_STAFF_ROLES,
  CONTENT_ROLES,
  COUPON_TYPE_VALUES,
  ORDER_STATUS_VALUES,
  PAYMENT_METHOD_VALUES,
  PAYMENT_STATUS_VALUES,
  REVIEW_STATUS_VALUES,
  ROLE_VALUES,
  STAFF_ROLES,
  getAllowedTransitions,
  isStaffRole,
  requiresCancelReason,
  type CouponType,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
  type ReviewStatus,
  type Role,
} from '..';

describe('commerce enum values', () => {
  it('exports canonical runtime values for frontend filters and type guards', () => {
    expect(ORDER_STATUS_VALUES).toEqual([
      'PENDING',
      'CONFIRMED',
      'SHIPPING',
      'DELIVERED',
      'COMPLETED',
      'CANCELLED',
      'REFUNDED',
    ]);
    expect(PAYMENT_STATUS_VALUES).toEqual(['UNPAID', 'PAID', 'REFUNDED']);
    expect(PAYMENT_METHOD_VALUES).toEqual(['COD', 'SEPAY']);
    expect(COUPON_TYPE_VALUES).toEqual(['PERCENTAGE', 'FIXED']);
    expect(REVIEW_STATUS_VALUES).toEqual(['PENDING', 'APPROVED', 'REJECTED']);
    expect(ROLE_VALUES).toEqual([
      'CUSTOMER',
      'CONTENT_MANAGER',
      'INVENTORY_MANAGER',
      'ORDER_MANAGER',
      'ADMIN',
    ]);
  });

  it('keeps value arrays assignable to their union types', () => {
    expectTypeOf<(typeof ORDER_STATUS_VALUES)[number]>().toEqualTypeOf<OrderStatus>();
    expectTypeOf<(typeof PAYMENT_STATUS_VALUES)[number]>().toEqualTypeOf<PaymentStatus>();
    expectTypeOf<(typeof PAYMENT_METHOD_VALUES)[number]>().toEqualTypeOf<PaymentMethod>();
    expectTypeOf<(typeof COUPON_TYPE_VALUES)[number]>().toEqualTypeOf<CouponType>();
    expectTypeOf<(typeof REVIEW_STATUS_VALUES)[number]>().toEqualTypeOf<ReviewStatus>();
    expectTypeOf<(typeof ROLE_VALUES)[number]>().toEqualTypeOf<Role>();
  });
});

describe('role helpers', () => {
  it('exports the admin role groups used by routes and navigation', () => {
    expect(STAFF_ROLES).toEqual(['ADMIN', 'CONTENT_MANAGER', 'INVENTORY_MANAGER', 'ORDER_MANAGER']);
    expect(ALL_STAFF_ROLES).toEqual(STAFF_ROLES);
    expect(CONTENT_ROLES).toEqual(['ADMIN', 'CONTENT_MANAGER']);
  });

  it('identifies staff roles and rejects customers', () => {
    expect(isStaffRole('ADMIN')).toBe(true);
    expect(isStaffRole('CONTENT_MANAGER')).toBe(true);
    expect(isStaffRole('INVENTORY_MANAGER')).toBe(true);
    expect(isStaffRole('ORDER_MANAGER')).toBe(true);
    expect(isStaffRole('CUSTOMER')).toBe(false);
  });
});

describe('order transitions', () => {
  it('matches the backend order status state machine', () => {
    expect(getAllowedTransitions('PENDING')).toEqual(['CONFIRMED', 'CANCELLED']);
    expect(getAllowedTransitions('CONFIRMED')).toEqual(['SHIPPING', 'CANCELLED']);
    expect(getAllowedTransitions('SHIPPING')).toEqual(['DELIVERED']);
    expect(getAllowedTransitions('DELIVERED')).toEqual(['COMPLETED', 'REFUNDED']);
    expect(getAllowedTransitions('COMPLETED')).toEqual([]);
    expect(getAllowedTransitions('CANCELLED')).toEqual([]);
    expect(getAllowedTransitions('REFUNDED')).toEqual([]);
  });

  it('requires a cancel reason for cancellation and refund transitions', () => {
    expect(requiresCancelReason('CANCELLED')).toBe(true);
    expect(requiresCancelReason('REFUNDED')).toBe(true);
    expect(requiresCancelReason('CONFIRMED')).toBe(false);
  });
});
