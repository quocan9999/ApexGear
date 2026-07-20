import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { authService } from './auth.service';

vi.mock('./api', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authService', () => {
  it('calls the register endpoint and returns the registration message', async () => {
    mockApi.post.mockResolvedValue({
      data: {
        data: { message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản.' },
      },
    });

    const res = await authService.register({
      email: 'test@example.com',
      password: 'Password123',
      name: 'Test User',
    });

    expect(mockApi.post).toHaveBeenCalledWith('/auth/register', {
      email: 'test@example.com',
      password: 'Password123',
      name: 'Test User',
    });
    expect(res.message).toBe('Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản.');
  });

  it('calls verify-email with the token body', async () => {
    mockApi.post.mockResolvedValue({
      data: { data: { message: 'Xác minh email thành công' } },
    });

    const res = await authService.verifyEmail('token-123');

    expect(mockApi.post).toHaveBeenCalledWith('/auth/verify-email', { token: 'token-123' });
    expect(res.message).toBe('Xác minh email thành công');
  });

  it('calls resend-verification with the email body', async () => {
    mockApi.post.mockResolvedValue({
      data: { data: { message: 'Nếu email cần xác minh, một email mới đã được gửi' } },
    });

    const res = await authService.resendVerification('test@example.com');

    expect(mockApi.post).toHaveBeenCalledWith('/auth/resend-verification', {
      email: 'test@example.com',
    });
    expect(res.message).toBe('Nếu email cần xác minh, một email mới đã được gửi');
  });
});
