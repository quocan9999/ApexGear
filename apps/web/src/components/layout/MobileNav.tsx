import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import type { Category, User } from '../../types';

function getCategoryIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('tai nghe')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 18v-6a9 9 0 0118 0v6M3 18a3 3 0 006 0v-2a3 3 0 00-6 0v2zM21 18a3 3 0 01-6 0v-2a3 3 0 016 0v2z" />
      </svg>
    );
  }
  if (n.includes('bàn phím') || n.includes('phím')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="6" width="20" height="12" rx="2" ry="2" />
        <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M10 14h.01M14 14h.01M18 14h.01M9 18h6" />
      </svg>
    );
  }
  if (n.includes('màn hình')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    );
  }
  if (n.includes('chuột')) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="2">
        <rect x="6" y="3" width="12" height="18" rx="6" />
        <line x1="12" y1="3" x2="12" y2="11" />
        <line x1="12" y1="11" x2="12" y2="11" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  user: User | null;
  onLogout: () => void;
}

export default function MobileNav({ open, onClose, categories, user, onLogout }: MobileNavProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchValue.trim();
    if (!trimmed) return;
    onClose();
    navigate(`/products?search=${encodeURIComponent(trimmed)}`);
  };

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  const handleLogout = () => {
    onClose();
    onLogout();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-inverse-surface/40"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className={cn(
              'relative flex h-full w-[280px] max-w-[85vw] flex-col',
              'bg-surface-container-lowest shadow-[var(--shadow-level-2)]',
            )}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-outline-variant px-md py-sm">
              <span className="headline-md text-primary">ApexGear</span>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-container"
                aria-label={t('nav.closeMenu')}
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="px-md py-sm border-b border-outline-variant">
              <form onSubmit={handleSearchSubmit} className="relative w-full" role="search">
                <svg viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path strokeLinecap="round" d="M21 21l-4.3-4.3" />
                </svg>
                <input
                  type="search"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={t('common.search')}
                  className="h-10 w-full rounded-full border bg-surface-container-low pl-10 pr-md body-md border-outline-variant placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
              </form>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 overflow-y-auto px-md py-sm">
              <ul className="flex flex-col gap-1">
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate('/')}
                    className="flex w-full items-center gap-sm rounded-md px-md py-sm text-left body-md font-semibold text-on-surface hover:bg-surface-container"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    {t('nav.home')}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate('/products')}
                    className="flex w-full items-center gap-sm rounded-md px-md py-sm text-left body-md font-semibold text-on-surface hover:bg-surface-container"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    {t('nav.products')}
                  </button>
                </li>

                {categories.length > 0 && (
                  <li className="mt-md">
                    <p className="label-sm px-md pb-xs text-on-surface-variant font-medium uppercase tracking-wider">{t('nav.categories')}</p>
                    <ul className="flex flex-col gap-1">
                      {categories.map((cat) => (
                        <li key={cat.id}>
                          <button
                            type="button"
                            onClick={() => handleNavigate(`/products?categoryId=${cat.id}`)}
                            className="flex w-full items-center gap-sm rounded-md px-md py-sm text-left body-md font-semibold text-on-surface hover:bg-surface-container"
                          >
                            {getCategoryIcon(cat.name)}
                            {cat.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                )}
              </ul>
            </nav>

            {/* Auth footer */}
            <div className="border-t border-outline-variant px-md py-sm">
              {user ? (
                <ul className="flex flex-col gap-1">
                  <li className="flex items-center gap-sm px-md pb-sm pt-xs">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary label-sm">
                      {(user.name || user.email).slice(0, 1).toUpperCase()}
                    </span>
                    <span className="body-md font-bold text-on-surface truncate">
                      {user.name || user.email}
                    </span>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => handleNavigate('/account')}
                      className="flex w-full items-center gap-sm rounded-md px-md py-sm text-left body-md font-semibold text-on-surface hover:bg-surface-container"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      {t('nav.account')}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => handleNavigate('/orders')}
                      className="flex w-full items-center gap-sm rounded-md px-md py-sm text-left body-md font-semibold text-on-surface hover:bg-surface-container"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                        <line x1="12" y1="22.08" x2="12" y2="12" />
                      </svg>
                      {t('nav.orders')}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-sm rounded-md px-md py-sm text-left body-md font-semibold text-error hover:bg-error-container/20"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      {t('nav.logout')}
                    </button>
                  </li>
                </ul>
              ) : (
                <div className="flex flex-col gap-sm">
                  <button
                    type="button"
                    onClick={() => handleNavigate('/login')}
                    className="block w-full rounded-md bg-primary px-md py-sm text-center body-md text-on-primary hover:bg-primary-container"
                  >
                    {t('nav.login')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleNavigate('/register')}
                    className="block w-full rounded-md border border-outline-variant px-md py-sm text-center body-md text-on-surface hover:bg-surface-container"
                  >
                    {t('nav.register')}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
