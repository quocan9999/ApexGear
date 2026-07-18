import type { OrderStatus } from './enums';

/** Mirrors API ALLOWED_TRANSITIONS in orders.service.ts */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPING', 'CANCELLED'],
  SHIPPING: ['DELIVERED'],
  DELIVERED: ['COMPLETED', 'REFUNDED'],
  COMPLETED: [],
  CANCELLED: [],
  REFUNDED: [],
};

export function getAllowedTransitions(status: OrderStatus): OrderStatus[] {
  return ALLOWED_TRANSITIONS[status] ?? [];
}

export function requiresCancelReason(status: OrderStatus): boolean {
  return status === 'CANCELLED' || status === 'REFUNDED';
}
