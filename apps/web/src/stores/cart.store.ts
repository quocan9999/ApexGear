import { create } from 'zustand';
import { cartService } from '../services/cart.service';
import { useAuthStore } from './auth.store';
import type { Cart } from '../types';

const CART_STORAGE_KEY = 'apexgear_cart';
const CART_CHANGE_EVENT = 'apexgear_cart:change';

// Shared so concurrent reconcile callers reuse one merge instead of racing.
let mergeInFlight: Promise<void> | null = null;

export interface CartItem {
  variantId: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  itemCount: number;
  cart: Cart | null;
  isSyncing: boolean;
  error: string | null;
  hydrateFromLocalStorage: () => void;
  getCount: () => number;
  loadServerCart: () => Promise<void>;
  addItem: (variantId: string, quantity: number) => Promise<void>;
  updateItem: (id: string, quantity: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  mergeGuestCart: () => Promise<void>;
}

function readFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { items?: CartItem[] };
    if (!parsed?.items || !Array.isArray(parsed.items)) return [];
    return parsed.items.filter(
      (item): item is CartItem =>
        !!item && typeof item.variantId === 'string' && typeof item.quantity === 'number',
    );
  } catch {
    return [];
  }
}

function computeCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
}

function writeGuestItems(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items }));
  window.dispatchEvent(new Event(CART_CHANGE_EVENT));
}

function countServerCart(cart: Cart): number {
  return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

// Phase 2A stub: always reads guest cart from localStorage. When authenticated, this
// still reads localStorage until the cart API task wires a real backend cart.
export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  itemCount: 0,
  cart: null,
  isSyncing: false,
  error: null,

  hydrateFromLocalStorage: () => {
    const items = readFromStorage();
    // When authenticated the badge must reflect the SERVER cart. Guest
    // localStorage may still hold stale items (e.g. added before the session
    // was restored), so never let it overwrite the server-derived itemCount.
    if (useAuthStore.getState().isAuthenticated) {
      set({ items });
      return;
    }
    set({ items, itemCount: computeCount(items) });
  },

  getCount: () => get().itemCount,

  loadServerCart: async () => {
    if (!useAuthStore.getState().isAuthenticated) return;
    set({ isSyncing: true, error: null });
    try {
      const cart = await cartService.get();
      set({ cart, itemCount: countServerCart(cart), isSyncing: false });
    } catch (err) {
      set({ error: (err as { message?: string }).message ?? 'error', isSyncing: false });
    }
  },

  addItem: async (variantId: string, quantity: number) => {
    if (useAuthStore.getState().isAuthenticated) {
      const cart = await cartService.addItem(variantId, quantity);
      set({ cart, itemCount: countServerCart(cart) });
      return;
    }
    const items = readFromStorage();
    const existing = items.find((i) => i.variantId === variantId);
    if (existing) existing.quantity += quantity;
    else items.push({ variantId, quantity });
    writeGuestItems(items);
    set({ items, itemCount: computeCount(items) });
  },

  updateItem: async (id: string, quantity: number) => {
    if (useAuthStore.getState().isAuthenticated) {
      const cart = await cartService.updateItem(id, quantity);
      set({ cart, itemCount: countServerCart(cart) });
      return;
    }
    const items = readFromStorage().map((i) => (i.variantId === id ? { ...i, quantity } : i));
    writeGuestItems(items);
    set({ items, itemCount: computeCount(items) });
  },

  removeItem: async (id: string) => {
    if (useAuthStore.getState().isAuthenticated) {
      const cart = await cartService.removeItem(id);
      set({ cart, itemCount: countServerCart(cart) });
      return;
    }
    const items = readFromStorage().filter((i) => i.variantId !== id);
    writeGuestItems(items);
    set({ items, itemCount: computeCount(items) });
  },

  mergeGuestCart: async () => {
    // Reuse an in-flight reconcile so concurrent callers (root reconcile +
    // LoginPage/RegisterPage/AuthCallbackPage) can't double-merge guest items.
    if (mergeInFlight) return mergeInFlight;
    mergeInFlight = (async () => {
      try {
        const guest = readFromStorage();
        if (guest.length > 0) {
          const cart = await cartService.merge(
            guest.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
          );
          if (typeof window !== 'undefined') window.localStorage.removeItem(CART_STORAGE_KEY);
          set({ cart, items: [], itemCount: countServerCart(cart) });
          return;
        }
        await get().loadServerCart();
      } finally {
        mergeInFlight = null;
      }
    })();
    return mergeInFlight;
  },
}));

export function initCartStore(): void {
  if (typeof window === 'undefined') return;
  useCartStore.getState().hydrateFromLocalStorage();
  window.addEventListener('storage', (e) => {
    if (e.key === null || e.key === CART_STORAGE_KEY) {
      useCartStore.getState().hydrateFromLocalStorage();
    }
  });
  window.addEventListener(CART_CHANGE_EVENT, () => {
    useCartStore.getState().hydrateFromLocalStorage();
  });
}
