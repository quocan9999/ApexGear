import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Mousewheel } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import ProductCard from '../product/ProductCard';
import Skeleton from '../ui/Skeleton';
import type { Product } from '../../types';

interface FeaturedProductsProps {
  products: Product[];
  loading?: boolean;
}

export default function FeaturedProducts({ products, loading }: FeaturedProductsProps) {
  const { t } = useTranslation();

  return (
    <section className="bg-surface-container-low py-xl sm:py-xxl">
      <div className="mx-auto w-full max-w-[1280px] px-md sm:px-lg">
        <header className="mb-lg flex items-end justify-between gap-md">
          <h2 className="headline-lg text-on-surface">{t('home.featuredProducts')}</h2>
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
            ? Array.from({ length: 8 }).map((_, i) => (
                <SwiperSlide key={i} className="h-auto">
                  <div className="rounded-xl bg-surface-container-lowest p-md h-full">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <Skeleton className="mt-md h-4 w-1/3" />
                    <Skeleton className="mt-sm h-5 w-3/4" />
                    <Skeleton className="mt-sm h-6 w-1/2" />
                  </div>
                </SwiperSlide>
              ))
            : products.length === 0
            ? (
              <p className="col-span-full body-md text-on-surface-variant">
                {t('common.noResults')}
              </p>
            )
            : products.slice(0, 8).map((product) => (
                <SwiperSlide key={product.id} className="h-auto">
                  <ProductCard product={product} />
                </SwiperSlide>
              ))}
        </Swiper>

        <div className="mt-lg sm:hidden">
          <Link
            to="/products"
            className="block w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-md py-sm text-center body-sm font-semibold text-primary hover:bg-surface-container"
          >
            {t('common.viewAll')} →
          </Link>
        </div>
      </div>
    </section>
  );
}
