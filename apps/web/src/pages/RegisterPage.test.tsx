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

    // Check success panel copy
    await waitFor(() => {
      expect(screen.getByText('Đăng ký thành công')).toBeInTheDocument();
      expect(
        screen.getByText('Vui lòng kiểm tra email và xác minh tài khoản trước khi đăng nhập.'),
      ).toBeInTheDocument();
    });

    // Check resend form is present with pre-filled email
    const resendInput = screen.getByLabelText('Email') as HTMLInputElement;
    expect(resendInput.value).toBe('test@example.com');
    expect(screen.getByRole('button', { name: 'Gửi lại email xác minh' })).toBeInTheDocument();

    // Check link to login
    const loginLink = screen.getByRole('link', { name: 'Đăng nhập' });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.getAttribute('href')).toBe('/login');
  });
});
