import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isAuthenticated && !isLoading) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface p-md">
      <Link
        to="/"
        className="mb-lg flex items-center gap-sm text-on-surface-variant hover:text-primary transition-colors"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M19 12H5m0 0l7 7m-7-7l7-7" />
        </svg>
        <span className="headline-md text-primary">ApexGear</span>
      </Link>
      <div className="w-full max-w-[28rem] rounded-xl bg-surface-container-lowest p-xl shadow-[var(--shadow-level-1)]">
        <Outlet />
      </div>
    </div>
  );
}
