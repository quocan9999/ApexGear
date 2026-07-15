import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from './api';
import { categoriesService } from './categories.service';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const category = {
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
};

describe('categoriesService', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset();
    vi.mocked(api.patch).mockReset();
    vi.mocked(api.delete).mockReset();
  });

  it('list hits /categories with includeInactive and unwraps data', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [category] } });

    const result = await categoriesService.list();

    expect(api.get).toHaveBeenCalledWith('/categories', {
      params: { includeInactive: true },
    });
    expect(result).toEqual([category]);
  });

  it('list allows includeInactive override', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { data: [] } });

    await categoriesService.list({ includeInactive: false });

    expect(api.get).toHaveBeenCalledWith('/categories', {
      params: { includeInactive: false },
    });
  });

  it('create unwraps data', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { data: category } });
    const dto = { name: 'Âm thanh', sortOrder: 1 };
    const result = await categoriesService.create(dto);
    expect(api.post).toHaveBeenCalledWith('/categories', dto);
    expect(result).toEqual(category);
  });

  it('update unwraps data', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: { data: category } });
    const result = await categoriesService.update('c1', { name: 'Updated', isActive: false });
    expect(api.patch).toHaveBeenCalledWith('/categories/c1', {
      name: 'Updated',
      isActive: false,
    });
    expect(result).toEqual(category);
  });

  it('remove unwraps data', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({ data: { data: category } });
    const result = await categoriesService.remove('c1');
    expect(api.delete).toHaveBeenCalledWith('/categories/c1');
    expect(result).toEqual(category);
  });
});
