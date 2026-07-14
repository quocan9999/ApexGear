import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';
import Skeleton from '../ui/Skeleton';
import { cn } from '../../utils/cn';
import { formatPrice } from '../../utils/format';
import { getCloudinaryUrl } from '../../utils/cloudinary';
import type { Product } from '../../types';

interface HeroSectionProps {
  featured?: Product | null;
  loading?: boolean;
}

/**
 * Split hero (DESIGN_VARIANCE 6 anti-center-bias):
 * - Desktop: left column anchored top-left (not centered), right image anchored bottom-right
 * - Mobile: stacked, text left-aligned
 */
export default function HeroSection({ featured, loading }: HeroSectionProps) {
  const { t } = useTranslation();
  const primaryImage = featured?.images?.find((img) => img.isPrimary) || featured?.images?.[0];

  return (
    <section
      className={cn(
        'relative overflow-hidden bg-surface-container-low',
        'border-b border-outline-variant',
      )}
      aria-label={t('home.heroTitle')}
    >
      <div className="mx-auto w-full max-w-[1280px] px-md py-xl sm:px-lg sm:py-xxl">
        <div className="grid grid-cols-1 items-center gap-xl lg:grid-cols-12 lg:gap-lg">
          {/* LEFT — Copy column. Anti-center-bias: align top on desktop, generous left padding */}
          <div className="lg:col-span-7 lg:pt-xxl">
            <p className="label-md text-primary uppercase tracking-wider">
              ApexGear
            </p>
            <h1
              className={cn(
                'mt-sm text-on-surface',
                'headline-xl-mobile lg:headline-xl',
              )}
            >
              {t('home.heroTitle')}
            </h1>
            <p className="mt-md max-w-[520px] body-lg text-on-surface-variant">
              {t('home.heroSubtitle')}
            </p>

            <div className="mt-lg flex flex-wrap items-center gap-md">
              <Link to="/products">
                <Button variant="primary" size="lg">
                  {t('home.heroCta')}
                </Button>
              </Link>
              {featured && !loading && (
                <Link
                  to={`/products/${featured.slug}`}
                  className="body-md font-semibold text-primary hover:text-primary-container"
                >
                  {featured.name} →
                </Link>
              )}
            </div>

            {/* Featured product card preview (anti-center-bias: small, off-axis) */}
            {loading ? (
              <div className="mt-lg flex items-center gap-md">
                <Skeleton className="h-16 w-16 rounded-md" />
                <div className="flex-1 space-y-xs">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            ) : featured ? (
              <Link
                to={`/products/${featured.slug}`}
                className={cn(
                  'mt-lg inline-flex items-center gap-md rounded-lg',
                  'border border-outline-variant bg-surface-container-lowest',
                  'p-sm pr-md transition-shadow hover:shadow-[var(--shadow-level-2)]',
                )}
              >
                {primaryImage && (
                  <img
                    src={getCloudinaryUrl(primaryImage.url, 'thumbnail')}
                    alt={primaryImage.alt || featured.name}
                    className="h-16 w-16 rounded-md object-contain bg-surface-container-low"
                    loading="lazy"
                  />
                )}
                <div className="flex flex-col">
                  <span className="label-sm text-outline uppercase">
                    {featured.brand?.name ?? 'Featured'}
                  </span>
                  <span className="body-sm font-medium text-on-surface line-clamp-1">
                    {featured.name}
                  </span>
                  <span className="headline-md text-primary">
                    {formatPrice(featured.salePrice ?? featured.basePrice)}
                  </span>
                </div>
              </Link>
            ) : null}
          </div>

          {/* RIGHT — Featured product image (anchored bottom-right on desktop) */}
          <div className="relative lg:col-span-5">
            <div
              className={cn(
                'relative mx-auto aspect-square w-full max-w-[480px]',
                'lg:absolute lg:bottom-0 lg:right-0',
                'overflow-hidden rounded-xl bg-surface-container-lowest',
                'shadow-[var(--shadow-level-2)]',
              )}
            >
              {loading ? (
                <Skeleton className="h-full w-full rounded-xl" />
              ) : primaryImage ? (
                <img
                  src={getCloudinaryUrl(primaryImage.url, 'large')}
                  alt={primaryImage.alt || featured?.name || t('home.heroTitle')}
                  className="h-full w-full object-contain p-md"
                  loading="eager"
                  fetchPriority="high"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="headline-xl text-outline-variant opacity-30">
                    ApexGear
                  </span>
                </div>
              )}
            </div>

            {/* Decorative offset accent (anti-center-bias) */}
            <div
              aria-hidden
              className={cn(
                'absolute -z-10 rounded-2xl bg-primary-container/20',
                'hidden h-[88%] w-[88%] lg:block',
                'lg:-right-6 lg:-bottom-6',
              )}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
