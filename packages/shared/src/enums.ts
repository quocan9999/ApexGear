export const ORDER_STATUS_VALUES = [
  'PENDING',
  'CONFIRMED',
  'SHIPPING',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
  'REFUNDED',
] as const;

export type OrderStatus = (typeof ORDER_STATUS_VALUES)[number];

export const PAYMENT_STATUS_VALUES = ['UNPAID', 'PAID', 'REFUNDED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUS_VALUES)[number];

export const PAYMENT_METHOD_VALUES = ['COD', 'SEPAY'] as const;
export type PaymentMethod = (typeof PAYMENT_METHOD_VALUES)[number];

export const COUPON_TYPE_VALUES = ['PERCENTAGE', 'FIXED'] as const;
export type CouponType = (typeof COUPON_TYPE_VALUES)[number];

export const REVIEW_STATUS_VALUES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type ReviewStatus = (typeof REVIEW_STATUS_VALUES)[number];

export const ROLE_VALUES = [
  'CUSTOMER',
  'CONTENT_MANAGER',
  'INVENTORY_MANAGER',
  'ORDER_MANAGER',
  'ADMIN',
] as const;

export type Role = (typeof ROLE_VALUES)[number];
