import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../i18n';
import { useAuthStore } from '../../stores/auth.store';
import type { Product, User } from '../../types';
import { ProductListPage } from './ProductListPage';

vi.mock('../../services/products.service', () => ({
  productsService: {
    list: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock('../../services/categories.service', () => ({
  categoriesService: {
    list: vi.fn(),
  },
}));

vi.mock('../../services/brands.service', () => ({
  brandsService: {
    list: vi.fn(),
  },
}));

import { brandsService } from '../../services/brands.service';
import { categoriesService } from '../../services/categories.service';
import { productsService } from '../../services/products.service';

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

const product: Product = {
  id: 'p1',
  name: 'Tai nghe X',
  slug: 'tai-nghe-x',
  description: null,
  specifications: null,
  basePrice: 1990000,
  salePrice: null,
  categoryId: 'c1',
  brandId: 'b1',
  metaTitle: null,
  metaDescription: null,
  isFeatured: false,
  isActive: true,
  category: {
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
  },
  brand: {
    id: 'b1',
    name: 'Sony',
    slug: 'sony',
    description: null,
    logo: null,
    website: null,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  images: [],
  variants: [
    {
      id: 'v1',
      productId: 'p1',
      sku: 'TN-X-1',
      name: 'Default',
      price: null,
      stockTotal: 12,
      stockAvailable: 10,
      lowStockThreshold: 3,
      attributes: null,
      isDefault: true,
      isActive: true,
      displayOrder: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderPage() {
  return render(
    <MemoryRouter>
      <ProductListPage />
    </MemoryRouter>,
  );
}

describe('ProductListPage', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: adminUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });

    vi.mocked(productsService.list).mockReset().mockResolvedValue({
      data: [product],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    vi.mocked(productsService.remove).mockReset().mockResolvedValue(product);
    vi.mocked(categoriesService.list).mockReset().mockResolvedValue([
      {
        id: 'c1',
        name: 'Âm thanh',
        slug: 'am-thanh',
        description: null,
        image: null,
        parentId: null,
        sortOrder: 0,
        isActive: true,
        children: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
    vi.mocked(brandsService.list).mockReset().mockResolvedValue({
      data: [
        {
          id: 'b1',
          name: 'Sony',
          slug: 'sony',
          description: null,
          logo: null,
          website: null,
          isActive: true,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
  });

  it('renders product rows from the list service', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { level: 2, name: i18n.t('pages.products.title') }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Tai nghe X')).toBeInTheDocument();
    const table = screen.getByRole('table');
    expect(within(table).getByText('Sony')).toBeInTheDocument();
    expect(within(table).getByText('Âm thanh')).toBeInTheDocument();
    expect(within(table).getByText(/1\.990\.000/)).toBeInTheDocument();
    expect(within(table).getByText('10')).toBeInTheDocument();
    expect(productsService.list).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20 }),
    );
  });

  it('debounces search and requests list with search param', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Tai nghe X');

    const search = screen.getByLabelText(i18n.t('common.search'));
    await user.clear(search);
    await user.type(search, 'tai');

    await waitFor(
      () => {
        expect(productsService.list).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'tai', page: 1 }),
        );
      },
      { timeout: 2000 },
    );
  });

  it('opens confirm dialog and deletes product for ADMIN', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Tai nghe X');

    await user.click(screen.getByRole('button', { name: i18n.t('common.delete') }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/Tai nghe X/)).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole('button', { name: i18n.t('common.delete') }),
    );

    await waitFor(() => {
      expect(productsService.remove).toHaveBeenCalledWith('p1');
    });
  });

  it('hides delete action for CONTENT_MANAGER', async () => {
    useAuthStore.setState({
      user: contentManager,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });

    renderPage();
    await screen.findByText('Tai nghe X');

    expect(screen.getByRole('link', { name: i18n.t('common.edit') })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: i18n.t('common.delete') })).not.toBeInTheDocument();
  });
});
