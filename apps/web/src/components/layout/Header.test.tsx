import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '../../i18n';
import type { User } from '../../types';

// Cart store: Header reads the count via a selector `(s) => s.itemCount`.
const cartState = { itemCount: 0 };
vi.mock('../../stores/cart.store', () => ({
  useCartStore: (sel: (s: typeof cartState) => unknown) => sel(cartState),
}));

// Auth store: Header destructures `{ user, isAuthenticated, logout }`.
const authState: { user: User | null; isAuthenticated: boolean; logout: ReturnType<typeof vi.fn> } = {
  user: null,
  isAuthenticated: false,
  logout: vi.fn(),
};
vi.mock('../../stores/auth.store', () => ({
  useAuthStore: () => authState,
}));

// Categories drive the desktop nav; keep it empty for these wiring tests.
vi.mock('../../services/categories.service', () => ({
  categoriesService: { getAll: vi.fn().mockResolvedValue([]) },
}));

import Header from './Header';

function renderHeader() {
  return render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  cartState.itemCount = 0;
  authState.user = null;
  authState.isAuthenticated = false;
});

describe('Header cart badge', () => {
  it('links the cart icon to /cart', () => {
    renderHeader();
    const cartLink = screen.getByRole('link', { name: /giỏ hàng/i });
    expect(cartLink).toHaveAttribute('href', '/cart');
  });

  it('does not render a count badge when the cart is empty', () => {
    cartState.itemCount = 0;
    renderHeader();
    const cartLink = screen.getByRole('link', { name: /giỏ hàng/i });
    expect(within(cartLink).queryByText(/^\d/)).toBeNull();
  });

  it('shows the store item count in the badge', () => {
    cartState.itemCount = 3;
    renderHeader();
    const cartLink = screen.getByRole('link', { name: /giỏ hàng/i });
    expect(within(cartLink).getByText('3')).toBeInTheDocument();
  });

  it('caps the badge at 99+', () => {
    cartState.itemCount = 150;
    renderHeader();
    const cartLink = screen.getByRole('link', { name: /giỏ hàng/i });
    expect(within(cartLink).getByText('99+')).toBeInTheDocument();
  });
});

describe('Header auth state + Phase 2B nav links', () => {
  it('shows the login link when signed out', () => {
    renderHeader();
    expect(screen.getByRole('link', { name: /đăng nhập/i })).toHaveAttribute('href', '/login');
  });

  it('links to the account and orders routes when signed in', async () => {
    authState.isAuthenticated = true;
    authState.user = { id: 'u1', name: 'An', email: 'an@example.com', phone: null, role: 'CUSTOMER' } as User;
    renderHeader();

    // Open the user menu to reveal the account/orders/logout items.
    const trigger = screen.getByRole('button', { name: /an/i });
    fireEvent.click(trigger);

    const accountLink = await screen.findByRole('menuitem', { name: /tài khoản của tôi/i });
    expect(accountLink).toHaveAttribute('href', '/account');

    const ordersLink = screen.getByRole('menuitem', { name: /đơn hàng/i });
    expect(ordersLink).toHaveAttribute('href', '/orders');
  });
});
