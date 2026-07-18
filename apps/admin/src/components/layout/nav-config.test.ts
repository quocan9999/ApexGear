import { describe, expect, it } from 'vitest';
import type { Role } from '../../types';
import { NAV_ITEMS, visibleNav } from './nav-config';

const expectedByRole: Record<Role, string[]> = {
  ADMIN: [
    'dashboard',
    'products',
    'categories',
    'brands',
    'orders',
    'inventory',
    'reviews',
    'users',
    'coupons',
    'shipping',
    'settings',
  ],
  CONTENT_MANAGER: [
    'dashboard',
    'products',
    'categories',
    'brands',
    'inventory',
    'reviews',
  ],
  INVENTORY_MANAGER: ['dashboard', 'inventory'],
  ORDER_MANAGER: ['dashboard', 'orders'],
  CUSTOMER: [],
};

describe('navigation role matrix', () => {
  it('defines eleven unique destinations', () => {
    expect(NAV_ITEMS).toHaveLength(11);
    expect(new Set(NAV_ITEMS.map((item) => item.key))).toHaveLength(11);
    expect(new Set(NAV_ITEMS.map((item) => item.to))).toHaveLength(11);
  });

  it.each(Object.entries(expectedByRole) as [Role, string[]][])(
    'returns the exact ordered navigation for %s',
    (role, expectedKeys) => {
      expect(visibleNav(role).map((item) => item.key)).toEqual(expectedKeys);
    },
  );
});
