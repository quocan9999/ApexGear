import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '../../i18n';
import ChangePasswordForm from './ChangePasswordForm';

vi.mock('../../services/auth.service', () => ({ authService: { changePassword: vi.fn() } }));
import { authService } from '../../services/auth.service';

beforeEach(() => vi.clearAllMocks());

describe('ChangePasswordForm', () => {
  it('blocks submit when new password and confirm differ', async () => {
    render(<ChangePasswordForm />);
    await userEvent.type(screen.getByLabelText(/mật khẩu hiện tại/i), 'oldpass12');
    await userEvent.type(screen.getByLabelText(/mật khẩu mới/i), 'newpass12');
    await userEvent.type(screen.getByLabelText(/xác nhận/i), 'different12');
    await userEvent.click(screen.getByRole('button', { name: /đổi mật khẩu/i }));
    expect(authService.changePassword).not.toHaveBeenCalled();
    expect(screen.getByText(/không khớp/i)).toBeInTheDocument();
  });

  it('submits a valid change', async () => {
    (authService.changePassword as ReturnType<typeof vi.fn>).mockResolvedValue({ message: 'ok' });
    render(<ChangePasswordForm />);
    await userEvent.type(screen.getByLabelText(/mật khẩu hiện tại/i), 'oldpass12');
    await userEvent.type(screen.getByLabelText(/mật khẩu mới/i), 'newpass12');
    await userEvent.type(screen.getByLabelText(/xác nhận/i), 'newpass12');
    await userEvent.click(screen.getByRole('button', { name: /đổi mật khẩu/i }));
    await waitFor(() => expect(authService.changePassword).toHaveBeenCalledWith(
      { currentPassword: 'oldpass12', newPassword: 'newpass12' }));
  });
});
