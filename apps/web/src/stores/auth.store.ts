import { create } from 'zustand';
import { authService } from '../services/auth.service';
import type { User, LoginPayload, RegisterPayload } from '../types';

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
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await authService.register(data);
      // Auto-login after register
      const user = await authService.login({ email: data.email, password: data.password });
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
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
