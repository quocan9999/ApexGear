import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import i18n from '../../i18n';
import { resetAuthStore, useAuthStore } from '../../stores/auth.store';
import type { Role, User } from '../../types';
import AdminLayout from './AdminLayout';

const baseUser: User = {
  id: 'staff-1',
  email: 'staff@apexgear.vn',
  name: 'Nguyen Staff',
  phone: null,
  avatar: null,
  role: 'ADMIN',
  provider: 'LOCAL',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function installMatchMedia(initialMatches = false) {
  const eventTarget = new EventTarget();
  const mediaQueryList: MediaQueryList = {
    matches: initialMatches,
    media: '',
    onchange: null,
    addListener: vi.fn((listener) => eventTarget.addEventListener('change', listener)),
    removeListener: vi.fn((listener) => eventTarget.removeEventListener('change', listener)),
    addEventListener: vi.fn((type, listener, options) =>
      eventTarget.addEventListener(type, listener, options),
    ),
    removeEventListener: vi.fn((type, listener, options) =>
      eventTarget.removeEventListener(type, listener, options),
    ),
    dispatchEvent: (event) => eventTarget.dispatchEvent(event),
  };

  vi.stubGlobal('matchMedia', vi.fn((query: string) => {
    Object.defineProperty(mediaQueryList, 'media', { configurable: true, value: query });
    return mediaQueryList;
  }));

  return {
    mediaQueryList,
    setMatches(matches: boolean) {
      Object.defineProperty(mediaQueryList, 'matches', { configurable: true, value: matches });
      const event = new Event('change') as MediaQueryListEvent;
      Object.defineProperties(event, {
        matches: { value: matches },
        media: { value: mediaQueryList.media },
      });
      mediaQueryList.dispatchEvent(event);
    },
  };
}

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderLayout(role: Role = 'ADMIN', entry = '/orders', logout = vi.fn()) {
  useAuthStore.setState({
    user: { ...baseUser, role },
    isAuthenticated: true,
    isLoading: false,
    logout,
  });

  const view = render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path="/orders" element={<div>{i18n.t('pages.orders.description')}</div>} />
          <Route path="/inventory" element={<div>{i18n.t('pages.inventory.description')}</div>} />
        </Route>
        <Route path="/login" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );

  return { logout, unmount: view.unmount };
}

