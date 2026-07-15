import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';
import { useAuthStore } from '../stores/auth.store';
import type { Category, User } from '../types';
import { CategoriesPage } from './CategoriesPage';

vi.mock('../services/categories.service', () => ({
  categoriesService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import { categoriesService } from '../services/categories.service';

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

const tree: Category[] = [
  {
    id: 'c1',
    name: 'Âm thanh',
    slug: 'am-thanh',
    description: null,
    image: null,
    parentId: null,
    sortOrder: 0,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    children: [
      {
        id: 'c2',
        name: 'Tai nghe',
        slug: 'tai-nghe',
        description: null,
        image: null,
        parentId: 'c1',
        sortOrder: 1,
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ],
  },
];

function renderPage() {
  return render(<CategoriesPage />);
}

describe('CategoriesPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: adminUser, isAuthenticated: true, isLoading: false });
    vi.mocked(categoriesService.list).mockReset();
    vi.mocked(categoriesService.create).mockReset();
    vi.mocked(categoriesService.update).mockReset();
    vi.mocked(categoriesService.remove).mockReset();
    vi.mocked(categoriesService.list).mockResolvedValue(tree);
    vi.mocked(categoriesService.create).mockResolvedValue(tree[0]);
    vi.mocked(categoriesService.update).mockResolvedValue(tree[0]);
    vi.mocked(categoriesService.remove).mockResolvedValue(tree[0]);
  });

  it('renders parent and child categories', async () => {
    renderPage();

    expect(await screen.findByText('Âm thanh')).toBeInTheDocument();
    expect(screen.getByText(/Tai nghe/)).toBeInTheDocument();
    expect(categoriesService.list).toHaveBeenCalledWith({ includeInactive: true });
  });

  it('creates a category via modal form', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Âm thanh');
    await user.click(screen.getByRole('button', { name: i18n.t('categories.create') }));

    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText(i18n.t('categories.form.name')), 'Gaming');
    await user.clear(within(dialog).getByLabelText(i18n.t('categories.form.sortOrder')));
    await user.type(within(dialog).getByLabelText(i18n.t('categories.form.sortOrder')), '2');
    await user.click(within(dialog).getByRole('button', { name: i18n.t('common.save') }));

    await waitFor(() => {
      expect(categoriesService.create).toHaveBeenCalledWith({
        name: 'Gaming',
        description: undefined,
        parentId: null,
        sortOrder: 2,
      });
    });
    expect(categoriesService.list).toHaveBeenCalledTimes(2);
  });

  it('edits a category and sends isActive', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Âm thanh');
    const editButtons = screen.getAllByRole('button', { name: i18n.t('common.edit') });
    await user.click(editButtons[0]);

    const dialog = await screen.findByRole('dialog');
    const nameInput = within(dialog).getByLabelText(i18n.t('categories.form.name'));
    await user.clear(nameInput);
    await user.type(nameInput, 'Audio');
    await user.click(within(dialog).getByRole('button', { name: i18n.t('common.save') }));

    await waitFor(() => {
      expect(categoriesService.update).toHaveBeenCalledWith('c1', {
        name: 'Audio',
        description: undefined,
        parentId: null,
        sortOrder: 0,
        isActive: true,
      });
    });
  });

  it('confirms delete for ADMIN', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Âm thanh');
    const deleteButtons = screen.getAllByRole('button', { name: i18n.t('common.delete') });
    await user.click(deleteButtons[0]);

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Âm thanh/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: i18n.t('common.delete') }));

    await waitFor(() => {
      expect(categoriesService.remove).toHaveBeenCalledWith('c1');
    });
  });

  it('hides delete for CONTENT_MANAGER', async () => {
    useAuthStore.setState({ user: contentManager, isAuthenticated: true, isLoading: false });
    renderPage();

    await screen.findByText('Âm thanh');
    expect(screen.queryByRole('button', { name: i18n.t('common.delete') })).not.toBeInTheDocument();
  });
});
