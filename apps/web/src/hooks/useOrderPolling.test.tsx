import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('../services/orders.service', () => ({ ordersService: { getById: vi.fn() } }));
import { ordersService } from '../services/orders.service';
import { useOrderPolling } from './useOrderPolling';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useOrderPolling', () => {
  it('polls until the order is paid then stops', async () => {
    const get = ordersService.getById as ReturnType<typeof vi.fn>;
    get
      .mockResolvedValueOnce({ id: 'o1', paymentStatus: 'UNPAID', status: 'PENDING' })
      .mockResolvedValueOnce({ id: 'o1', paymentStatus: 'PAID', status: 'CONFIRMED' });
    const { result } = renderHook(() =>
      useOrderPolling('o1', { enabled: true, intervalMs: 5000 }),
    );
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
    });
    await waitFor(() => expect(result.current.paymentStatus).toBe('PAID'));
    const callsAfterPaid = get.mock.calls.length;
    await act(async () => {
      vi.advanceTimersByTime(10000);
      await Promise.resolve();
    });
    expect(get.mock.calls.length).toBe(callsAfterPaid);
  });

  it('clears the interval on unmount (no leaked timer)', async () => {
    const get = ordersService.getById as ReturnType<typeof vi.fn>;
    get.mockResolvedValue({ id: 'o1', paymentStatus: 'UNPAID', status: 'PENDING' });
    const { unmount } = renderHook(() =>
      useOrderPolling('o1', { enabled: true, intervalMs: 5000 }),
    );
    await act(async () => {
      await Promise.resolve();
    });
    const callsBeforeUnmount = get.mock.calls.length;
    unmount();
    await act(async () => {
      vi.advanceTimersByTime(20000);
      await Promise.resolve();
    });
    // No further polling after unmount — the interval was cleaned up.
    expect(get.mock.calls.length).toBe(callsBeforeUnmount);
  });

  it('stops polling when enabled becomes false (expiry path)', async () => {
    const get = ordersService.getById as ReturnType<typeof vi.fn>;
    get.mockResolvedValue({ id: 'o1', paymentStatus: 'UNPAID', status: 'PENDING' });
    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useOrderPolling('o1', { enabled, intervalMs: 5000 }),
      { initialProps: { enabled: true } },
    );
    await act(async () => {
      await Promise.resolve();
    });
    // Disable polling (mirrors SepayQrPanel setting enabled=false on countdown expiry).
    rerender({ enabled: false });
    const callsAfterDisable = get.mock.calls.length;
    await act(async () => {
      vi.advanceTimersByTime(20000);
      await Promise.resolve();
    });
    expect(get.mock.calls.length).toBe(callsAfterDisable);
  });
});
