import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
  register.mockResolvedValue(undefined);
  resendVerification.mockResolvedValue(undefined);
  authState.error = null;
  authState.isLoading = false;
});

describe('RegisterPage', () => {
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
});
