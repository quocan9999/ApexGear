import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Mousewheel } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import Skeleton from '../ui/Skeleton';
import { cn } from '../../utils/cn';
import { getCloudinaryUrl } from '../../utils/cloudinary';
import type { Category } from '../../types';

interface FeaturedCategoriesProps {
  categories: Category[];
  loading?: boolean;
}

export default function FeaturedCategories({ categories, loading }: FeaturedCategoriesProps) {
  const { t } = useTranslation();
  const items = (categories ?? []).slice(0, 4);

  return (
    <section className="mx-auto w-full max-w-[1280px] px-md py-xl sm:px-lg sm:py-xxl">
      <header className="mb-lg flex items-end justify-between gap-md">
        <h2 className="headline-lg text-on-surface">{t('home.featuredCategories')}</h2>
        <Link
          to="/products"
          className="hidden body-sm font-semibold text-primary hover:text-primary-container sm:inline"
        >
          {t('common.viewAll')} →
        </Link>
      </header>

      <Swiper
        modules={[FreeMode, Mousewheel]}
        spaceBetween={16}
        slidesPerView={2}
        breakpoints={{
          640: { slidesPerView: 3, spaceBetween: 24 },
          1024: { slidesPerView: 4, spaceBetween: 32 },
        }}
        freeMode={true}
        mousewheel={{ forceToAxis: true }}
        className="w-full !pb-6"
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <SwiperSlide key={i} className="h-auto">
                <div className="rounded-xl bg-surface-container-lowest p-md h-full">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="mt-md h-5 w-2/3" />
                  <Skeleton className="mt-sm h-4 w-1/3" />
                </div>
              </SwiperSlide>
            ))
          : items.length === 0
          ? (
            <p className="col-span-full body-md text-on-surface-variant">
              {t('common.noResults')}
            </p>
          )
          : items.map((cat) => (
              <SwiperSlide key={cat.id} className="h-auto">
                <Link
                  to={`/products?categoryId=${cat.id}`}
                  className={cn(
                    'group block rounded-xl bg-surface-container-lowest p-md h-full',
                    'shadow-[var(--shadow-level-1)] hover:shadow-[var(--shadow-level-2)]',
                    'transition-shadow duration-300',
                  )}
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-container-low">
                    {cat.image ? (
                      <img
                        src={getCloudinaryUrl(cat.image, 'medium')}
                        alt={cat.name}
                        className="h-full w-full object-contain p-sm transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-outline">
                        <svg
                          className="h-12 w-12"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 6h16M4 12h16M4 18h16"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className="mt-md body-md font-semibold text-on-surface group-hover:text-primary transition-colors">
                    {cat.name}
                  </h3>
                  <span className="mt-xs inline-block label-sm text-primary">
                    {t('home.viewMore')} →
                  </span>
                </Link>
              </SwiperSlide>
            ))}
      </Swiper>
    </section>
  );
}
