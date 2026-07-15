import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '../i18n';
import CheckoutPage from './CheckoutPage';

const navigate = vi.fn();
vi.mock('react-router-dom', async (orig) => ({
  ...(await (orig() as Promise<typeof import('react-router-dom')>)),
  useNavigate: () => navigate,
}));
vi.mock('../services/addresses.service', () => ({
  addressesService: {
    getAll: vi.fn().mockResolvedValue([
      {
        id: 'a1',
        userId: 'u1',
        name: 'A',
        phone: '0900000000',
        provinceCode: '79',
        provinceName: 'HCM',
        wardCode: '1',
        wardName: 'W',
        detail: 'd',
        isDefault: true,
        createdAt: 'x',
        updatedAt: 'x',
      },
    ]),
  },
}));
vi.mock('../services/orders.service', () => ({
  ordersService: {
    create: vi
      .fn()
      .mockResolvedValue({ id: 'o1', orderNumber: 'AG-1', paymentMethod: 'COD', total: 530000 }),
  },
}));
const cartState = {
  cart: {
    id: 'k1',
    userId: 'u1',
    items: [
      {
        id: 'ci1',
        cartId: 'k1',
        variantId: 'v1',
        quantity: 1,
        createdAt: 'x',
        variant: {
          id: 'v1',
          price: 500000,
          product: { id: 'p1', name: 'P', slug: 'p', basePrice: 500000, salePrice: null, images: [] },
        },
      },
    ],
  },
  itemCount: 1,
  loadServerCart: vi.fn(),
};
vi.mock('../stores/cart.store', () => ({
  useCartStore: (s: (x: typeof cartState) => unknown) => s(cartState),
}));

import { ordersService } from '../services/orders.service';

beforeEach(() => vi.clearAllMocks());

describe('CheckoutPage', () => {
  it('walks address → payment → review and places a COD order', async () => {
    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText(/^A$/)).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /tiếp tục/i })); // to payment
    await userEvent.click(screen.getByRole('button', { name: /tiếp tục/i })); // to review (COD default)
    await userEvent.click(screen.getByRole('button', { name: /đặt hàng/i }));
    await waitFor(() =>
      expect(ordersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ paymentMethod: 'COD', addressId: 'a1' }),
      ),
    );
    await waitFor(() => expect(navigate).toHaveBeenCalledWith(expect.stringContaining('o1')));
  });

  it('routes a SEPAY order to the success page (which renders the QR panel)', async () => {
    vi.mocked(ordersService.create).mockResolvedValueOnce({
      id: 'o2',
      orderNumber: 'AG-2',
      paymentMethod: 'SEPAY',
      total: 530000,
    } as Awaited<ReturnType<typeof ordersService.create>>);
    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText(/^A$/)).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /tiếp tục/i })); // to payment
    // pick SEPAY payment method
    await userEvent.click(screen.getByLabelText(/sepay/i));
    await userEvent.click(screen.getByRole('button', { name: /tiếp tục/i })); // to review
    await userEvent.click(screen.getByRole('button', { name: /đặt hàng/i }));
    await waitFor(() =>
      expect(ordersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ paymentMethod: 'SEPAY' }),
      ),
    );
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/checkout/success/o2'));
  });
});
