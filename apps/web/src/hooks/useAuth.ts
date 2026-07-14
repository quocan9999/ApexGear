import { useEffect } from 'react';
import { useAuthStore } from '../stores/auth.store';

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    store.checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return store;
}
