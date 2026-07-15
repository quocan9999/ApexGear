import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';
import type { User } from '../types';
import { authService } from '../services/auth.service';
import { resetAuthStore, useAuthStore } from './auth.store';

vi.mock('../services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
  },
}));

const admin: User = {
  id: 'admin-1',
  email: 'admin@apexgear.vn',
  name: 'ApexGear Admin',
  phone: null,
  avatar: null,
  role: 'ADMIN',
  provider: 'LOCAL',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAuthStore();
  });

  it('starts unresolved and unauthenticated', () => {
    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
    });
  });

  it('sets the current user after a successful auth check', async () => {
    vi.mocked(authService.getMe).mockResolvedValueOnce(admin);

    await useAuthStore.getState().checkAuth();

    expect(useAuthStore.getState()).toMatchObject({
      user: admin,
      isAuthenticated: true,
      isLoading: false,
    });
  });

  it('clears auth after a failed auth check', async () => {
    useAuthStore.setState({ user: admin, isAuthenticated: true });
    vi.mocked(authService.getMe).mockRejectedValueOnce(new Error('expired'));

    await useAuthStore.getState().checkAuth();

    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('deduplicates concurrent auth checks', async () => {
    const request = deferred<User>();
    vi.mocked(authService.getMe).mockReturnValueOnce(request.promise);

    const first = useAuthStore.getState().checkAuth();
    const second = useAuthStore.getState().checkAuth();

    expect(second).toBe(first);
    expect(authService.getMe).toHaveBeenCalledTimes(1);

    request.resolve(admin);
    await Promise.all([first, second]);
  });

  it('returns the user and authenticates after login', async () => {
    vi.mocked(authService.login).mockResolvedValueOnce(admin);

    await expect(
      useAuthStore.getState().login({ email: admin.email, password: 'Admin123' }),
    ).resolves.toBe(admin);

    expect(useAuthStore.getState()).toMatchObject({
      user: admin,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  });

  it.each([
    {
      name: 'invalid credentials',
      error: { message: 'Invalid credentials', status: 401 },
      key: 'login.invalidCredentials',
      translation: 'Email hoặc mật khẩu không chính xác.',
    },
    {
      name: 'locked account',
      error: { message: 'Account is locked', status: 423 },
      key: 'login.accountLocked',
      translation: 'Tài khoản đã bị khóa. Vui lòng thử lại sau.',
    },
    {
      name: 'deactivated account',
      error: { message: 'Account is deactivated', status: 401 },
      key: 'login.accountDeactivated',
      translation: 'Tài khoản đã bị vô hiệu hóa.',
    },
    {
      name: 'status 423 fallback',
      error: { message: 'Too many failed attempts', status: 423 },
      key: 'login.accountLocked',
      translation: 'Tài khoản đã bị khóa. Vui lòng thử lại sau.',
    },
    {
      name: 'unknown backend error',
      error: { message: 'Internal authentication provider failure', status: 500 },
      key: 'login.genericError',
      translation: 'Không thể đăng nhập. Vui lòng thử lại.',
    },
    {
      name: 'network error',
      error: new Error('Network Error'),
      key: 'login.genericError',
      translation: 'Không thể đăng nhập. Vui lòng thử lại.',
    },
  ])('localizes $name without exposing the raw message', async ({ error, key, translation }) => {
    vi.mocked(authService.login).mockRejectedValueOnce(error);

    await expect(
      useAuthStore.getState().login({ email: admin.email, password: 'wrong-pass' }),
    ).rejects.toBe(error);

    expect(i18n.t(key)).toBe(translation);
    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: translation,
    });
    expect(useAuthStore.getState().error).not.toBe(error.message);
  });

  it('always clears local auth when API logout fails', async () => {
    useAuthStore.setState({ user: admin, isAuthenticated: true, isLoading: false });
    vi.mocked(authService.logout).mockRejectedValueOnce(new Error('network'));

    await expect(useAuthStore.getState().logout()).resolves.toBeUndefined();

    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('clears the current error', () => {
    useAuthStore.setState({ error: 'Old error' });

    useAuthStore.getState().clearError();

    expect(useAuthStore.getState().error).toBeNull();
  });
});
