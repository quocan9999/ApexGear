import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '../i18n';
import OrderSuccessPage from './OrderSuccessPage';

vi.mock('../services/orders.service', () => ({ ordersService: { getById: vi.fn() } }));
vi.mock('../services/payments.service', () => ({ paymentsService: { getSepayQr: vi.fn() } }));
import { ordersService } from '../services/orders.service';
import { paymentsService } from '../services/payments.service';

function renderAt(orderId: string) {
  return render(
    <MemoryRouter initialEntries={[`/checkout/success/${orderId}`]}>
      <Routes>
        <Route path="/checkout/success/:orderId" element={<OrderSuccessPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe('OrderSuccessPage', () => {
  it('shows the COD confirmation with order number and total', async () => {
    (ordersService.getById as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'o1',
      orderNumber: 'AG-20260714-0001',
      paymentMethod: 'COD',
      paymentStatus: 'UNPAID',
      status: 'PENDING',
      total: 530000,
      items: [],
    });
    renderAt('o1');
    await waitFor(() => expect(screen.getByText(/AG-20260714-0001/)).toBeInTheDocument());
    expect(screen.getByText(/530\.000/)).toBeInTheDocument();
  });

  it('flips a SEPAY order to the paid confirmation when polling detects payment', async () => {
    const unpaid = {
      id: 'o2',
      orderNumber: 'AG-20260714-0002',
      paymentMethod: 'SEPAY',
      paymentStatus: 'UNPAID',
      status: 'PENDING',
      total: 2000000,
      items: [],
    };
    const paid = { ...unpaid, paymentStatus: 'PAID', status: 'CONFIRMED' };
    const get = ordersService.getById as ReturnType<typeof vi.fn>;
    // mount load + first poll are still UNPAID, subsequent polls report PAID.
    get.mockResolvedValueOnce(unpaid).mockResolvedValueOnce(unpaid).mockResolvedValue(paid);
    (paymentsService.getSepayQr as ReturnType<typeof vi.fn>).mockResolvedValue({
      bankAccount: '0123456789',
      amount: 2000000,
      content: 'AG20260714',
      orderNumber: 'AG-20260714-0002',
      expiresAt: new Date(Date.now() + 600000).toISOString(),
    });

    renderAt('o2');

    // SEPAY + UNPAID → QR panel is shown, not the confirmation yet.
    await waitFor(() => expect(screen.getByText(/Quét mã QR/i)).toBeInTheDocument());

    // Advance polling until getById reports PAID.
    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
    });

    // View flips to the success confirmation with the PAID message (guards Fix 1).
    await waitFor(() => expect(screen.getByText(/Đặt hàng thành công/i)).toBeInTheDocument());
    expect(screen.getByText(/đã nhận được thanh toán/i)).toBeInTheDocument();
  });
});
