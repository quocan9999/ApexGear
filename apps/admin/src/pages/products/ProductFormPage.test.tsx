import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../i18n';
import type { Product } from '../../types';
import { ProductFormPage } from './ProductFormPage';

vi.mock('../../services/products.service', () => ({
  productsService: {
    create: vi.fn(),
    update: vi.fn(),
    getBySlug: vi.fn(),
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

vi.mock('../../components/editor/RichTextEditor', () => ({
  RichTextEditor: ({
    value,
    onChange,
    'aria-label': ariaLabel,
  }: {
    value: string;
    onChange: (html: string) => void;
    'aria-label'?: string;
  }) => (
    <textarea
      aria-label={ariaLabel ?? 'description'}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

import { brandsService } from '../../services/brands.service';
import { categoriesService } from '../../services/categories.service';
import { productsService } from '../../services/products.service';

const product: Product = {
  id: 'p1',
  name: 'Tai nghe X',
  slug: 'tai-nghe-x',
  description: '<p>Desc</p>',
  specifications: null,
  basePrice: 1990000,
  salePrice: null,
  categoryId: 'c1',
  brandId: 'b1',
  metaTitle: 'Meta',
  metaDescription: null,
  isFeatured: true,
  isActive: true,
  specs: [
    {
      id: 's1',
      productId: 'p1',
      group: 'Audio',
      name: 'Driver',
      value: '40mm',
      sortOrder: 0,
    },
  ],
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

function renderCreate() {
  return render(
    <MemoryRouter initialEntries={['/products/new']}>
      <Routes>
        <Route path="/products/new" element={<ProductFormPage />} />
        <Route path="/products" element={<div>list</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function renderEdit() {
  return render(
    <MemoryRouter initialEntries={['/products/tai-nghe-x/edit']}>
      <Routes>
        <Route path="/products/:slug/edit" element={<ProductFormPage />} />
        <Route path="/products" element={<div>list</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProductFormPage', () => {
  beforeEach(() => {
    vi.mocked(productsService.create).mockReset().mockResolvedValue(product);
    vi.mocked(productsService.update).mockReset().mockResolvedValue(product);
    vi.mocked(productsService.getBySlug).mockReset().mockResolvedValue(product);
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

  it('submits create with specs and description HTML', async () => {
    const user = userEvent.setup();
    renderCreate();

    await user.type(await screen.findByLabelText(i18n.t('products.form.name')), 'Tai nghe X');
    await user.selectOptions(
      screen.getByLabelText(i18n.t('products.form.category')),
      'c1',
    );
    await user.selectOptions(screen.getByLabelText(i18n.t('products.form.brand')), 'b1');
    await user.type(screen.getByLabelText(i18n.t('products.form.basePrice')), '1990000');
    await user.type(
      screen.getByLabelText(i18n.t('products.form.description')),
      '<p>Hello</p>',
    );

    const nameInputs = screen.getAllByLabelText(i18n.t('products.form.specName'));
    const valueInputs = screen.getAllByLabelText(i18n.t('products.form.specValue'));
    await user.type(nameInputs[0], 'Driver');
    await user.type(valueInputs[0], '40mm');

    await user.click(screen.getByRole('button', { name: i18n.t('common.save') }));

    await waitFor(() => {
      expect(productsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Tai nghe X',
          categoryId: 'c1',
          brandId: 'b1',
          basePrice: 1990000,
          description: expect.stringContaining('Hello'),
          specs: [
            expect.objectContaining({ name: 'Driver', value: '40mm', sortOrder: 0 }),
          ],
        }),
      );
    });
  });

  it('adds and removes a spec row', async () => {
    const user = userEvent.setup();
    renderCreate();

    expect(screen.getAllByLabelText(i18n.t('products.form.specName'))).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: i18n.t('products.form.addSpec') }));
    expect(screen.getAllByLabelText(i18n.t('products.form.specName'))).toHaveLength(2);

    const deleteButtons = screen.getAllByRole('button', { name: i18n.t('common.delete') });
    await user.click(deleteButtons[0]);
    expect(screen.getAllByLabelText(i18n.t('products.form.specName'))).toHaveLength(1);
  });

  it('prefills edit mode from getBySlug', async () => {
    renderEdit();

    expect(await screen.findByDisplayValue('Tai nghe X')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1990000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Driver')).toBeInTheDocument();
    expect(screen.getByDisplayValue('40mm')).toBeInTheDocument();
    expect(productsService.getBySlug).toHaveBeenCalledWith('tai-nghe-x');
  });
});
