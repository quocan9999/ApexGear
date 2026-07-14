import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import { productsService } from '../../services/products.service';
import ProductCard from './ProductCard';
import Skeleton from '../ui/Skeleton';
import type { Product } from '../../types';

interface RelatedProductsProps {
  categoryId: string;
  excludeProductId: string;
  className?: string;
}

const LIMIT = 8;

export default function RelatedProducts({
  categoryId,
  excludeProductId,
  className,
}: RelatedProductsProps) {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    productsService
      .getAll({ categoryId, limit: LIMIT, sortBy: 'createdAt', sortOrder: 'desc' })
      .then((res) => {
        if (!mounted) return;
        const items = (res.data ?? []).filter((p) => p.id !== excludeProductId);
        setProducts(items);
      })
      .catch(() => {
        if (!mounted) return;
        setProducts([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [categoryId, excludeProductId]);

  const scrollBy = (delta: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  if (!loading && products.length === 0) return null;

  return (
    <section className={cn('flex flex-col gap-md', className)} aria-labelledby="related-heading">
      <div className="flex items-center justify-between">
        <h2 id="related-heading" className="headline-md text-on-surface">
          {t('product.relatedProducts')}
        </h2>
        {!loading && products.length > 1 && (
          <div className="hidden gap-xs sm:flex">
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => scrollBy(-320)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant text-on-surface transition-colors hover:bg-surface-container-low"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path
                  fillRule="evenodd"
                  d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => scrollBy(320)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant text-on-surface transition-colors hover:bg-surface-container-low"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-md overflow-x-auto pb-sm"
        style={{ scrollbarWidth: 'thin' }}
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="w-64 flex-shrink-0 snap-start rounded-xl bg-surface-container-lowest p-md"
                aria-hidden
              >
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="mt-md h-4 w-1/3" />
                <Skeleton className="mt-sm h-5 w-3/4" />
                <Skeleton className="mt-sm h-6 w-1/2" />
              </div>
            ))
          : products.map((p) => (
              <div key={p.id} className="w-64 flex-shrink-0 snap-start">
                <ProductCard product={p} />
              </div>
            ))}
      </div>
    </section>
  );
}
