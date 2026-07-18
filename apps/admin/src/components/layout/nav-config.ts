import { ALL_STAFF_ROLES, CONTENT_ROLES } from '@apexgear/shared';
import type { Role } from '../../types';

export type NavKey =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'brands'
  | 'orders'
  | 'inventory'
  | 'reviews'
  | 'users'
  | 'coupons'
  | 'shipping'
  | 'settings';

export type NavIcon =
  | 'dashboard'
  | 'box'
  | 'category'
  | 'brand'
  | 'orders'
  | 'inventory'
  | 'reviews'
  | 'users'
  | 'coupon'
  | 'shipping'
  | 'settings';

export interface NavItem {
  key: NavKey;
  to: string;
  icon: NavIcon;
  roles: readonly Role[];
}

export const NAV_ITEMS: readonly NavItem[] = [
  { key: 'dashboard', to: '/', icon: 'dashboard', roles: ALL_STAFF_ROLES },
  { key: 'products', to: '/products', icon: 'box', roles: CONTENT_ROLES },
  { key: 'categories', to: '/categories', icon: 'category', roles: CONTENT_ROLES },
  { key: 'brands', to: '/brands', icon: 'brand', roles: CONTENT_ROLES },
  { key: 'orders', to: '/orders', icon: 'orders', roles: ['ADMIN', 'ORDER_MANAGER'] },
  {
    key: 'inventory',
    to: '/inventory',
    icon: 'inventory',
    roles: ['ADMIN', 'CONTENT_MANAGER', 'INVENTORY_MANAGER'],
  },
  { key: 'reviews', to: '/reviews', icon: 'reviews', roles: CONTENT_ROLES },
  { key: 'users', to: '/users', icon: 'users', roles: ['ADMIN'] },
  { key: 'coupons', to: '/coupons', icon: 'coupon', roles: ['ADMIN'] },
  { key: 'shipping', to: '/shipping', icon: 'shipping', roles: ['ADMIN'] },
  { key: 'settings', to: '/settings', icon: 'settings', roles: ['ADMIN'] },
];

export function visibleNav(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

export function navItemForPath(pathname: string): NavItem {
  return NAV_ITEMS.find((item) => item.to === pathname) ?? NAV_ITEMS[0];
}
