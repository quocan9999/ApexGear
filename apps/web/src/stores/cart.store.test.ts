import { beforeEach, describe, expect, it } from 'vitest';
import { useCartStore, initCartStore } from './cart.store';

const CART_STORAGE_KEY = 'apexgear_cart';
const CART_CHANGE_EVENT = 'apexgear_cart:change';

function seedCart(items: unknown) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items }));
}

describe('useCartStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useCartStore.setState({ items: [], itemCount: 0 });
  });

  it('starts empty', () => {
    expect(useCartStore.getState().items).toEqual([]);
    expect(useCartStore.getState().itemCount).toBe(0);
  });

  it('hydrates valid items from localStorage and sums quantities', () => {
    seedCart([
      { variantId: 'v1', quantity: 2 },
      { variantId: 'v2', quantity: 3 },
    ]);
    useCartStore.getState().hydrateFromLocalStorage();

    expect(useCartStore.getState().items).toHaveLength(2);
    expect(useCartStore.getState().itemCount).toBe(5);
    expect(useCartStore.getState().getCount()).toBe(5);
  });

  it('filters out malformed entries', () => {
    seedCart([
      { variantId: 'v1', quantity: 2 },
      { variantId: 42, quantity: 1 },
      { quantity: 1 },
      { variantId: 'v2', quantity: 'nope' },
      null,
    ]);
    useCartStore.getState().hydrateFromLocalStorage();

    expect(useCartStore.getState().items).toEqual([{ variantId: 'v1', quantity: 2 }]);
    expect(useCartStore.getState().itemCount).toBe(2);
  });

  it('treats missing storage as an empty cart', () => {
    useCartStore.getState().hydrateFromLocalStorage();
    expect(useCartStore.getState().items).toEqual([]);
    expect(useCartStore.getState().itemCount).toBe(0);
  });

  it('treats invalid JSON as an empty cart', () => {
    localStorage.setItem(CART_STORAGE_KEY, '{not json');
    useCartStore.getState().hydrateFromLocalStorage();
    expect(useCartStore.getState().items).toEqual([]);
  });

  it('treats a missing items array as an empty cart', () => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ foo: 'bar' }));
    useCartStore.getState().hydrateFromLocalStorage();
    expect(useCartStore.getState().items).toEqual([]);
  });
});

describe('initCartStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useCartStore.setState({ items: [], itemCount: 0 });
  });

  it('hydrates immediately from localStorage', () => {
    seedCart([{ variantId: 'v1', quantity: 4 }]);
    initCartStore();
    expect(useCartStore.getState().itemCount).toBe(4);
  });

  it('re-hydrates when the custom change event fires', () => {
    initCartStore();
    expect(useCartStore.getState().itemCount).toBe(0);

    seedCart([{ variantId: 'v1', quantity: 7 }]);
    window.dispatchEvent(new Event(CART_CHANGE_EVENT));

    expect(useCartStore.getState().itemCount).toBe(7);
  });
});
