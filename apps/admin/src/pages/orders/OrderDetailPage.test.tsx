import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../i18n';
import type { Order } from '../../types';
import { OrderDetailPage } from './OrderDetailPage';

vi.mock('../../services/orders.service', () => ({
  ordersService: {
    list: vi.fn(),
    getById: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

import { ordersService } from '../../services/orders.service';

const order: Order = {
  id: 'o1',
  orderNumber: 'AG-20260101-AB12',
  userId: 'u1',
  status: 'PENDING',
  paymentMethod: 'COD',
  paymentStatus: 'UNPAID',
  subtotal: 1000000,
  shippingFee: 30000,
  discount: 0,
  total: 1030000,
  shippingName: 'Nguyen An',
  shippingPhone: '0900000000',
  shippingAddress: '1 Duong A',
  shippingWard: 'Phuong 1',
  shippingProvince: 'HCM',
  couponId: null,
  sepayRef: null,
  note: 'Goi hang cang',
  paidAt: null,
  confirmedAt: null,
  shippedAt: null,
  deliveredAt: null,
  completedAt: null,
  cancelledAt: null,
  cancelReason: null,
  createdAt: '2026-01-01T10:30:00.000Z',
  updatedAt: '2026-01-01T10:30:00.000Z',
  items: [
    {
      id: 'oi1',
      orderId: 'o1',
      variantId: 'v1',
      productName: 'Sony WH-1000XM5',
      variantInfo: 'Den',
      price: 1000000,
      quantity: 1,
      createdAt: '2026-01-01T10:30:00.000Z',
    },
  ],
  user: { id: 'u1', email: 'an@example.com', name: 'An' },
};

function renderPage(path = '/orders/o1') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/orders/:id" element={<OrderDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('OrderDetailPage', () => {
  beforeEach(() => {
    vi.mocked(ordersService.getById).mockReset().mockResolvedValue(order);
    vi.mocked(ordersService.updateStatus).mockReset().mockResolvedValue({
      ...order,
      status: 'CONFIRMED',
    });
  });

  it('loads order detail and shows shipping + items', async () => {
    renderPage();
    expect(await screen.findByText('AG-20260101-AB12', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Nguyen An')).toBeInTheDocument();
    expect(screen.getByText('Sony WH-1000XM5')).toBeInTheDocument();
    expect(ordersService.getById).toHaveBeenCalledWith('o1');
  });

  it('from PENDING only shows Confirm and Cancel actions', async () => {
    renderPage();
    await screen.findByText('Sony WH-1000XM5');

    expect(
      screen.getByRole('button', { name: i18n.t('orders.actions.CONFIRMED') }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: i18n.t('orders.actions.CANCELLED') }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: i18n.t('orders.actions.SHIPPING') }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: i18n.t('orders.actions.DELIVERED') }),
    ).not.toBeInTheDocument();
  });

  it('confirms order without cancel reason', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Sony WH-1000XM5');

    await user.click(screen.getByRole('button', { name: i18n.t('orders.actions.CONFIRMED') }));

    await waitFor(() => {
      expect(ordersService.updateStatus).toHaveBeenCalledWith('o1', { status: 'CONFIRMED' });
    });
  });

  it('requires cancel reason for CANCELLED', async () => {
    const user = userEvent.setup();
    vi.mocked(ordersService.updateStatus).mockResolvedValue({
      ...order,
      status: 'CANCELLED',
      cancelReason: 'Het hang',
    });

    renderPage();
    await screen.findByText('Sony WH-1000XM5');

    await user.click(screen.getByRole('button', { name: i18n.t('orders.actions.CANCELLED') }));

    const dialog = await screen.findByRole('dialog');
    await user.type(
      within(dialog).getByLabelText(i18n.t('orders.reasonModal.reason')),
      'Het hang',
    );
    await user.click(within(dialog).getByRole('button', { name: i18n.t('common.confirm') }));

    await waitFor(() => {
      expect(ordersService.updateStatus).toHaveBeenCalledWith('o1', {
        status: 'CANCELLED',
        cancelReason: 'Het hang',
      });
    });
  });
});
