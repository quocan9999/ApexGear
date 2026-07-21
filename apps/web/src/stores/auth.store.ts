import { create } from 'zustand';
import i18n from '../i18n';
import { authService } from '../services/auth.service';
import type { User, LoginPayload, RegisterPayload } from '../types';

function normalizeAuthError(error: unknown): string {
  const candidate = error as { message?: unknown } | null;
  const message = typeof candidate?.message === 'string' ? candidate.message : null;

  switch (message) {
    case 'Invalid credentials':
      return i18n.t('errors.invalidCredentials');
    case 'Vui lòng xác minh email trước khi đăng nhập':
    case 'auth.loginUnverified':
      return i18n.t('auth.loginUnverified');
    default:
      return message ?? i18n.t('errors.generic');
  }
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (data: LoginPayload) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

// Shared across concurrent callers so a duplicate mount (e.g. React
// StrictMode's double-invoke, or AuthProvider + AuthCallbackPage racing)
// reuses the same request instead of flipping isLoading repeatedly.
let checkAuthInFlight: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // true initially to check auth on load
  error: null,

  login: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.login(data);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: normalizeAuthError(err), isLoading: false });
      throw err;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await authService.register(data);
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch (err: any) {
      set({ error: normalizeAuthError(err), isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout errors
    }
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    // Reuse an in-flight check so concurrent callers don't re-toggle isLoading.
    if (checkAuthInFlight) return checkAuthInFlight;
    set({ isLoading: true });
    checkAuthInFlight = (async () => {
      try {
        const user = await authService.getMe();
        set({ user, isAuthenticated: true, isLoading: false });
      } catch {
        set({ user: null, isAuthenticated: false, isLoading: false });
      } finally {
        checkAuthInFlight = null;
      }
    })();
    return checkAuthInFlight;
  },

  clearError: () => set({ error: null }),
}));
