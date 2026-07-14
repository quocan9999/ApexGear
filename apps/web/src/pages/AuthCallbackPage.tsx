import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { useCartStore } from '../stores/cart.store';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    const target = searchParams.get('redirect') || searchParams.get('returnUrl') || '/';
    checkAuth()
      .then(async () => {
        // OAuth login resolved: merge the guest cart into the server cart.
        // Guard so a merge failure never blocks navigation into the app.
        try {
          await useCartStore.getState().mergeGuestCart();
        } catch {
          // Non-blocking
        }
      })
      .finally(() => navigate(target, { replace: true }));
  }, [checkAuth, navigate, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}
