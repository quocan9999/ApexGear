import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VerifyEmailPage from './VerifyEmailPage';
import { authService } from '../services/auth.service';
import '../i18n';

vi.mock('../services/auth.service', () => ({
  authService: {
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
  },
}));

const mockVerifyEmail = authService.verifyEmail as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('VerifyEmailPage', () => {
  it('shows a missing-token state when the query param is absent', () => {
    render(
      <MemoryRouter initialEntries={['/verify-email']}>
        <VerifyEmailPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Liên kết xác minh không hợp lệ hoặc đã hết hạn.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gửi lại email xác minh' })).toBeInTheDocument();
  });

  it('shows a loading state and then success state after a valid token', async () => {
    mockVerifyEmail.mockResolvedValueOnce({ message: 'Xác minh email thành công' });

    render(
      <MemoryRouter initialEntries={['/verify-email?token=valid-token-123']}>
        <VerifyEmailPage />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(mockVerifyEmail).toHaveBeenCalledWith('valid-token-123'),
    );
    await waitFor(() =>
      expect(
        screen.getByText('Xác minh email thành công. Bạn có thể đăng nhập ngay bây giờ.'),
      ).toBeInTheDocument(),
    );
  });

  it('shows an error banner and resend form when verification fails', async () => {
    mockVerifyEmail.mockRejectedValueOnce(new Error('Invalid or expired verification token'));

    render(
      <MemoryRouter initialEntries={['/verify-email?token=invalid-token']}>
        <VerifyEmailPage />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.getByText('Invalid or expired verification token')).toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: 'Gửi lại email xác minh' })).toBeInTheDocument();
  });
});
