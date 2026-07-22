import { beforeEach, describe, expect, it, vi } from 'vitest';
import '../i18n';
import { useAuthStore } from './auth.store';
import { authService } from '../services/auth.service';

vi.mock('../services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
  },
}));

const mockedAuthService = vi.mocked(authService);

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('normalizes unverified login errors to a stable i18n key', async () => {
    mockedAuthService.login.mockRejectedValueOnce(
      new Error('Vui lòng xác minh email trước khi đăng nhập'),
    );

    await expect(
      useAuthStore.getState().login({ email: 'a@x.com', password: 'secret123' }),
    ).rejects.toThrow('Vui lòng xác minh email trước khi đăng nhập');

    expect(useAuthStore.getState().error).toBe('Vui lòng xác minh email trước khi đăng nhập');
  });

  it('normalizes common backend login errors to localized copy', async () => {
    mockedAuthService.login.mockRejectedValueOnce(new Error('Invalid credentials'));

    await expect(
      useAuthStore.getState().login({ email: 'a@x.com', password: 'wrong' }),
    ).rejects.toThrow('Invalid credentials');

    expect(useAuthStore.getState().error).toBe('Sai tài khoản hoặc mật khẩu.');
  });

  it('normalizes API error objects before storing register errors', async () => {
    mockedAuthService.register.mockRejectedValueOnce({
      message: { text: 'raw backend object' },
      status: 400,
    });

    await expect(
      useAuthStore.getState().register({
        email: 'a@x.com',
        password: 'Password123',
        name: 'User',
      }),
    ).rejects.toMatchObject({ status: 400 });

    expect(useAuthStore.getState().error).toBe('Có lỗi xảy ra. Vui lòng thử lại.');
  });

  it('normalizes API error objects before storing login errors', async () => {
    mockedAuthService.login.mockRejectedValueOnce({
      message: { text: 'Vui lòng xác minh email trước khi đăng nhập' },
      status: 400,
    });

    await expect(
      useAuthStore.getState().login({ email: 'a@x.com', password: 'secret123' }),
    ).rejects.toMatchObject({ status: 400 });

    expect(useAuthStore.getState().error).toBe('Có lỗi xảy ra. Vui lòng thử lại.');
  });
});
