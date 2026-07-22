import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import '../i18n';

const forgotPassword = vi.fn();
vi.mock('../services/auth.service', () => ({
  authService: {
    forgotPassword: (...args: any[]) => forgotPassword(...args),
  },
}));

import ForgotPasswordPage from './ForgotPasswordPage';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ForgotPasswordPage', () => {
  it('renders success message on success', async () => {
    forgotPassword.mockResolvedValueOnce(undefined);
    render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Gửi email' }));

    await waitFor(() => {
      expect(forgotPassword).toHaveBeenCalledWith('user@example.com');
    });

    await waitFor(() => {
      expect(
        screen.getByText('Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu'),
      ).toBeInTheDocument();
    });
  });

  it('shows visible delivery failure error message when forgotPassword fails', async () => {
    const failureMsg = 'Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.';
    forgotPassword.mockRejectedValueOnce(new Error(failureMsg));

    render(
      <MemoryRouter initialEntries={['/forgot-password']}>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Gửi email' }));

    await waitFor(() => {
      expect(screen.getByText(failureMsg)).toBeInTheDocument();
    });
  });
});
