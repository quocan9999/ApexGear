import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from './api';
import { brandsService } from './brands.service';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const brand = {
  id: 'b1',
  name: 'Sony',
  slug: 'sony',
  description: null,
  logo: null,
  website: null,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('brandsService', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset();
    vi.mocked(api.patch).mockReset();
    vi.mocked(api.delete).mockReset();
  });

  it('list hits /brands with params and keeps meta', async () => {
    const payload = {
      data: [brand],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    };
    vi.mocked(api.get).mockResolvedValueOnce({ data: payload });

    const result = await brandsService.list({ page: 1, limit: 20 });

    expect(api.get).toHaveBeenCalledWith('/brands', {
      params: { page: 1, limit: 20 },
    });
    expect(result).toEqual(payload);
  });

  it('create unwraps data', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { data: brand } });
    const dto = { name: 'Sony', logo: 'https://cdn.example/sony.png' };
    const result = await brandsService.create(dto);
    expect(api.post).toHaveBeenCalledWith('/brands', dto);
    expect(result).toEqual(brand);
  });

  it('update unwraps data', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: { data: brand } });
    const result = await brandsService.update('b1', { name: 'Sony', isActive: false });
    expect(api.patch).toHaveBeenCalledWith('/brands/b1', {
      name: 'Sony',
      isActive: false,
    });
    expect(result).toEqual(brand);
  });

  it('remove unwraps data', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({ data: { data: brand } });
    const result = await brandsService.remove('b1');
    expect(api.delete).toHaveBeenCalledWith('/brands/b1');
    expect(result).toEqual(brand);
  });
});
