import { useEffect } from 'react';
import { useAuthStore } from '../stores/auth.store';

/**
 * Read-only access to the auth store. Does NOT trigger any side effect.
 *
 * The session check runs exactly once from `useAuthInit` (mounted at the app
 * root). Firing `checkAuth` from every consumer flips `isLoading` back to true
 * on each mount, which makes `ProtectedRoute` unmount/remount its children in
 * a loop and spin forever. Keep initialization out of this hook.
 */
export function useAuth() {
  return useAuthStore();
}

/**
 * Runs the initial session check once. Use only at the app root.
 */
export function useAuthInit() {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
}
