import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from './api';
import { usersService } from './users.service';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    post: vi.fn(),
  },
}));

const user: import('../types').User = {
  id: 'u1',
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

describe('usersService', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.patch).mockReset();
    vi.mocked(api.delete).mockReset();
    vi.mocked(api.post).mockReset();
  });

  it('list hits /users with params and keeps meta', async () => {
    const payload = { data: [user], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } };
    vi.mocked(api.get).mockResolvedValueOnce({ data: payload });

    const result = await usersService.list({ page: 1, role: 'ADMIN' });

    expect(api.get).toHaveBeenCalledWith('/users', { params: { page: 1, role: 'ADMIN' } });
    expect(result).toEqual(payload);
  });

  it('update unwraps data', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: { data: user } });
    const result = await usersService.update('u1', { role: 'CONTENT_MANAGER' });
    expect(api.patch).toHaveBeenCalledWith('/users/u1', { role: 'CONTENT_MANAGER' });
    expect(result).toEqual(user);
  });

  it('remove calls DELETE /users/:id', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({ data: {} });
    await usersService.remove('u1');
    expect(api.delete).toHaveBeenCalledWith('/users/u1');
  });

  it('restore calls POST /users/:id/restore', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { data: user } });
    const result = await usersService.restore('u1');
    expect(api.post).toHaveBeenCalledWith('/users/u1/restore');
    expect(result).toEqual(user);
  });

  it('unlock calls POST /users/:id/unlock', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { data: user } });
    const result = await usersService.unlock('u1');
    expect(api.post).toHaveBeenCalledWith('/users/u1/unlock');
    expect(result).toEqual(user);
  });
});
