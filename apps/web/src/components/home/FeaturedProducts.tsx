import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

        <div className="grid grid-cols-2 gap-md sm:gap-lg lg:grid-cols-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-surface-container-lowest p-md">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="mt-md h-4 w-1/3" />
                  <Skeleton className="mt-sm h-5 w-3/4" />
                  <Skeleton className="mt-sm h-6 w-1/2" />
                </div>
              ))
            : products.length === 0
            ? (
              <p className="col-span-full body-md text-on-surface-variant">
                {t('common.noResults')}
              </p>
            )
            : products.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>

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
