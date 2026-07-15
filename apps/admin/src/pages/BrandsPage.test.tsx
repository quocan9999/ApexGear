import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';
import { useAuthStore } from '../stores/auth.store';
import type { Brand, User } from '../types';
import { BrandsPage } from './BrandsPage';

vi.mock('../services/brands.service', () => ({
  brandsService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import { brandsService } from '../services/brands.service';

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

const contentManager: User = {
  ...adminUser,
  id: 'u-cm',
  email: 'content@apexgear.vn',
  name: 'Content',
  role: 'CONTENT_MANAGER',
};

const brand: Brand = {
  id: 'b1',
  name: 'Sony',
  slug: 'sony',
  description: null,
  logo: null,
  website: 'https://www.sony.com',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderPage() {
  return render(<BrandsPage />);
}

describe('BrandsPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: adminUser, isAuthenticated: true, isLoading: false });
    vi.mocked(brandsService.list).mockReset();
    vi.mocked(brandsService.create).mockReset();
    vi.mocked(brandsService.update).mockReset();
    vi.mocked(brandsService.remove).mockReset();
    vi.mocked(brandsService.list).mockResolvedValue({
      data: [brand],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    vi.mocked(brandsService.create).mockResolvedValue(brand);
    vi.mocked(brandsService.update).mockResolvedValue(brand);
    vi.mocked(brandsService.remove).mockResolvedValue(brand);
  });

  it('renders brand list', async () => {
    renderPage();
    expect(await screen.findByText('Sony')).toBeInTheDocument();
    expect(brandsService.list).toHaveBeenCalledWith({ page: 1, limit: 20 });
  });

  it('creates a brand via modal form', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Sony');
    await user.click(screen.getByRole('button', { name: i18n.t('brands.create') }));

    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(i18n.t('brands.form.name')), 'Logitech');
    await user.type(
      within(dialog).getByLabelText(i18n.t('brands.form.logo')),
      'https://cdn.example/logo.png',
    );
    await user.click(within(dialog).getByRole('button', { name: i18n.t('common.save') }));

    await waitFor(() => {
      expect(brandsService.create).toHaveBeenCalledWith({
        name: 'Logitech',
        description: undefined,
        logo: 'https://cdn.example/logo.png',
        website: undefined,
      });
    });
  });

  it('edits a brand with isActive', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Sony');
    await user.click(screen.getByRole('button', { name: i18n.t('common.edit') }));

    const dialog = await screen.findByRole('dialog');
    const nameInput = within(dialog).getByLabelText(i18n.t('brands.form.name'));
    await user.clear(nameInput);
    await user.type(nameInput, 'Sony Group');
    await user.click(within(dialog).getByRole('button', { name: i18n.t('common.save') }));

    await waitFor(() => {
      expect(brandsService.update).toHaveBeenCalledWith('b1', {
        name: 'Sony Group',
        description: undefined,
        logo: undefined,
        website: 'https://www.sony.com',
        isActive: true,
      });
    });
  });

  it('confirms delete for ADMIN', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Sony');
    await user.click(screen.getByRole('button', { name: i18n.t('common.delete') }));

    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: i18n.t('common.delete') }));

    await waitFor(() => {
      expect(brandsService.remove).toHaveBeenCalledWith('b1');
    });
  });

  it('hides delete for CONTENT_MANAGER', async () => {
    useAuthStore.setState({ user: contentManager, isAuthenticated: true, isLoading: false });
    renderPage();

    await screen.findByText('Sony');
    expect(screen.queryByRole('button', { name: i18n.t('common.delete') })).not.toBeInTheDocument();
  });
});
