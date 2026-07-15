import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../i18n';
import type { Order } from '../../types';
import { OrderListPage } from './OrderListPage';

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
  note: null,
  paidAt: null,
  confirmedAt: null,
  shippedAt: null,
  deliveredAt: null,
  completedAt: null,
  cancelledAt: null,
  cancelReason: null,
  createdAt: '2026-01-01T10:30:00.000Z',
  updatedAt: '2026-01-01T10:30:00.000Z',
  items: [],
};

function renderPage() {
  return render(
    <MemoryRouter>
      <OrderListPage />
    </MemoryRouter>,
  );
}

describe('OrderListPage', () => {
  beforeEach(() => {
    vi.mocked(ordersService.list).mockReset().mockResolvedValue({
      data: [order],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
  });

  it('renders order list with key columns', async () => {
    renderPage();
    expect(await screen.findByText('AG-20260101-AB12')).toBeInTheDocument();
    expect(screen.getByText('Nguyen An')).toBeInTheDocument();
    expect(screen.getByText(/1\.030\.000/)).toBeInTheDocument();
    expect(ordersService.list).toHaveBeenCalledWith({
      page: 1,
      limit: 20,
      search: undefined,
      status: undefined,
      paymentStatus: undefined,
      paymentMethod: undefined,
    });
  });

  it('filters by status', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('AG-20260101-AB12');

    await user.selectOptions(
      screen.getByLabelText(i18n.t('orders.filters.status')),
      'PENDING',
    );

    await waitFor(() => {
      expect(ordersService.list).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'PENDING', page: 1 }),
      );
    });
  });
});
