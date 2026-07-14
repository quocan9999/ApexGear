import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Skeleton from '../ui/Skeleton';
import { cn } from '../../utils/cn';
import api from '../../services/api';
import { getCloudinaryUrl } from '../../utils/cloudinary';
import type { ApiResponse, Brand } from '../../types';

/**
 * Brands banner — logo wall.
 * Mobile: horizontal scroll with snap.
 * Desktop: wrapping grid, anchored left (anti-center-bias).
 */
export default function BrandsBanner() {
  const { t } = useTranslation();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api
      .get<ApiResponse<Brand[]>>('/brands', { params: { limit: 24 } })
      .then((r) => {
        if (mounted) setBrands(r.data.data ?? []);
      })
      .catch(() => {
        if (mounted) setBrands([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="border-y border-outline-variant bg-surface-container-lowest py-xl">
      <div className="mx-auto w-full max-w-[1280px] px-md sm:px-lg">
        <h2 className="mb-lg text-left headline-lg text-on-surface">
          {t('home.brands')}
        </h2>

        {loading ? (
          <div className="flex gap-md overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-20 w-32 shrink-0 rounded-lg sm:h-24 sm:w-40"
              />
            ))}
          </div>
        ) : brands.length === 0 ? (
          <p className="body-md text-on-surface-variant">
            {t('common.noResults')}
          </p>
        ) : (
          <>
            {/* Mobile: horizontal scroll */}
            <div
              className={cn(
                'flex gap-md overflow-x-auto pb-sm lg:hidden',
                'snap-x snap-mandatory [&::-webkit-scrollbar]:hidden',
              )}
            >
              {brands.map((brand) => (
                <BrandTile key={brand.id} brand={brand} className="snap-start" />
              ))}
            </div>

            {/* Desktop: wrapping grid */}
            <div className="hidden lg:grid lg:grid-cols-6 lg:gap-lg">
              {brands.slice(0, 12).map((brand) => (
                <BrandTile key={brand.id} brand={brand} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function BrandTile({ brand, className }: { brand: Brand; className?: string }) {
  return (
    <a
      href={brand.website || '#'}
      target={brand.website ? '_blank' : undefined}
      rel={brand.website ? 'noopener noreferrer' : undefined}
      className={cn(
        'flex h-20 w-32 shrink-0 items-center justify-center rounded-lg',
        'border border-outline-variant bg-surface-container-lowest p-sm',
        'transition-shadow hover:shadow-[var(--shadow-level-1)]',
        'sm:h-24 sm:w-40',
        className,
      )}
      aria-label={brand.name}
    >
      {brand.logo ? (
        <img
          src={getCloudinaryUrl(brand.logo, 'medium')}
          alt={brand.name}
          className="max-h-full max-w-full object-contain"
          loading="lazy"
        />
      ) : (
        <span className="label-md uppercase text-on-surface-variant">
          {brand.name}
        </span>
      )}
    </a>
  );
}
