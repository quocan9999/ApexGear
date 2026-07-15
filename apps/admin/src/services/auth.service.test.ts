import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '../types';
import api from './api';
import { authService } from './auth.service';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);
const user: User = {
  id: 'user-1',
  email: 'admin@apexgear.vn',
  name: 'Admin',
  phone: null,
  avatar: null,
  role: 'ADMIN',
  provider: 'LOCAL',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('authService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('logs in with credentials and unwraps the user', async () => {
    vi.mocked(mockedApi.post).mockResolvedValueOnce({ data: { data: user } });

    await expect(authService.login({ email: user.email, password: 'Admin123' })).resolves.toBe(user);
    expect(mockedApi.post).toHaveBeenCalledWith('/auth/login', {
      email: user.email,
      password: 'Admin123',
    });
  });

  it('logs out through the cookie-backed endpoint', async () => {
    vi.mocked(mockedApi.post).mockResolvedValueOnce({ data: undefined });

    await authService.logout();

    expect(mockedApi.post).toHaveBeenCalledWith('/auth/logout');
  });

  it('gets the current user and unwraps the response', async () => {
    vi.mocked(mockedApi.get).mockResolvedValueOnce({ data: { data: user } });

    await expect(authService.getMe()).resolves.toBe(user);
    expect(mockedApi.get).toHaveBeenCalledWith('/auth/me');
  });
});
