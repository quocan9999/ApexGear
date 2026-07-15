import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { navItemForPath } from './nav-config';

export default function Breadcrumb() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const current = navItemForPath(pathname);
  const isDashboard = current.to === '/';

  return (
    <nav aria-label={t('layout.breadcrumb')} className="body-sm text-on-surface-variant">
      <ol className="flex items-center gap-2">
        {!isDashboard && (
          <>
            <li>
              <Link to="/" className="rounded transition-colors hover:text-primary">
                {t('nav.dashboard')}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
          </>
        )}
        <li aria-current="page" className="font-semibold text-on-surface">
          {t(`nav.${current.key}`)}
        </li>
      </ol>
    </nav>
  );
}
