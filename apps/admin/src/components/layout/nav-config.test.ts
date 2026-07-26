import { describe, expect, it } from 'vitest';
import type { Role } from '../../types';
import { NAV_ITEMS, visibleNav } from './nav-config';

const expectedByRole: Record<Role, string[]> = {
  SUPER_ADMIN: [
    'dashboard',
    'products',
    'categories',
    'brands',
    'orders',
    'inventory',
    'reviews',
    'customers',
    'staff',
    'coupons',
    'shipping',
    'settings',
  ],
  ADMIN: [
    'dashboard',
    'products',
    'categories',
    'brands',
    'orders',
    'inventory',
    'reviews',
    'customers',
    'staff',
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
    'coupons',
  ],
  INVENTORY_MANAGER: ['dashboard', 'products', 'orders', 'inventory'],
  ORDER_MANAGER: ['dashboard', 'products', 'orders', 'shipping'],
  CUSTOMER: [],
};

describe('navigation role matrix', () => {
  it('defines twelve unique destinations', () => {
    expect(NAV_ITEMS).toHaveLength(12);
    expect(new Set(NAV_ITEMS.map((item) => item.key))).toHaveLength(12);
    expect(new Set(NAV_ITEMS.map((item) => item.to))).toHaveLength(12);
  });

  it.each(Object.entries(expectedByRole) as [Role, string[]][])(
    'returns the exact ordered navigation for %s',
    (role, expectedKeys) => {
      expect(visibleNav(role).map((item) => item.key)).toEqual(expectedKeys);
    },
  );
});
