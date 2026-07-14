import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { categoriesService } from '../../services/categories.service';
import type { Category } from '../../types';

const SUPPORT_LINKS = [
  { to: '/help', labelKey: 'support' },
  { to: '/shipping', labelKey: 'shipping' },
  { to: '/returns', labelKey: 'returns' },
  { to: '/warranty', labelKey: 'warranty' },
];

const SUPPORT_LABEL_KEYS: Record<string, string> = {
  support: 'Hỗ trợ',
  shipping: 'Vận chuyển',
  returns: 'Đổi trả',
  warranty: 'Bảo hành',
};

export default function Footer() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let mounted = true;
    categoriesService
      .getAll()
      .then((data) => {
        if (mounted) setCategories((data ?? []).slice(0, 8));
      })
      .catch(() => {
        if (mounted) setCategories([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const year = new Date().getFullYear();

  return (
    <footer className="mt-xxl border-t border-outline-variant bg-surface-container-low">
      <div className="mx-auto w-full max-w-[1280px] px-md py-xl sm:px-lg">
        <div className="grid grid-cols-1 gap-xl sm:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          <div className="flex flex-col gap-sm">
            <Link to="/" className="headline-md text-primary">
              ApexGear
            </Link>
            <p className="body-sm text-on-surface-variant">{t('footer.aboutText')}</p>
          </div>

          {/* Categories */}
          <div className="flex flex-col gap-sm">
            <h3 className="label-md text-on-surface">{t('nav.categories')}</h3>
            <ul className="flex flex-col gap-xs">
              {categories.length === 0 && (
                <li className="body-sm text-on-surface-variant">—</li>
              )}
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    to={`/products?categoryId=${cat.id}`}
                    className="body-sm text-on-surface-variant hover:text-primary"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="flex flex-col gap-sm">
            <h3 className="label-md text-on-surface">{t('footer.support')}</h3>
            <ul className="flex flex-col gap-xs">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="body-sm text-on-surface-variant hover:text-primary">
                    {SUPPORT_LABEL_KEYS[link.labelKey] ?? link.labelKey}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-sm">
            <h3 className="label-md text-on-surface">{t('footer.contact')}</h3>
            <ul className="flex flex-col gap-xs">
              <li className="flex items-center gap-sm body-sm text-on-surface-variant">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:support@apexgear.vn" className="hover:text-primary">
                  support@apexgear.vn
                </a>
              </li>
              <li className="flex items-center gap-sm body-sm text-on-surface-variant">
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h2.3a2 2 0 011.94 1.5l.7 2.8a2 2 0 01-.55 2L8 10.5a14 14 0 005.5 5.5l1.2-1.4a2 2 0 012-.55l2.8.7A2 2 0 0021 16.7V19a2 2 0 01-2 2A18 18 0 013 5z" />
                </svg>
                <a href="tel:+8419000000" className="hover:text-primary">
                  1900 0000
                </a>
              </li>
              <li className="flex items-start gap-sm body-sm text-on-surface-variant">
                <svg viewBox="0 0 24 24" fill="none" className="mt-0.5 h-4 w-4" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s7-7 7-12a7 7 0 10-14 0c0 5 7 12 7 12z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                <span>TP. Hồ Chí Minh, Việt Nam</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-xl flex flex-col items-center justify-between gap-sm border-t border-outline-variant pt-md sm:flex-row">
          <p className="body-sm text-on-surface-variant">
            {t('footer.copyright').replace('2024', String(year))}
          </p>
          <ul className="flex items-center gap-md body-sm text-on-surface-variant">
            <li>
              <Link to="/policy" className="hover:text-primary">
                {t('footer.policy')}
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-primary">
                Điều khoản
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-primary">
                Bảo mật
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
