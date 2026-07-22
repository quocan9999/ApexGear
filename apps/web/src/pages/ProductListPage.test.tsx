import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import '../i18n';

const mocks = vi.hoisted(() => ({
  productsService: {
    getAll: vi.fn().mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 12, total: 0, totalPages: 1 },
    }),
  },
  categoriesService: {
    getAll: vi.fn().mockResolvedValue([]),
  },
  brandsService: {
    getAll: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../services/products.service', () => ({
  productsService: mocks.productsService,
}));
vi.mock('../services/categories.service', () => ({
  categoriesService: mocks.categoriesService,
}));
vi.mock('../services/brands.service', () => ({
  brandsService: mocks.brandsService,
}));

import ProductListPage from './ProductListPage';

beforeEach(() => {
  vi.clearAllMocks();
});

function SearchHarness() {
  const navigate = useNavigate();
  return (
    <>
      <button type="button" onClick={() => navigate('/products?search=bàn phím')}>
        Search bàn phím
      </button>
      <ProductListPage />
    </>
  );
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/products" element={<SearchHarness />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProductListPage search state', () => {
  it('syncs the search input when the URL query changes after mount', async () => {
    renderAt('/products?search=tai%20nghe');

    await waitFor(() => {
      expect(screen.getByRole('searchbox')).toHaveValue('tai nghe');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Search bàn phím' }));

    await waitFor(() => {
      expect(screen.getByRole('searchbox')).toHaveValue('bàn phím');
    });
  });
});
