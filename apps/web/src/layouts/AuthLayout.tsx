import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isAuthenticated && !isLoading) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-md py-xl">
        <div className="w-full max-w-[28rem] rounded-xl bg-surface-container-lowest p-xl shadow-[var(--shadow-level-1)]">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