describe('AdminLayout', () => {
  beforeEach(() => {
    resetAuthStore();
    vi.clearAllMocks();
    installMatchMedia();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the complete admin navigation, active state, user identity, role, breadcrumb, and content', () => {
    renderLayout();

    const sidebar = screen.getByRole('complementary', { name: i18n.t('layout.sidebar') });
    expect(sidebar).toHaveClass('w-60', 'lg:visible', 'lg:static');
    const navigation = screen.getByRole('navigation', { name: i18n.t('layout.primaryNavigation') });
    expect(within(navigation).getAllByRole('link')).toHaveLength(10);
    expect(within(navigation).getByRole('link', { name: i18n.t('nav.orders') })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByText(baseUser.name)).toBeInTheDocument();
    expect(screen.getByText(i18n.t('roles.ADMIN'))).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: i18n.t('layout.breadcrumb') })).toHaveTextContent(
      i18n.t('nav.orders'),
    );
    expect(screen.getByText(i18n.t('pages.orders.description'))).toBeInTheDocument();
  });

  it('only renders links allowed for an order manager', () => {
    renderLayout('ORDER_MANAGER');

    const navigation = screen.getByRole('navigation', { name: i18n.t('layout.primaryNavigation') });
    expect(within(navigation).getAllByRole('link')).toHaveLength(2);
    expect(within(navigation).getByRole('link', { name: i18n.t('nav.dashboard') })).toBeInTheDocument();
    expect(within(navigation).getByRole('link', { name: i18n.t('nav.orders') })).toBeInTheDocument();
    expect(within(navigation).queryByRole('link', { name: i18n.t('nav.products') })).not.toBeInTheDocument();
  });

  it('supports keyboard-operable desktop collapse and persists the preference', async () => {
    const user = userEvent.setup();
    renderLayout();

    const toggle = screen.getByRole('button', { name: i18n.t('layout.collapseSidebar') });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    toggle.focus();
    await user.keyboard('{Enter}');

    expect(screen.getByRole('complementary', { name: i18n.t('layout.sidebar') })).toHaveAttribute(
      'data-collapsed',
      'true',
    );
    expect(screen.getByRole('complementary', { name: i18n.t('layout.sidebar') })).toHaveClass(
      'lg:w-20',
    );
    expect(screen.getByRole('button', { name: i18n.t('layout.expandSidebar') })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(localStorage.getItem('admin.sidebar.collapsed')).toBe('true');
  });

  it('clears mobile modal state when the viewport crosses the desktop breakpoint', async () => {
    const { mediaQueryList, setMatches } = installMatchMedia(false);
    const user = userEvent.setup();
    const { unmount } = renderLayout();

    const open = screen.getByRole('button', { name: i18n.t('layout.openMenu') });
    await user.click(open);

    expect(screen.getByRole('dialog', { name: i18n.t('layout.sidebar') })).toHaveAttribute(
      'aria-modal',
      'true',
    );
    expect(screen.getByRole('button', { name: i18n.t('layout.closeMenuBackdrop') })).toBeInTheDocument();
    expect(open.closest('[inert]')).not.toBeNull();

    act(() => setMatches(true));

    const sidebar = screen.getByRole('complementary', { name: i18n.t('layout.sidebar') });
    expect(sidebar).not.toHaveAttribute('aria-modal');
    expect(sidebar).toHaveAttribute('data-mobile-open', 'false');
    expect(screen.queryByRole('button', { name: i18n.t('layout.closeMenuBackdrop') })).not.toBeInTheDocument();
    expect(open.closest('[inert]')).toBeNull();
    expect(open.closest('[aria-hidden="true"]')).toBeNull();
    expect(open).not.toHaveFocus();

    expect(mediaQueryList.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    unmount();
    expect(mediaQueryList.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('contains focus in the modal mobile navigation and restores it for every close path', async () => {
    const user = userEvent.setup();
    renderLayout();

    const open = screen.getByRole('button', { name: i18n.t('layout.openMenu') });
    expect(open).toHaveAttribute('aria-expanded', 'false');
    await user.click(open);

    const dialog = screen.getByRole('dialog', { name: i18n.t('layout.sidebar') });
    const close = within(dialog).getByRole('button', { name: i18n.t('layout.closeMenu') });
    const links = within(dialog).getAllByRole('link');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('data-mobile-open', 'true');
    expect(close).toHaveFocus();
    expect(open.closest('[inert]')).not.toBeNull();

    await user.tab({ shift: true });
    expect(links.at(-1)).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(open).toHaveAttribute('aria-expanded', 'false');
    expect(open).toHaveFocus();

    await user.click(open);
    await user.click(screen.getByRole('button', { name: i18n.t('layout.closeMenuBackdrop') }));
    expect(open).toHaveAttribute('aria-expanded', 'false');
    expect(open).toHaveFocus();

    await user.click(open);
    await user.click(screen.getByRole('button', { name: i18n.t('layout.closeMenu') }));
    expect(open).toHaveAttribute('aria-expanded', 'false');
    expect(open).toHaveFocus();

    await user.click(open);
    await user.click(within(screen.getByRole('dialog')).getByRole('link', { name: i18n.t('nav.inventory') }));
    expect(open).toHaveAttribute('aria-expanded', 'false');
    expect(open).toHaveFocus();
    expect(screen.getByText(i18n.t('pages.inventory.description'))).toBeInTheDocument();
  });

  it('logs out and navigates to the public login page', async () => {
    const user = userEvent.setup();
    const logout = vi.fn().mockResolvedValue(undefined);
    renderLayout('ADMIN', '/orders', logout);

    await user.click(screen.getByRole('button', { name: i18n.t('nav.logout') }));

    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('location')).toHaveTextContent('/login');
  });
});
