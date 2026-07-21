import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
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

const resendVerification = vi.fn();
vi.mock('../services/auth.service', () => ({
  authService: {
    resendVerification: (...args: any[]) => resendVerification(...args),
  },
}));

const navigate = vi.fn();
vi.mock('react-router-dom', async (orig) => ({
  ...(await (orig() as Promise<typeof import('react-router-dom')>)),
  useNavigate: () => navigate,
}));

import LoginPage from './LoginPage';

beforeEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
  login.mockResolvedValue(undefined);
  mergeGuestCart.mockResolvedValue(undefined);
  resendVerification.mockResolvedValue(undefined);
  authState.error = null;
  authState.isLoading = false;
});

afterEach(() => {
  vi.useRealTimers();
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

  it('shows inline field errors and blocks submit for empty login fields', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(screen.getByText('Email là bắt buộc')).toBeInTheDocument();
    expect(screen.getByText('Mật khẩu là bắt buộc')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('shows unverified email copy with compact resend action and 60 second cooldown', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    login.mockRejectedValueOnce(new Error('Vui lòng xác minh email trước khi đăng nhập'));

    render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Email'), 'a@x.com');
    await user.type(screen.getByLabelText('Mật khẩu'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    await waitFor(() => {
      expect(
        screen.getByText(
          'Email này đã được đăng ký nhưng chưa xác thực. Chúng tôi đã gửi lại email xác thực, vui lòng kiểm tra hộp thư.',
        ),
      ).toBeInTheDocument();
    });
    expect(resendVerification).toHaveBeenCalledWith('a@x.com');
    expect(screen.getAllByLabelText('Email')).toHaveLength(1);

    const resendButton = await screen.findByRole('button', { name: /Gửi lại sau 60s/i });
    expect(resendButton).toBeDisabled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_000);
    });
    expect(screen.getByRole('button', { name: /Gửi lại sau 59s/i })).toBeDisabled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(59_000);
    });

    const readyButton = screen.getByRole('button', { name: 'Gửi lại email' });
    expect(readyButton).toBeEnabled();

    await user.click(readyButton);

    await waitFor(() => expect(resendVerification).toHaveBeenCalledTimes(2));
    expect(resendVerification).toHaveBeenLastCalledWith('a@x.com');
    expect(screen.getByRole('button', { name: /Gửi lại sau 60s/i })).toBeDisabled();
  });
});

