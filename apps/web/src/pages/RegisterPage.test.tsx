import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '../i18n';

const register = vi.fn();
const clearError = vi.fn();
const authState = { register, isLoading: false, error: null as string | null, clearError };
vi.mock('../stores/auth.store', () => ({
  useAuthStore: () => authState,
}));

const resendVerification = vi.fn();
vi.mock('../services/auth.service', () => ({
  authService: {
    resendVerification: (...args: any[]) => resendVerification(...args),
  },
}));

import RegisterPage from './RegisterPage';

beforeEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
  register.mockResolvedValue(undefined);
  resendVerification.mockResolvedValue(undefined);
  authState.error = null;
  authState.isLoading = false;
});

afterEach(() => {
  vi.useRealTimers();
});

describe('RegisterPage', () => {
  it('shows inline field errors and blocks submit for empty registration fields', async () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <RegisterPage />
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Đăng ký' }));

    expect(screen.getByText('Họ tên là bắt buộc')).toBeInTheDocument();
    expect(screen.getByText('Email là bắt buộc')).toBeInTheDocument();
    expect(screen.getByText('Mật khẩu là bắt buộc')).toBeInTheDocument();
    expect(screen.getByText('Xác nhận mật khẩu là bắt buộc')).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it('shows verification success panel and resend form on successful registration without navigating', async () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <RegisterPage />
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText('Họ tên'), 'Nguyen Van A');
    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
    await userEvent.type(screen.getByLabelText('Mật khẩu'), 'Password123');
    await userEvent.type(screen.getByLabelText('Xác nhận mật khẩu'), 'Password123');

    await userEvent.click(screen.getByRole('button', { name: 'Đăng ký' }));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith({
        name: 'Nguyen Van A',
        email: 'test@example.com',
        password: 'Password123',
      });
    });

    // Check Stitch-inspired verification panel copy
    await waitFor(() => {
      expect(screen.getByText('Kiểm tra hộp thư của bạn')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Chúng tôi đã gửi liên kết xác minh đến email của bạn. Vui lòng nhấn vào liên kết trong email để kích hoạt tài khoản và bắt đầu mua sắm.',
        ),
      ).toBeInTheDocument();
    });
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Cần hỗ trợ?')).toBeInTheDocument();

    // Check resend action uses the registration email without letting the user edit it
    expect(screen.queryByRole('textbox', { name: 'Email' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Gửi lại email xác minh' }));
    await waitFor(() => expect(resendVerification).toHaveBeenCalledWith('test@example.com'));

    // Check links to login and mailbox
    const loginLink = screen.getByRole('link', { name: 'Đăng nhập' });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.getAttribute('href')).toBe('/login');
    expect(screen.getByRole('link', { name: 'Mở hộp thư' })).toHaveAttribute('href', 'https://mail.google.com');
  });

  it('shows duplicate email copy with compact resend action and 60 second cooldown', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    register.mockImplementationOnce(async () => {
      authState.error = 'Email này đã được đăng ký. Chúng tôi đã gửi lại email xác thực, vui lòng kiểm tra hộp thư.';
      throw new Error('Email already registered');
    });
    resendVerification.mockResolvedValue(undefined);
    authState.error = null;
    authState.isLoading = false;

    render(
      <MemoryRouter initialEntries={['/register']}>
        <RegisterPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Họ tên'), 'Nguyen Van A');
    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Mật khẩu'), 'Password123');
    await user.type(screen.getByLabelText('Xác nhận mật khẩu'), 'Password123');

    await user.click(screen.getByRole('button', { name: 'Đăng ký' }));

    await waitFor(() => expect(resendVerification).toHaveBeenCalledWith('test@example.com'));
    expect(
      screen.getByText('Email này đã được đăng ký. Chúng tôi đã gửi lại email xác thực, vui lòng kiểm tra hộp thư.'),
    ).toBeInTheDocument();
    expect(screen.getAllByLabelText('Email')).toHaveLength(1);

    expect(await screen.findByRole('button', { name: /Gửi lại sau 60s/i })).toBeDisabled();

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
    expect(resendVerification).toHaveBeenLastCalledWith('test@example.com');
    expect(screen.getByRole('button', { name: /Gửi lại sau 60s/i })).toBeDisabled();
  });
});
