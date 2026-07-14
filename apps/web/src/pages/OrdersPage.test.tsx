import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '../i18n';
import OrdersPage from './OrdersPage';

vi.mock('../services/orders.service', () => ({ ordersService: { getAll: vi.fn() } }));
import { ordersService } from '../services/orders.service';

beforeEach(() => vi.clearAllMocks());

describe('OrdersPage', () => {
  it('renders order cards from the list envelope', async () => {
    (ordersService.getAll as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [{ id: 'o1', orderNumber: 'AG-20260714-0001', status: 'PENDING', paymentMethod: 'COD',
        paymentStatus: 'UNPAID', total: 530000, createdAt: '2026-07-14T00:00:00.000Z', items: [] }],
      meta: { total: 1, page: 1, limit: 10 },
    });
    render(<MemoryRouter><OrdersPage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText(/AG-20260714-0001/)).toBeInTheDocument());
    expect(screen.getByText(/530\.000/)).toBeInTheDocument();
  });

  it('shows the empty state when there are no orders', async () => {
    (ordersService.getAll as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [], meta: { total: 0 } });
    render(<MemoryRouter><OrdersPage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText(/chưa có đơn hàng/i)).toBeInTheDocument());
  });

  it('refetches with the new page when the page changes', async () => {
    (ordersService.getAll as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [{ id: 'o1', orderNumber: 'AG-20260714-0001', status: 'PENDING', paymentMethod: 'COD',
        paymentStatus: 'UNPAID', total: 530000, createdAt: '2026-07-14T00:00:00.000Z', items: [] }],
      meta: { total: 30, page: 1, limit: 10, totalPages: 3 },
    });
    render(<MemoryRouter><OrdersPage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText(/AG-20260714-0001/)).toBeInTheDocument());
    expect(ordersService.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 10 }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    await waitFor(() =>
      expect(ordersService.getAll).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2, limit: 10 }),
      ),
    );
  });
});
