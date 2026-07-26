import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';
import { authService } from '../services/auth.service';
import AcceptInvitationPage from './AcceptInvitationPage';

vi.mock('../services/auth.service', () => ({
  authService: { acceptInvitation: vi.fn() },
}));

describe('AcceptInvitationPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires an invitation token', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/staff/activate']}><AcceptInvitationPage /></MemoryRouter>);

    await user.type(screen.getByLabelText(i18n.t('invitation.password')), 'Admin123');
    await user.type(screen.getByLabelText(i18n.t('invitation.confirmPassword')), 'Admin123');
    await user.click(screen.getByRole('button', { name: i18n.t('invitation.submit') }));

    expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('invitation.invalidToken'));
    expect(authService.acceptInvitation).not.toHaveBeenCalled();
  });

  it('rejects mismatched passwords without submitting', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/staff/activate?token=raw-token']}><AcceptInvitationPage /></MemoryRouter>);

    await user.type(screen.getByLabelText(i18n.t('invitation.password')), 'Admin123');
    await user.type(screen.getByLabelText(i18n.t('invitation.confirmPassword')), 'Admin456');
    await user.click(screen.getByRole('button', { name: i18n.t('invitation.submit') }));

    expect(screen.getByRole('alert')).toHaveTextContent(i18n.t('invitation.passwordMismatch'));
    expect(authService.acceptInvitation).not.toHaveBeenCalled();
  });

  it.each([
    {
      error: { message: 'Liên kết không hợp lệ.', rawMessage: 'Invalid or expired invitation' },
      expected: 'invitation.invalidToken',
    },
    {
      error: { message: 'Máy chủ gặp sự cố.', rawMessage: 'Database unavailable' },
      expected: 'invitation.genericError',
    },
  ])('shows a safe localized error when activation fails', async ({ error, expected }) => {
    const user = userEvent.setup();
    vi.mocked(authService.acceptInvitation).mockRejectedValueOnce(error);
    render(<MemoryRouter initialEntries={['/staff/activate?token=raw-token']}><AcceptInvitationPage /></MemoryRouter>);

    await user.type(screen.getByLabelText(i18n.t('invitation.password')), 'Admin123');
    await user.type(screen.getByLabelText(i18n.t('invitation.confirmPassword')), 'Admin123');
    await user.click(screen.getByRole('button', { name: i18n.t('invitation.submit') }));

    expect(await screen.findByRole('alert')).toHaveTextContent(i18n.t(expected));
    expect(screen.getByRole('alert')).not.toHaveTextContent(error.rawMessage);
  });

  it('toggles each password field independently', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter initialEntries={['/staff/activate?token=raw-token']}><AcceptInvitationPage /></MemoryRouter>);

    const password = screen.getByLabelText(i18n.t('invitation.password'));
    const confirmation = screen.getByLabelText(i18n.t('invitation.confirmPassword'));
    expect(password).toHaveAttribute('type', 'password');
    expect(confirmation).toHaveAttribute('type', 'password');

    const showPasswordButtons = screen.getAllByRole('button', { name: i18n.t('login.showPassword') });
    expect(showPasswordButtons[0]).toHaveAttribute('type', 'button');
    expect(showPasswordButtons[1]).toHaveAttribute('type', 'button');
    await user.click(showPasswordButtons[0]);
    expect(password).toHaveAttribute('type', 'text');
    expect(confirmation).toHaveAttribute('type', 'password');

    await user.click(screen.getAllByRole('button', { name: i18n.t('login.showPassword') })[0]);
    expect(password).toHaveAttribute('type', 'text');
    expect(confirmation).toHaveAttribute('type', 'text');

    await user.click(screen.getAllByRole('button', { name: i18n.t('login.hidePassword') })[0]);
    expect(password).toHaveAttribute('type', 'password');
    expect(confirmation).toHaveAttribute('type', 'text');
  });

  it('submits token and password then shows activation success', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.acceptInvitation).mockResolvedValueOnce({ message: 'Invitation accepted' });
    render(<MemoryRouter initialEntries={['/staff/activate?token=raw-token']}><AcceptInvitationPage /></MemoryRouter>);

    await user.type(screen.getByLabelText(i18n.t('invitation.password')), 'Admin123');
    await user.type(screen.getByLabelText(i18n.t('invitation.confirmPassword')), 'Admin123');
    await user.click(screen.getByRole('button', { name: i18n.t('invitation.submit') }));

    expect(authService.acceptInvitation).toHaveBeenCalledWith('raw-token', 'Admin123');
    expect(await screen.findByRole('status')).toHaveTextContent(i18n.t('invitation.success'));
  });
});
