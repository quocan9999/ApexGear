import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '../i18n';
import OrderDetailPage from './OrderDetailPage';

vi.mock('../services/orders.service', () => ({ ordersService: { getById: vi.fn(), cancel: vi.fn() } }));
import { ordersService } from '../services/orders.service';

const baseOrder = {
  id: 'o1', orderNumber: 'AG-20260714-0001', userId: 'u1', status: 'PENDING',
  paymentMethod: 'COD', paymentStatus: 'UNPAID', subtotal: 500000, shippingFee: 30000, discount: 0, total: 530000,
  shippingName: 'A', shippingPhone: '0900000000', shippingAddress: '12 Le Loi', shippingWard: 'W',
  shippingProvince: 'HCM', couponId: null, sepayRef: null, note: null,
  paidAt: null, confirmedAt: null, shippedAt: null, deliveredAt: null, completedAt: null,
  cancelledAt: null, cancelReason: null, createdAt: '2026-07-14T00:00:00.000Z', updatedAt: '2026-07-14T00:00:00.000Z',
  items: [{ id: 'oi1', orderId: 'o1', variantId: 'v1', productName: 'Bàn phím', variantInfo: 'Đen', price: 500000, quantity: 1 }],
};

function renderAt() {
  return render(
    <MemoryRouter initialEntries={['/orders/o1']}>
      <Routes><Route path="/orders/:id" element={<OrderDetailPage />} /></Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => vi.clearAllMocks());

describe('OrderDetailPage', () => {
  it('renders order items, totals, and shipping snapshot', async () => {
    (ordersService.getById as ReturnType<typeof vi.fn>).mockResolvedValue(baseOrder);
    renderAt();
    await waitFor(() => expect(screen.getByText('Bàn phím')).toBeInTheDocument());
    expect(screen.getByText(/530\.000/)).toBeInTheDocument();
    expect(screen.getByText(/12 Le Loi/)).toBeInTheDocument();
  });

  it('cancels a pending order via the cancel button and reflects the refreshed order', async () => {
    (ordersService.getById as ReturnType<typeof vi.fn>).mockResolvedValue(baseOrder);
    (ordersService.cancel as ReturnType<typeof vi.fn>).mockResolvedValue({ ...baseOrder, status: 'CANCELLED' });
    renderAt();
    await waitFor(() => expect(screen.getByRole('button', { name: /huỷ đơn/i })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /huỷ đơn/i }));
    // confirm dialog action
    await userEvent.click(screen.getByRole('button', { name: /xác nhận/i }));
    await waitFor(() => expect(ordersService.cancel).toHaveBeenCalledWith('o1'));
    // setOrder(updated) refresh path: UI now shows the CANCELLED status and hides the cancel button
    await waitFor(() => expect(screen.getByText(/đã huỷ/i)).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /huỷ đơn/i })).not.toBeInTheDocument();
  });

  it('hides the cancel button for a non-pending order', async () => {
    (ordersService.getById as ReturnType<typeof vi.fn>).mockResolvedValue({ ...baseOrder, status: 'SHIPPING' });
    renderAt();
    await waitFor(() => expect(screen.getByText('Bàn phím')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /huỷ đơn/i })).not.toBeInTheDocument();
  });
});
