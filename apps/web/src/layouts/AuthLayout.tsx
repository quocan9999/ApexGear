import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-md">
      <div className="w-full max-w-[28rem] rounded-xl bg-surface-container-lowest p-xl shadow-[var(--shadow-level-1)]">
        <Outlet />
      </div>
    </div>
  );
}
