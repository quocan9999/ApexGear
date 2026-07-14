import { create } from 'zustand';

const CART_STORAGE_KEY = 'apexgear_cart';
const CART_CHANGE_EVENT = 'apexgear_cart:change';

export interface CartItem {
  variantId: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  itemCount: number;
  hydrateFromLocalStorage: () => void;
  getCount: () => number;
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

// Phase 2A stub: always reads guest cart from localStorage. When authenticated, this
// still reads localStorage until the cart API task wires a real backend cart.
export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  itemCount: 0,

  hydrateFromLocalStorage: () => {
    const items = readFromStorage();
    set({ items, itemCount: computeCount(items) });
  },

  getCount: () => get().itemCount,
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
