import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Spinner } from '../ui';
import { useAuth } from '../../hooks/useAuth';
import Breadcrumb from './Breadcrumb';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { navItemForPath } from './nav-config';

const SIDEBAR_STORAGE_KEY = 'admin.sidebar.collapsed';

export default function AdminLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true',
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  if (!user) return <Spinner fullscreen />;

  const current = navItemForPath(location.pathname);
  const toggleCollapsed = () => {
    setCollapsed((value) => {
      const next = !value;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  };
  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface lg:flex">
      {mobileOpen && (
        <button
          type="button"
          aria-label={t('layout.closeMenuBackdrop')}
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-inverse-surface/40 lg:hidden"
        />
      )}

      <Sidebar
        role={user.role}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={toggleCollapsed}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <TopBar
          user={user}
          title={t(`nav.${current.key}`)}
          mobileOpen={mobileOpen}
          onOpenMobile={() => setMobileOpen(true)}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
          <Breadcrumb />
          <div className="mt-6">
            <Suspense fallback={<Spinner label={t('common.loading')} />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
