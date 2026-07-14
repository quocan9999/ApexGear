import { useEffect, useState } from 'react';
import { ordersService } from '../services/orders.service';
import type { Order, OrderStatus, PaymentStatus } from '../types';

interface UseOrderPollingOptions {
  /** When false, polling is paused and any running interval is cleared. */
  enabled: boolean;
  /** Poll cadence in milliseconds. Defaults to 5000. */
  intervalMs?: number;
}

interface UseOrderPollingResult {
  order: Order | null;
  paymentStatus: PaymentStatus | null;
  status: OrderStatus | null;
}

const TERMINAL_STATUSES: ReadonlySet<OrderStatus> = new Set<OrderStatus>([
  'CANCELLED',
  'COMPLETED',
]);

/**
 * Polls `GET /orders/:id` on a fixed cadence to detect when a SePay transfer
 * has been reconciled by the backend (there is no confirm endpoint). Stops as
 * soon as `paymentStatus === 'PAID'` or the order reaches a terminal status,
 * guards against overlapping requests, and clears its interval on
 * unmount/disable.
 */
export function useOrderPolling(
  orderId: string,
  { enabled, intervalMs = 5000 }: UseOrderPollingOptions,
): UseOrderPollingResult {
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!enabled || !orderId) return;

    let cancelled = false;
    let inFlight = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const stop = () => {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
    };

    const poll = async () => {
      if (inFlight) return; // avoid overlapping requests on slow networks
      inFlight = true;
      try {
        const next = await ordersService.getById(orderId);
        if (cancelled) return;
        setOrder(next);
        if (next.paymentStatus === 'PAID' || TERMINAL_STATUSES.has(next.status)) {
          stop();
        }
      } catch {
        // Transient errors are swallowed; the next tick retries.
      } finally {
        inFlight = false;
      }
    };

    // Fetch immediately, then on each interval.
    void poll();
    intervalId = setInterval(() => {
      void poll();
    }, intervalMs);

    return () => {
      cancelled = true;
      stop();
    };
  }, [orderId, enabled, intervalMs]);

  return {
    order,
    paymentStatus: order?.paymentStatus ?? null,
    status: order?.status ?? null,
  };
}
