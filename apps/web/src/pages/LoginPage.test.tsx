import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '../i18n';

const login = vi.fn();
const clearError = vi.fn();
const authState = { login, isLoading: false, error: null as string | null, clearError };
vi.mock('../stores/auth.store', () => ({
  useAuthStore: () => authState,
}));

const mergeGuestCart = vi.fn();
vi.mock('../stores/cart.store', () => ({
  // LoginPage reads the cart store imperatively via useCartStore.getState()
  useCartStore: { getState: () => ({ mergeGuestCart }) },
}));

const navigate = vi.fn();
vi.mock('react-router-dom', async (orig) => ({
  ...(await (orig() as Promise<typeof import('react-router-dom')>)),
  useNavigate: () => navigate,
}));

import LoginPage from './LoginPage';

beforeEach(() => {
  vi.clearAllMocks();
  login.mockResolvedValue(undefined);
  mergeGuestCart.mockResolvedValue(undefined);
  authState.error = null;
  authState.isLoading = false;
});

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText('Email'), 'a@x.com');
  await userEvent.type(screen.getByLabelText('Mật khẩu'), 'secret123');
  await userEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
}

describe('LoginPage', () => {
  it('merges the guest cart and redirects to the ?redirect= target on success', async () => {
    render(
      <MemoryRouter initialEntries={['/login?redirect=%2Faccount']}>
        <LoginPage />
      </MemoryRouter>,
    );
    await fillAndSubmit();

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({ email: 'a@x.com', password: 'secret123' }),
    );
    await waitFor(() => expect(mergeGuestCart).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/account', { replace: true }));
  });

  it('falls back to / when no redirect param is present', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>,
    );
    await fillAndSubmit();

    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/', { replace: true }));
    expect(mergeGuestCart).toHaveBeenCalledTimes(1);
  });

  it('does not merge the cart or navigate when login fails', async () => {
    login.mockRejectedValueOnce(new Error('bad creds'));
    render(
      <MemoryRouter initialEntries={['/login?redirect=%2Faccount']}>
        <LoginPage />
      </MemoryRouter>,
    );
    await fillAndSubmit();

    await waitFor(() => expect(login).toHaveBeenCalledTimes(1));
    expect(mergeGuestCart).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('renders VerificationResendForm when login fails due to unverified email', async () => {
    authState.error = 'Vui lòng xác minh email trước khi đăng nhập';
    render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Vui lòng xác minh email trước khi đăng nhập')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gửi lại email xác minh' })).toBeInTheDocument();
  });
});

