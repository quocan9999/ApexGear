import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/cart.service', () => ({
  cartService: {
    get: vi.fn(),
    addItem: vi.fn(),
    updateItem: vi.fn(),
    removeItem: vi.fn(),
    merge: vi.fn(),
  },
}));

const authFlag = { isAuthenticated: false };
vi.mock('./auth.store', () => ({
  useAuthStore: { getState: () => authFlag },
}));

import { cartService } from '../services/cart.service';
import { useCartStore } from './cart.store';

const mockCart = (items: { id: string; variantId: string; quantity: number }[]) => ({
  id: 'k1',
  userId: 'u1',
  items: items.map((i) => ({
    id: i.id,
    cartId: 'k1',
    variantId: i.variantId,
    quantity: i.quantity,
    createdAt: 'x',
    variant: { id: i.variantId, product: { id: 'p1', name: 'P', slug: 'p', basePrice: 1000, salePrice: null, images: [] } },
  })),
});

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  authFlag.isAuthenticated = false;
  useCartStore.setState({ items: [], itemCount: 0, cart: null, isSyncing: false, error: null });
});

describe('cart store — authenticated', () => {
  beforeEach(() => { authFlag.isAuthenticated = true; });

  it('loadServerCart populates cart and itemCount', async () => {
    (cartService.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockCart([{ id: 'ci1', variantId: 'v1', quantity: 3 }]));
    await useCartStore.getState().loadServerCart();
    expect(useCartStore.getState().cart?.items).toHaveLength(1);
    expect(useCartStore.getState().itemCount).toBe(3);
  });

  it('addItem calls the service and refreshes count', async () => {
    (cartService.addItem as ReturnType<typeof vi.fn>).mockResolvedValue(mockCart([{ id: 'ci1', variantId: 'v1', quantity: 2 }]));
    await useCartStore.getState().addItem('v1', 2);
    expect(cartService.addItem).toHaveBeenCalledWith('v1', 2);
    expect(useCartStore.getState().itemCount).toBe(2);
  });

  it('removeItem calls the service with the cart item id', async () => {
    (cartService.removeItem as ReturnType<typeof vi.fn>).mockResolvedValue(mockCart([]));
    await useCartStore.getState().removeItem('ci1');
    expect(cartService.removeItem).toHaveBeenCalledWith('ci1');
    expect(useCartStore.getState().itemCount).toBe(0);
  });

  it('mergeGuestCart merges local items then clears local storage', async () => {
    localStorage.setItem('apexgear_cart', JSON.stringify({ items: [{ variantId: 'v1', quantity: 2 }] }));
    (cartService.merge as ReturnType<typeof vi.fn>).mockResolvedValue(mockCart([{ id: 'ci1', variantId: 'v1', quantity: 2 }]));
    await useCartStore.getState().mergeGuestCart();
    expect(cartService.merge).toHaveBeenCalledWith([{ variantId: 'v1', quantity: 2 }]);
    expect(localStorage.getItem('apexgear_cart')).toBeNull();
    expect(useCartStore.getState().itemCount).toBe(2);
  });

  it('mergeGuestCart with no guest items just loads the server cart', async () => {
    (cartService.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockCart([]));
    await useCartStore.getState().mergeGuestCart();
    expect(cartService.merge).not.toHaveBeenCalled();
    expect(cartService.get).toHaveBeenCalled();
  });
});

describe('cart store — guest', () => {
  it('addItem writes to localStorage and updates count without hitting the service', async () => {
    await useCartStore.getState().addItem('v1', 2);
    expect(cartService.addItem).not.toHaveBeenCalled();
    const raw = JSON.parse(localStorage.getItem('apexgear_cart') || '{}');
    expect(raw.items).toEqual([{ variantId: 'v1', quantity: 2 }]);
    expect(useCartStore.getState().itemCount).toBe(2);
  });

  it('addItem merges quantity for an existing guest variant', async () => {
    await useCartStore.getState().addItem('v1', 1);
    await useCartStore.getState().addItem('v1', 2);
    const raw = JSON.parse(localStorage.getItem('apexgear_cart') || '{}');
    expect(raw.items).toEqual([{ variantId: 'v1', quantity: 3 }]);
    expect(useCartStore.getState().itemCount).toBe(3);
  });
});
