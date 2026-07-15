import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import i18n from '../i18n';
import { resetAuthStore, useAuthStore } from '../stores/auth.store';
import type { User } from '../types';
import LoginPage from './LoginPage';

const admin: User = {
  id: 'admin-1',
  email: 'admin@apexgear.vn',
  name: 'ApexGear Admin',
  phone: null,
  avatar: null,
  role: 'CONTENT_MANAGER',
  provider: 'LOCAL',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="destination">{location.pathname}{location.search}</div>;
}

function renderLogin(entry = '/login') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

async function submitForm() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(i18n.t('login.email')), admin.email);
  await user.type(screen.getByLabelText(i18n.t('login.password')), 'Admin123');
  await user.click(screen.getByRole('button', { name: i18n.t('login.submit') }));
  return user;
}

describe('LoginPage', () => {
  beforeEach(() => {
    resetAuthStore();
    useAuthStore.setState({ isLoading: false });
  });

  it('renders accessible fields with HTML validation', () => {
    renderLogin();

    const email = screen.getByLabelText(i18n.t('login.email'));
    const password = screen.getByLabelText(i18n.t('login.password'));
    expect(email).toHaveAttribute('type', 'email');
    expect(email).toBeRequired();
    expect(password).toHaveAttribute('type', 'password');
    expect(password).toBeRequired();
    expect(password).toHaveAttribute('minLength', '8');
  });

  it('toggles password visibility with an accessible control', async () => {
    const user = userEvent.setup();
    renderLogin();

    const password = screen.getByLabelText(i18n.t('login.password'));
    await user.click(screen.getByRole('button', { name: i18n.t('login.showPassword') }));
    expect(password).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: i18n.t('login.hidePassword') })).toBeInTheDocument();
  });

  it('submits credentials and redirects a staff user using the returned user, not stale render state', async () => {
    const login = vi.fn().mockResolvedValue(admin);
    useAuthStore.setState({ login });
    renderLogin('/login?redirect=%2Forders%3Fstatus%3DPENDING');

    await submitForm();

    expect(login).toHaveBeenCalledWith({ email: admin.email, password: 'Admin123' });
    await waitFor(() => {
      expect(screen.getByTestId('destination')).toHaveTextContent('/orders?status=PENDING');
    });
    expect(useAuthStore.getState().user).toBeNull();
  });

  it.each([
    '/login?redirect=https%3A%2F%2Fevil.example',
    '/login?redirect=%2F%2Fevil.example%2Fadmin',
  ])('blocks an unsafe redirect and navigates to the admin root', async (entry) => {
    useAuthStore.setState({ login: vi.fn().mockResolvedValue(admin) });
    renderLogin(entry);

    await submitForm();

    await waitFor(() => expect(screen.getByTestId('destination')).toHaveTextContent(/^\/$/));
  });

  it('logs out customers, shows the unauthorized message, and does not navigate', async () => {
    const customer = { ...admin, role: 'CUSTOMER' as const };
    const logout = vi.fn().mockResolvedValue(undefined);
    useAuthStore.setState({ login: vi.fn().mockResolvedValue(customer), logout });
    renderLogin('/login?redirect=%2Forders');

    await submitForm();

    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('login.unauthorized'));
    expect(screen.queryByTestId('destination')).not.toBeInTheDocument();
  });

  it('shows API errors in an accessible inline alert', async () => {
    useAuthStore.setState({
      login: vi.fn().mockRejectedValue({ message: 'Sai email hoặc mật khẩu', status: 401 }),
    });
    renderLogin();

    await submitForm();

    expect(await screen.findByRole('alert')).toHaveTextContent('Sai email hoặc mật khẩu');
  });

  it('disables controls, shows progress, and prevents duplicate submissions', async () => {
    let resolveLogin!: (user: User) => void;
    const login = vi.fn(() => new Promise<User>((resolve) => {
      resolveLogin = resolve;
    }));
    useAuthStore.setState({ login });
    renderLogin();

    const user = await submitForm();

    expect(screen.getByLabelText(i18n.t('login.email'))).toBeDisabled();
    expect(screen.getByLabelText(i18n.t('login.password'))).toBeDisabled();
    const submit = screen.getByRole('button', { name: i18n.t('login.submit') });
    expect(submit).toBeDisabled();
    expect(screen.getByRole('status', { name: i18n.t('login.submitting') })).toBeInTheDocument();
    await user.click(submit);
    expect(login).toHaveBeenCalledTimes(1);

    resolveLogin(admin);
    await waitFor(() => expect(screen.getByTestId('destination')).toHaveTextContent(/^\/$/));
  });
});
