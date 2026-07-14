import { useTranslation } from 'react-i18next';
import ProductCard from './ProductCard';
import Skeleton from '../ui/Skeleton';
import type { Product } from '../../types';

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  skeletonCount?: number;
  className?: string;
}

export default function ProductGrid({
  products,
  loading,
  skeletonCount = 8,
  className,
}: ProductGridProps) {
  const { t } = useTranslation();

  return (
    <div
      className={
        className ??
        'grid grid-cols-2 gap-md sm:gap-lg md:grid-cols-3 lg:grid-cols-4'
      }
    >
      {loading
        ? Array.from({ length: skeletonCount }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-surface-container-lowest p-md"
              aria-hidden
            >
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="mt-md h-4 w-1/3" />
              <Skeleton className="mt-sm h-5 w-3/4" />
              <Skeleton className="mt-sm h-6 w-1/2" />
            </div>
          ))
        : products.length === 0
          ? (
            <div className="col-span-full flex flex-col items-center gap-sm py-xxl text-center">
              <svg
                className="h-12 w-12 text-outline"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.3-4.3M11 19a8 8 0 100-16 8 8 0 000 16z"
                />
              </svg>
              <p className="body-md text-on-surface-variant">
                {t('common.noResults')}
              </p>
            </div>
          )
          : products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
    </div>
  );
}
