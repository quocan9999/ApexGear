import { useEffect, type ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useAuthInit } from './hooks/useAuth';
import { useAuthStore } from './stores/auth.store';
import { useCartStore } from './stores/cart.store';
import AppRoutes from './routes';

function AuthProvider({ children }: { children: ReactNode }) {
  useAuthInit();

  // Reconcile the cart once the session resolves as authenticated. This covers
  // session restore (valid cookie on refresh), where nothing else merges the
  // guest cart — leaving the header badge showing a stale guest count while the
  // server cart (what /cart reads) is empty. mergeGuestCart is guarded against
  // concurrent calls, so racing with LoginPage/RegisterPage/AuthCallbackPage is
  // safe: guest items are merged then cleared, otherwise the server cart loads.
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    void useCartStore.getState().mergeGuestCart();
  }, [isAuthenticated, isLoading]);

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
