import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Role } from '../../types';
import { cn } from '../../utils/cn';
import NavIcon from './NavIcon';
import { visibleNav } from './nav-config';

interface SidebarProps {
  role: Role;
  collapsed: boolean;
  mobileOpen: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={cn('h-5 w-5 transition-transform', collapsed && 'rotate-180')}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export default function Sidebar({
  role,
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
}: SidebarProps) {
  const { t } = useTranslation();
  const items = visibleNav(role);

  return (
    <aside
      id="admin-sidebar"
      aria-label={t('layout.sidebar')}
      data-collapsed={collapsed}
      data-mobile-open={mobileOpen}
      className={cn(
        'admin-scrollbar fixed inset-y-0 left-0 z-40 flex w-60 flex-col overflow-y-auto border-r border-outline-variant bg-surface-container-low transition-[transform,width] duration-200',
        mobileOpen ? 'visible translate-x-0' : 'invisible -translate-x-full',
        'lg:visible lg:static lg:translate-x-0',
        collapsed && 'lg:w-20',
      )}
    >
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-outline-variant px-4">
        <span className={cn('headline-md truncate font-bold text-primary', collapsed && 'lg:hidden')}>
          {t('admin.title')}
        </span>
        <button
          type="button"
          aria-label={collapsed ? t('layout.expandSidebar') : t('layout.collapseSidebar')}
          aria-expanded={!collapsed}
          onClick={onToggleCollapse}
          className="hidden h-10 w-10 shrink-0 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface lg:inline-flex"
        >
          <CollapseIcon collapsed={collapsed} />
        </button>
        {mobileOpen && (
          <button
            type="button"
            aria-label={t('layout.closeMenu')}
            onClick={onCloseMobile}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface lg:hidden"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        )}
      </div>

      <nav aria-label={t('layout.primaryNavigation')} className="flex flex-1 flex-col gap-1 p-4">
        {items.map((item) => (
          <NavLink
            key={item.key}
            to={item.to}
            end={item.to === '/'}
            title={collapsed ? t(`nav.${item.key}`) : undefined}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              cn(
                'label-md flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-on-surface-variant transition-colors',
                'hover:bg-surface-container-high hover:text-on-surface',
                isActive && 'bg-primary text-on-primary hover:bg-primary hover:text-on-primary',
                collapsed && 'lg:justify-center lg:px-2',
              )
            }
          >
            <NavIcon name={item.icon} className="h-5 w-5 shrink-0" />
            <span className={cn('truncate', collapsed && 'lg:sr-only')}>{t(`nav.${item.key}`)}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
