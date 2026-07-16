import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Mousewheel } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
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

  if (!loading && products.length === 0) return null;

  return (
    <section className={cn('flex flex-col gap-md', className)} aria-labelledby="related-heading">
      <div className="flex items-center justify-between">
        <h2 id="related-heading" className="headline-md text-on-surface">
          {t('product.relatedProducts')}
        </h2>
      </div>

      <Swiper
        modules={[FreeMode, Mousewheel]}
        spaceBetween={16}
        slidesPerView="auto"
        freeMode={true}
        mousewheel={{ forceToAxis: true }}
        className="w-full !pb-4"
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <SwiperSlide key={i} className="!w-64 h-auto">
                <div className="w-64 rounded-xl bg-surface-container-lowest p-md h-full">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="mt-md h-4 w-1/3" />
                  <Skeleton className="mt-sm h-5 w-3/4" />
                  <Skeleton className="mt-sm h-6 w-1/2" />
                </div>
              </SwiperSlide>
            ))
          : products.map((p) => (
              <SwiperSlide key={p.id} className="!w-64 h-auto">
                <ProductCard product={p} />
              </SwiperSlide>
            ))}
      </Swiper>
    </section>
  );
}
