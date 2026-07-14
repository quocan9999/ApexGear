import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '../i18n';
import CartPage from './CartPage';

const cartState = {
  cart: null as unknown,
  itemCount: 0,
  isSyncing: false,
  loadServerCart: vi.fn(),
  updateItem: vi.fn(),
  removeItem: vi.fn(),
};
vi.mock('../stores/cart.store', () => ({
  useCartStore: (sel: (s: typeof cartState) => unknown) => sel(cartState),
  initCartStore: vi.fn(),
}));
vi.mock('../hooks/useAuth', () => ({ useAuth: () => ({ isAuthenticated: true, isLoading: false }) }));

beforeEach(() => {
  vi.clearAllMocks();
  cartState.cart = null;
  cartState.itemCount = 0;
});

function makeItem(over = {}) {
  return {
    id: 'ci1', cartId: 'k1', variantId: 'v1', quantity: 2, createdAt: 'x',
    variant: { id: 'v1', sku: 'SKU', name: 'Đen', price: 2000000,
      product: { id: 'p1', name: 'Bàn phím cơ', slug: 'ban-phim-co', basePrice: 2000000, salePrice: null, images: [] } },
    ...over,
  };
}

describe('CartPage', () => {
  it('shows the empty state when the cart has no items', () => {
    render(<MemoryRouter><CartPage /></MemoryRouter>);
    expect(screen.getByText(/giỏ hàng trống/i)).toBeInTheDocument();
  });

  it('renders line items and a formatted subtotal', () => {
    cartState.cart = { id: 'k1', userId: 'u1', items: [makeItem()] };
    cartState.itemCount = 2;
    render(<MemoryRouter><CartPage /></MemoryRouter>);
    expect(screen.getByText('Bàn phím cơ')).toBeInTheDocument();
    // 2 x 2.000.000 => subtotal 4.000.000
    expect(screen.getByText(/4\.000\.000/)).toBeInTheDocument();
  });
});
