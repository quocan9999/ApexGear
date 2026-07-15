import { create } from 'zustand';
import i18n from '../i18n';
import { authService, type LoginCredentials } from '../services/auth.service';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

let checkAuthInFlight: Promise<void> | null = null;
let authEpoch = 0;

function normalizeError(error: unknown): string {
  const candidate = error as { message?: unknown; status?: unknown } | null;
  const message = typeof candidate?.message === 'string' ? candidate.message : null;

  switch (message) {
    case 'Invalid credentials':
      return i18n.t('login.invalidCredentials');
    case 'Account is locked':
      return i18n.t('login.accountLocked');
    case 'Account is deactivated':
      return i18n.t('login.accountDeactivated');
    default:
      return candidate?.status === 423
        ? i18n.t('login.accountLocked')
        : i18n.t('login.genericError');
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.login(credentials);
      set({ user, isAuthenticated: true, isLoading: false, error: null });
      return user;
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false, error: normalizeError(error) });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // The server session may already be gone; local auth must still be cleared.
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    }
  },

  checkAuth: () => {
    if (checkAuthInFlight) return checkAuthInFlight;

    const requestEpoch = authEpoch;
    set({ isLoading: true });
    const request = authService.getMe().then(
      (user) => {
        if (requestEpoch === authEpoch) {
          set({ user, isAuthenticated: true, isLoading: false, error: null });
        }
      },
      () => {
        if (requestEpoch === authEpoch) {
          set({ user: null, isAuthenticated: false, isLoading: false, error: null });
        }
      },
    ).finally(() => {
      if (checkAuthInFlight === request) checkAuthInFlight = null;
    });

    checkAuthInFlight = request;
    return request;
  },

  clearError: () => set({ error: null }),
}));

export function resetAuthStore() {
  authEpoch += 1;
  checkAuthInFlight = null;
  useAuthStore.setState(useAuthStore.getInitialState(), true);
}
