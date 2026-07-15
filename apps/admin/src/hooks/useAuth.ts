import { useEffect } from 'react';
import { useAuthStore } from '../stores/auth.store';

export function useAuth() {
  return useAuthStore();
}

export function useAuthInit() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);
}
