import { Suspense, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Spinner } from '../ui';
import { useAuth } from '../../hooks/useAuth';
import Breadcrumb from './Breadcrumb';
import Sidebar from './Sidebar';
import { useAdminNotifications } from '../../hooks/useAdminNotifications';
import TopBar from './TopBar';
import NotificationBell from './NotificationBell';
import { navItemForPath } from './nav-config';

const SIDEBAR_STORAGE_KEY = 'admin.sidebar.collapsed';
export const DESKTOP_BREAKPOINT_QUERY = '(min-width: 1024px)';

export default function AdminLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const notifications = useAdminNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true',
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const wasMobileOpenRef = useRef(false);
  const skipMobileFocusRestoreRef = useRef(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;

    const desktopQuery = window.matchMedia(DESKTOP_BREAKPOINT_QUERY);
    const closeMobileDrawerAtDesktop = ({ matches }: MediaQueryListEvent | MediaQueryList) => {
      if (!matches) return;
      setMobileOpen((isOpen) => {
        if (!isOpen) return isOpen;
        skipMobileFocusRestoreRef.current = true;
        return false;
      });
    };

    closeMobileDrawerAtDesktop(desktopQuery);
    desktopQuery.addEventListener('change', closeMobileDrawerAtDesktop);
    return () => desktopQuery.removeEventListener('change', closeMobileDrawerAtDesktop);
  }, []);

  useEffect(() => {
    if (wasMobileOpenRef.current && !mobileOpen) {
      if (!skipMobileFocusRestoreRef.current) menuButtonRef.current?.focus();
      skipMobileFocusRestoreRef.current = false;
    }
    wasMobileOpenRef.current = mobileOpen;
  }, [mobileOpen]);

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
          className="fixed inset-0 z-30 bg-inverse-surface/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary lg:hidden"
        />
      )}

      <Sidebar
        role={user.role}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={toggleCollapsed}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className="flex min-h-screen min-w-0 flex-1 flex-col"
        inert={mobileOpen ? true : undefined}
        aria-hidden={mobileOpen || undefined}
      >
        <TopBar
          user={user}
          title={t(`nav.${current.key}`)}
          mobileOpen={mobileOpen}
          menuButtonRef={menuButtonRef}
          onOpenMobile={() => setMobileOpen(true)}
          onLogout={handleLogout}
          notificationSlot={<NotificationBell {...notifications} />}
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
