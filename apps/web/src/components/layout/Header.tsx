import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import { useAuthStore } from '../../stores/auth.store';
import { useCartStore } from '../../stores/cart.store';
import { categoriesService } from '../../services/categories.service';
import type { Category } from '../../types';
import MobileNav from './MobileNav';
import Button from '../ui/Button';

export default function Header() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const cartCount = useCartStore((s) => s.itemCount);

  const [categories, setCategories] = useState<Category[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fetch categories on mount
  useEffect(() => {
    let mounted = true;
    categoriesService
      .getAll()
      .then((data) => {
        if (mounted) setCategories(data ?? []);
      })
      .catch(() => {
        if (mounted) setCategories([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [userMenuOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchValue.trim();
    if (!trimmed) return;
    navigate(`/products?search=${encodeURIComponent(trimmed)}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 w-full',
          'border-b border-outline-variant',
          'bg-surface-container-lowest/80 backdrop-blur-md',
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center gap-md px-md sm:px-lg">
          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-md text-on-surface hover:bg-surface-container lg:hidden"
            aria-label={t('nav.openMenu')}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo */}
          <Link to="/" className="flex shrink-0 items-center gap-sm">
            <span className="headline-md text-primary">ApexGear</span>
          </Link>

          {/* Desktop category nav */}
          <nav className="hidden lg:flex items-center gap-sm" aria-label={t('nav.categories')}>
            {categories.slice(0, 6).map((cat) => (
              <Link
                key={cat.id}
                to={`/products?categoryId=${cat.id}`}
                className="rounded-md px-sm py-xs body-md text-on-surface hover:bg-surface-container"
              >
                {cat.name}
              </Link>
            ))}
          </nav>

          {/* Search */}
          <form
            onSubmit={handleSearchSubmit}
            className="ml-auto flex flex-1 max-w-[480px] items-center"
            role="search"
          >
            <div className="relative w-full">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-outline"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="M21 21l-4.3-4.3" />
              </svg>
              <input
                type="search"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={t('common.search')}
                aria-label={t('common.search')}
                className={cn(
                  'h-10 w-full rounded-full border bg-surface-container-low pl-10 pr-md body-md',
                  'border-outline-variant placeholder:text-outline',
                  'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
                )}
              />
            </div>
          </form>

          {/* Cart */}
          <Link
            to="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-on-surface hover:bg-surface-container"
            aria-label={t('nav.cart')}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3h2l2.4 12.5a2 2 0 002 1.6h8.2a2 2 0 002-1.6L21 8H6"
              />
              <circle cx="9" cy="20" r="1.5" fill="currentColor" />
              <circle cx="17" cy="20" r="1.5" fill="currentColor" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[11px] font-semibold text-on-error">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          {/* Auth area */}
          {isAuthenticated && user ? (
            <div className="relative hidden lg:block" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex h-10 items-center gap-sm rounded-full border border-outline-variant bg-surface-container-lowest px-sm hover:bg-surface-container"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-on-primary label-sm">
                  {(user.name || user.email).slice(0, 1).toUpperCase()}
                </span>
                <span className="body-sm text-on-surface max-w-[120px] truncate">
                  {user.name || user.email}
                </span>
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-on-surface-variant">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 011.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>
              {userMenuOpen && (
                <div
                  role="menu"
                  className={cn(
                    'absolute right-0 mt-sm w-48 origin-top-right rounded-lg border border-outline-variant',
                    'bg-surface-container-lowest shadow-[var(--shadow-level-2)]',
                  )}
                >
                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-md py-sm body-md text-on-surface hover:bg-surface-container"
                    role="menuitem"
                  >
                    {t('nav.profile')}
                  </Link>
                  <Link
                    to="/orders"
                    onClick={() => setUserMenuOpen(false)}
                    className="block px-md py-sm body-md text-on-surface hover:bg-surface-container"
                    role="menuitem"
                  >
                    {t('nav.orders')}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="block w-full px-md py-sm text-left body-md text-error hover:bg-surface-container"
                    role="menuitem"
                  >
                    {t('nav.logout')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-sm">
              <Link to="/login">
                <Button variant="outline" size="sm">
                  {t('nav.login')}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        categories={categories}
        user={user ?? null}
        onLogout={handleLogout}
      />
    </>
  );
}
