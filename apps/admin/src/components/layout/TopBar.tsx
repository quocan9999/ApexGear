import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { User } from '../../types';

interface TopBarProps {
  user: User;
  title: string;
  mobileOpen: boolean;
  onOpenMobile: () => void;
  onLogout: () => Promise<void>;
}

export default function TopBar({ user, title, mobileOpen, onOpenMobile, onLogout }: TopBarProps) {
  const { t } = useTranslation();
  const [loggingOut, setLoggingOut] = useState(false);
  const initial = user.name.trim().charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase();

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-4 shadow-level-1 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label={t('layout.openMenu')}
          aria-controls="admin-sidebar"
          aria-expanded={mobileOpen}
          onClick={onOpenMobile}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container lg:hidden"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="headline-md truncate text-on-surface">{title}</h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <div className="hidden min-w-0 text-right sm:block">
          <p className="label-md truncate text-on-surface">{user.name}</p>
          <p className="label-sm truncate text-on-surface-variant">{user.email}</p>
        </div>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary"
          aria-hidden="true"
        >
          {initial}
        </div>
        <span className="hidden rounded-full bg-surface-container-high px-2 py-1 label-sm text-on-surface-variant md:inline-flex">
          {t(`roles.${user.role}`)}
        </span>
        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={loggingOut}
          className="inline-flex min-h-10 items-center rounded px-3 label-md text-error transition-colors hover:bg-error-container hover:text-on-error-container disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t('nav.logout')}
        </button>
      </div>
    </header>
  );
}
