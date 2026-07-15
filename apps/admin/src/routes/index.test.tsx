import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter, useLocation } from 'react-router-dom';
import i18n from '../i18n';
import { resetAuthStore, useAuthStore } from '../stores/auth.store';
import type { Role, User } from '../types';
import AppRoutes from './index';

const baseUser: User = {
  id: 'staff-1',
  email: 'staff@apexgear.vn',
  name: 'Staff User',
  phone: null,
  avatar: null,
  role: 'ADMIN',
  provider: 'LOCAL',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const allowedRoutes: Record<Exclude<Role, 'CUSTOMER'>, string[]> = {
  ADMIN: ['/', '/products', '/categories', '/brands', '/orders', '/inventory', '/reviews', '/users', '/coupons', '/settings'],
  CONTENT_MANAGER: ['/', '/products', '/categories', '/brands', '/inventory', '/reviews'],
  INVENTORY_MANAGER: ['/', '/inventory'],
  ORDER_MANAGER: ['/', '/orders'],
};

const pageKeyByPath: Record<string, string> = {
  '/': 'dashboard',
  '/products': 'products',
  '/categories': 'categories',
  '/brands': 'brands',
  '/orders': 'orders',
  '/inventory': 'inventory',
  '/reviews': 'reviews',
  '/users': 'users',
  '/coupons': 'coupons',
  '/settings': 'settings',
};

const deniedRoutes = (Object.entries(allowedRoutes) as [Exclude<Role, 'CUSTOMER'>, string[]][])
  .flatMap(([role, allowedPaths]) =>
    Object.keys(pageKeyByPath)
      .filter((path) => !allowedPaths.includes(path))
      .map((path) => [role, path] as const),
  );

function RouteLocation() {
  const location = useLocation();
  return <output data-testid="route-location">{location.pathname}</output>;
}

function renderRoutes(path: string, role?: Role) {
  useAuthStore.setState({
    user: role ? { ...baseUser, role } : null,
    isAuthenticated: Boolean(role),
    isLoading: false,
  });

  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
      <RouteLocation />
    </MemoryRouter>,
  );
}

describe('admin route tree', () => {
  beforeEach(() => resetAuthStore());

  it('keeps login public', () => {
    renderRoutes('/login');
    expect(screen.getByRole('heading', { name: i18n.t('admin.title') })).toBeInTheDocument();
  });

  it.each(
    Object.entries(allowedRoutes).flatMap(([role, paths]) =>
      paths.map((path) => [role as Exclude<Role, 'CUSTOMER'>, path]),
    ),
  )('allows %s to open %s', async (role, path) => {
    renderRoutes(path, role as Role);

    const pageKey = pageKeyByPath[path];
    expect(
      await screen.findByRole('heading', { level: 2, name: i18n.t(`pages.${pageKey}.title`) }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('route-location')).toHaveTextContent(path);
  });

  it.each(deniedRoutes)(
    'redirects %s away from disallowed route %s to the dashboard',
    async (role, path) => {
      renderRoutes(path, role);

      await waitFor(() => expect(screen.getByTestId('route-location')).toHaveTextContent(/^\/$/));
      expect(
        await screen.findByRole('heading', {
          level: 2,
          name: i18n.t('pages.dashboard.title'),
        }),
      ).toBeInTheDocument();
    },
  );

  it('redirects unauthenticated users to login with the requested route', async () => {
    renderRoutes('/orders');

    await waitFor(() => expect(screen.getByTestId('route-location')).toHaveTextContent('/login'));
    expect(screen.getByRole('heading', { name: i18n.t('admin.title') })).toBeInTheDocument();
  });

  it('blocks customers from the staff shell and sends them to login', async () => {
    renderRoutes('/inventory', 'CUSTOMER');

    await waitFor(() => expect(screen.getByTestId('route-location')).toHaveTextContent('/login'));
    expect(screen.queryByRole('navigation', { name: i18n.t('layout.primaryNavigation') })).not.toBeInTheDocument();
  });
});
