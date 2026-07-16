import { render, screen, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import SepayQrPanel from './SepayQrPanel';
import { paymentsService } from '../../services/payments.service';

// ── Mock dependencies ─────────────────────────────────────────────────────────

vi.mock('../../services/payments.service', () => ({
  paymentsService: { getSepayQr: vi.fn() },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

vi.mock('../../utils/format', () => ({
  formatPrice: (n: number) => `${n.toLocaleString()}đ`,
}));

vi.mock('./CountdownTimer', () => ({
  default: ({ onExpire }: { onExpire(): void }) => (
    <button onClick={onExpire}>expire</button>
  ),
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...p}>{children}</div>
    ),
  },
}));

// ── Mock EventSource ──────────────────────────────────────────────────────────

class MockEventSource {
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  close = vi.fn();
  constructor(_url: string) {
    (global as Record<string, unknown>).mockEs = this;
  }
}

const OriginalEventSource = global.EventSource;
global.EventSource = MockEventSource as unknown as typeof EventSource;

afterAll(() => {
  global.EventSource = OriginalEventSource;
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockQr = {
  bankAccount: '0867944070',
  bankId: 'MB',
  amount: 250000,
  content: 'AG1234567890AB',
  orderNumber: 'AG-0001',
  expiresAt: new Date(Date.now() + 600_000).toISOString(),
};

function mockEs() {
  return (global as Record<string, unknown>).mockEs as MockEventSource;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SepayQrPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (global as Record<string, unknown>).mockEs;
  });

  it('shows loading spinner initially', () => {
    (paymentsService.getSepayQr as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise(() => {}),
    );
    render(
      <SepayQrPanel orderId="order-1" onPaid={vi.fn()} onExpired={vi.fn()} />,
    );
    expect(document.querySelector('[role="status"]')).toBeTruthy();
  });

  it('renders QR data after successful fetch', async () => {
    (paymentsService.getSepayQr as ReturnType<typeof vi.fn>).mockResolvedValue(mockQr);
    render(
      <SepayQrPanel orderId="order-1" onPaid={vi.fn()} onExpired={vi.fn()} />,
    );
    await waitFor(() => expect(screen.getByText('0867944070')).toBeInTheDocument());
    expect(screen.getByText(/250/)).toBeInTheDocument();
    expect(screen.getByText('AG1234567890AB')).toBeInTheDocument();
  });

  it('builds the QR img URL with bank param per SePay docs', async () => {
    (paymentsService.getSepayQr as ReturnType<typeof vi.fn>).mockResolvedValue(mockQr);
    render(
      <SepayQrPanel orderId="order-1" onPaid={vi.fn()} onExpired={vi.fn()} />,
    );
    await waitFor(() => screen.getByAltText('payment.scanQr'));
    const img = screen.getByAltText('payment.scanQr') as HTMLImageElement;
    expect(img.src).toContain('vietqr.app');
    expect(img.src).toContain('bank=MB');
    expect(img.src).toContain('acc=0867944070');
  });

  it('shows error message when fetch fails', async () => {
    (paymentsService.getSepayQr as ReturnType<typeof vi.fn>).mockRejectedValue({
      message: 'Not found',
    });
    render(
      <SepayQrPanel orderId="order-1" onPaid={vi.fn()} onExpired={vi.fn()} />,
    );
    await waitFor(() => expect(screen.getByText('Not found')).toBeInTheDocument());
  });

  it('opens SSE connection after QR loads', async () => {
    (paymentsService.getSepayQr as ReturnType<typeof vi.fn>).mockResolvedValue(mockQr);
    render(
      <SepayQrPanel orderId="order-1" onPaid={vi.fn()} onExpired={vi.fn()} />,
    );
    await waitFor(() => screen.getByText('0867944070'));
    expect(mockEs()).toBeDefined();
  });

  it('calls onPaid and closes SSE on success message', async () => {
    const onPaid = vi.fn();
    (paymentsService.getSepayQr as ReturnType<typeof vi.fn>).mockResolvedValue(mockQr);
    render(
      <SepayQrPanel orderId="order-1" onPaid={onPaid} onExpired={vi.fn()} />,
    );
    await waitFor(() => screen.getByText('0867944070'));

    act(() => {
      mockEs().onmessage?.({
        data: JSON.stringify({ success: true }),
      } as MessageEvent);
    });

    expect(onPaid).toHaveBeenCalledOnce();
    expect(mockEs().close).toHaveBeenCalled();
  });

  it('does not call onPaid on non-success SSE message', async () => {
    const onPaid = vi.fn();
    (paymentsService.getSepayQr as ReturnType<typeof vi.fn>).mockResolvedValue(mockQr);
    render(
      <SepayQrPanel orderId="order-1" onPaid={onPaid} onExpired={vi.fn()} />,
    );
    await waitFor(() => screen.getByText('0867944070'));

    act(() => {
      mockEs().onmessage?.({ data: JSON.stringify({ success: false }) } as MessageEvent);
    });

    expect(onPaid).not.toHaveBeenCalled();
  });

  it('does not crash on malformed SSE frame', async () => {
    (paymentsService.getSepayQr as ReturnType<typeof vi.fn>).mockResolvedValue(mockQr);
    render(
      <SepayQrPanel orderId="order-1" onPaid={vi.fn()} onExpired={vi.fn()} />,
    );
    await waitFor(() => screen.getByText('0867944070'));

    expect(() => {
      act(() => {
        mockEs().onmessage?.({ data: 'not-json' } as MessageEvent);
      });
    }).not.toThrow();
  });

  it('calls onExpired when countdown fires and stops SSE', async () => {
    const onExpired = vi.fn();
    (paymentsService.getSepayQr as ReturnType<typeof vi.fn>).mockResolvedValue(mockQr);
    render(
      <SepayQrPanel orderId="order-1" onPaid={vi.fn()} onExpired={onExpired} />,
    );
    await waitFor(() => screen.getByText('expire'));

    screen.getByText('expire').click();

    await waitFor(() => expect(onExpired).toHaveBeenCalledOnce());
  });
});
