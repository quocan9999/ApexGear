import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';
import type { User } from '../types';
import { UsersPage } from './UsersPage';

vi.mock('../services/users.service', () => ({
  usersService: {
    list: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    restore: vi.fn(),
    unlock: vi.fn(),
  },
}));

vi.mock('../stores/auth.store', () => ({
  useAuthStore: Object.assign(
    (selector: (s: { user: { id: string } }) => unknown) =>
      selector({ user: { id: 'u-admin' } }),
    { getState: () => ({ user: { id: 'u-admin' } }) },
    { setState: vi.fn() },
  ),
}));

import { usersService } from '../services/users.service';

const adminUser: User = {
  id: 'u-admin',
  email: 'admin@apexgear.vn',
  name: 'Admin',
  phone: null,
  avatar: null,
  role: 'ADMIN',
  provider: 'local',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const cmUser: User = {
  ...adminUser,
  id: 'u-cm',
  email: 'content@apexgear.vn',
  name: 'Content Manager',
  role: 'CONTENT_MANAGER',
};

const lockedUser: User = {
  ...adminUser,
  id: 'u-locked',
  email: 'locked@apexgear.vn',
  name: 'Locked User',
  role: 'CUSTOMER',
  lockedUntil: '2027-01-01T00:00:00.000Z',
};

function renderPage() {
  return render(<UsersPage />);
}

describe('UsersPage', () => {
  beforeEach(() => {
    vi.mocked(usersService.list).mockReset().mockResolvedValue({
      data: [adminUser, cmUser, lockedUser],
      meta: { page: 1, limit: 20, total: 3, totalPages: 1 },
    });
    vi.mocked(usersService.update).mockReset().mockResolvedValue(adminUser);
    vi.mocked(usersService.remove).mockReset().mockResolvedValue({} as never);
    vi.mocked(usersService.restore).mockReset().mockResolvedValue(adminUser);
    vi.mocked(usersService.unlock).mockReset().mockResolvedValue(adminUser);
  });

  it('renders user list with names and emails', async () => {
    renderPage();
    expect(await screen.findByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Content Manager')).toBeInTheDocument();
    expect(screen.getByText('Locked User')).toBeInTheDocument();
    expect(screen.getByText('admin@apexgear.vn')).toBeInTheDocument();
  });

  it('locked user shows locked badge and unlock button', async () => {
    renderPage();
    await screen.findByText('Admin');
    expect(screen.getAllByText(i18n.t('pages.users.status.locked')).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: i18n.t('pages.users.actions.unlock') })).toBeInTheDocument();
  });

  it('change role calls update', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Admin');

    const selects = screen.getAllByLabelText(i18n.t('pages.users.actions.changeRole'));
    // Find the one for the non-self user (u-cm, not disabled)
    const cmSelect = selects[1]; // second user
    await user.selectOptions(cmSelect, 'ORDER_MANAGER');

    await waitFor(() => {
      expect(usersService.update).toHaveBeenCalledWith('u-cm', { role: 'ORDER_MANAGER' });
    });
  });

  it('delete user opens confirm dialog and calls remove', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Admin');

    const deleteButtons = screen.getAllByRole('button', { name: i18n.t('common.delete') });
    // click delete for the content manager (not self)
    await user.click(deleteButtons[1]);

    expect(screen.getByText(i18n.t('pages.users.actions.deleteWarning'))).toBeInTheDocument();

    const confirmButtons = screen.getAllByRole('button', { name: i18n.t('common.delete') });
    await user.click(confirmButtons[confirmButtons.length - 1]); // confirm in dialog

    await waitFor(() => {
      expect(usersService.remove).toHaveBeenCalledWith('u-cm');
    });
  });
});
