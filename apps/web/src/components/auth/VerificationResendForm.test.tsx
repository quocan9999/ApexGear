import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VerificationResendForm from './VerificationResendForm';
import { authService } from '../../services/auth.service';
import '../../i18n';

vi.mock('../../services/auth.service', () => ({
  authService: {
    resendVerification: vi.fn(),
  },
}));

const mockResend = authService.resendVerification as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('VerificationResendForm', () => {
  it('submits the email and shows success copy', async () => {
    mockResend.mockResolvedValueOnce({
      message: 'Nếu email cần xác minh, một email mới đã được gửi.',
    });

    render(<VerificationResendForm initialEmail="user@example.com" />);

    const button = screen.getByRole('button', { name: 'Gửi lại email xác minh' });
    expect(button).toBeInTheDocument();

    await userEvent.click(button);

    await waitFor(() =>
      expect(mockResend).toHaveBeenCalledWith('user@example.com'),
    );
    await waitFor(() =>
      expect(
        screen.getByText('Nếu email cần xác minh, một email mới đã được gửi.'),
      ).toBeInTheDocument(),
    );
  });

  it('displays an error message when resend failure occurs', async () => {
    mockResend.mockRejectedValueOnce(new Error('Gửi lại email thất bại'));

    render(<VerificationResendForm initialEmail="user@example.com" />);

    await userEvent.click(screen.getByRole('button', { name: 'Gửi lại email xác minh' }));

    await waitFor(() =>
      expect(screen.getByText('Gửi lại email thất bại')).toBeInTheDocument(),
    );
  });
});
