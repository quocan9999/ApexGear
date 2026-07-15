import { describe, expect, it } from 'vitest';
import { getAllowedTransitions, requiresCancelReason } from './order-transitions';

describe('order transitions', () => {
  it('PENDING can only confirm or cancel', () => {
    expect(getAllowedTransitions('PENDING')).toEqual(['CONFIRMED', 'CANCELLED']);
  });

  it('COMPLETED has no further transitions', () => {
    expect(getAllowedTransitions('COMPLETED')).toEqual([]);
  });

  it('cancel/refund require reason', () => {
    expect(requiresCancelReason('CANCELLED')).toBe(true);
    expect(requiresCancelReason('REFUNDED')).toBe(true);
    expect(requiresCancelReason('CONFIRMED')).toBe(false);
  });
});
