import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from './api';
import { productsService } from './products.service';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const product = {
  id: 'p1',
  name: 'Tai nghe X',
  slug: 'tai-nghe-x',
  description: null,
  specifications: null,
  basePrice: 1000000,
  salePrice: null,
  categoryId: 'c1',
  brandId: 'b1',
  metaTitle: null,
  metaDescription: null,
  isFeatured: false,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('productsService', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset();
    vi.mocked(api.patch).mockReset();
    vi.mocked(api.delete).mockReset();
  });

  it('list hits /products with params and keeps meta', async () => {
    const payload = {
      data: [product],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };
    vi.mocked(api.get).mockResolvedValueOnce({ data: payload });

    const result = await productsService.list({ page: 1, search: 'tai' });

    expect(api.get).toHaveBeenCalledWith('/products', {
      params: { page: 1, search: 'tai' },
    });
    expect(result).toEqual(payload);
  });

  it('getBySlug unwraps data', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { data: product } });
    const result = await productsService.getBySlug('tai-nghe-x');
    expect(api.get).toHaveBeenCalledWith('/products/tai-nghe-x');
    expect(result).toEqual(product);
  });

  it('create unwraps data', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { data: product } });
    const dto = { name: 'Tai nghe X', basePrice: 1000000 };
    const result = await productsService.create(dto);
    expect(api.post).toHaveBeenCalledWith('/products', dto);
    expect(result).toEqual(product);
  });

  it('update unwraps data', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: { data: product } });
    const result = await productsService.update('p1', { name: 'Updated' });
    expect(api.patch).toHaveBeenCalledWith('/products/p1', { name: 'Updated' });
    expect(result).toEqual(product);
  });

  it('remove unwraps data', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({ data: { data: product } });
    const result = await productsService.remove('p1');
    expect(api.delete).toHaveBeenCalledWith('/products/p1');
    expect(result).toEqual(product);
  });
});
