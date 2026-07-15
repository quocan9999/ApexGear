import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import i18n from '../i18n';
import { resetAuthStore, useAuthStore } from '../stores/auth.store';
import type { Role, User } from '../types';
import RoleRoute from './RoleRoute';

const baseUser: User = {
  id: 'user-1',
  email: 'staff@apexgear.vn',
  name: 'Staff',
  phone: null,
  avatar: null,
  role: 'ADMIN',
  provider: 'LOCAL',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}{location.search}</div>;
}

function renderRoute(allow?: Role[]) {
  return render(
    <MemoryRouter initialEntries={['/orders?page=2']}>
      <Routes>
        <Route element={<RoleRoute allow={allow} />}>
          <Route path="/orders" element={<div>Protected content</div>} />
        </Route>
        <Route path="/login" element={<LocationProbe />} />
        <Route path="/" element={<LocationProbe />} />
        <Route element={<Outlet />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RoleRoute', () => {
  beforeEach(() => resetAuthStore());

  it('shows an accessible fullscreen spinner while auth resolves', () => {
    renderRoute();

    const spinner = screen.getByRole('status', { name: i18n.t('common.loading') });
    expect(spinner.parentElement).toHaveClass('fixed', 'inset-0');
  });

  it('redirects unauthenticated users to login with the original path and search', async () => {
    useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });

    renderRoute();

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/login?redirect=%2Forders%3Fpage%3D2',
      );
    });
  });

  it('redirects authenticated users without a user to login', async () => {
    useAuthStore.setState({ user: null, isAuthenticated: true, isLoading: false });

    renderRoute();

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/login'));
  });

  it.each<Role>(['ADMIN', 'CONTENT_MANAGER', 'INVENTORY_MANAGER', 'ORDER_MANAGER'])(
    'allows the default staff role %s',
    (role) => {
      useAuthStore.setState({
        user: { ...baseUser, role },
        isAuthenticated: true,
        isLoading: false,
      });

      renderRoute();

      expect(screen.getByText('Protected content')).toBeInTheDocument();
    },
  );

  it('redirects customers to the public login page', async () => {
    useAuthStore.setState({
      user: { ...baseUser, role: 'CUSTOMER' },
      isAuthenticated: true,
      isLoading: false,
    });

    renderRoute();

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent('/login'));
  });

  it('honors an explicit role allow-list', async () => {
    useAuthStore.setState({ user: baseUser, isAuthenticated: true, isLoading: false });

    renderRoute(['ORDER_MANAGER']);

    await waitFor(() => expect(screen.getByTestId('location')).toHaveTextContent(/^\/$/));
  });
});
