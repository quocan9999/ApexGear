import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import type { Category, User } from '../../types';

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
            <div className="flex items-center justify-between border-b border-outline-variant px-lg py-md">
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

            {/* Nav Links */}
            <nav className="flex-1 overflow-y-auto px-lg py-md">
              <ul className="flex flex-col gap-1">
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate('/')}
                    className="block w-full rounded-md px-md py-sm text-left body-md text-on-surface hover:bg-surface-container"
                  >
                    {t('nav.home')}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavigate('/products')}
                    className="block w-full rounded-md px-md py-sm text-left body-md text-on-surface hover:bg-surface-container"
                  >
                    {t('nav.products')}
                  </button>
                </li>

                {categories.length > 0 && (
                  <li className="mt-md">
                    <p className="label-md px-md pb-xs text-on-surface-variant">{t('nav.categories')}</p>
                    <ul className="flex flex-col gap-1">
                      {categories.map((cat) => (
                        <li key={cat.id}>
                          <button
                            type="button"
                            onClick={() => handleNavigate(`/products?categoryId=${cat.id}`)}
                            className="block w-full rounded-md px-md py-sm text-left body-md text-on-surface hover:bg-surface-container"
                          >
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
            <div className="border-t border-outline-variant px-lg py-md">
              {user ? (
                <ul className="flex flex-col gap-1">
                  <li className="px-md pb-sm body-sm text-on-surface-variant">
                    {user.name || user.email}
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => handleNavigate('/profile')}
                      className="block w-full rounded-md px-md py-sm text-left body-md text-on-surface hover:bg-surface-container"
                    >
                      {t('nav.profile')}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => handleNavigate('/orders')}
                      className="block w-full rounded-md px-md py-sm text-left body-md text-on-surface hover:bg-surface-container"
                    >
                      {t('nav.orders')}
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full rounded-md px-md py-sm text-left body-md text-error hover:bg-surface-container"
                    >
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
