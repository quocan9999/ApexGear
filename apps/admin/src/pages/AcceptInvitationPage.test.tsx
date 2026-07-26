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
