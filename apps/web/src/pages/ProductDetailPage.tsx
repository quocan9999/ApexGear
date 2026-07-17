import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { formatPrice } from '../utils/format';
import { productsService } from '../services/products.service';
import { useCartStore } from '../stores/cart.store';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import StarRating from '../components/ui/StarRating';
import ImageGallery from '../components/product/ImageGallery';
import VariantSelector, {
  publicStockStatus,
  type StockStatus,
} from '../components/product/VariantSelector';
import QuantitySelector from '../components/product/QuantitySelector';
import ProductSpecs from '../components/product/ProductSpecs';
import CollapsibleSection from '../components/product/CollapsibleSection';
import ProductReviews from '../components/product/ProductReviews';
import RelatedProducts from '../components/product/RelatedProducts';
import type { Product, ProductVariant } from '../types';

const MAX_QUANTITY = 99;

const STOCK_BADGE: Record<StockStatus, { variant: 'success' | 'warning' | 'error'; labelKey: string }> = {
  in_stock: { variant: 'success', labelKey: 'common.inStock' },
  low_stock: { variant: 'warning', labelKey: 'common.lowStock' },
  out_of_stock: { variant: 'error', labelKey: 'common.outOfStock' },
};

/**
 * Light defensive guard for server-sanitized HTML: strip <script>, <style>, <iframe>,
 * and inline event handlers. Backend sanitization is the primary defense; this is a
 * last-line guard to avoid rendering obvious XSS vectors if a tag slipped through.
 */
function safeHtml(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .replace(/<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/<\s*style\b[^>]*>[\s\S]*?<\s*\/\s*style\s*>/gi, '')
    .replace(/<\s*iframe\b[^>]*>[\s\S]*?<\s*\/\s*iframe\s*>/gi, '')
    .replace(/<\s*object\b[^>]*>[\s\S]*?<\s*\/\s*object\s*>/gi, '')
    .replace(/<\s*embed\b[^>]*\/?>/gi, '')
    .replace(/ on[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/ on[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const addItem = useCartStore((s) => s.addItem);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let mounted = true;
    setLoading(true);
    setError(null);
    productsService
      .getBySlug(slug)
      .then((data) => {
        if (!mounted) return;
        const p = (data ?? null) as Product | null;
        setProduct(p);
        const defaultVariant =
          (p?.variants ?? []).find((v) => v.isDefault) ?? (p?.variants ?? [])[0] ?? null;
        setSelectedVariantId(defaultVariant?.id ?? null);
        setQuantity(1);
      })
      .catch(() => {
        if (!mounted) return;
        setError(t('common.error'));
        setProduct(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [slug, t]);

  const variants = useMemo(() => product?.variants ?? [], [product]);
  const selectedVariant: ProductVariant | null = useMemo(
    () => variants.find((v) => v.id === selectedVariantId) ?? null,
    [variants, selectedVariantId],
  );

  const stockStatus: StockStatus = selectedVariant
    ? publicStockStatus(selectedVariant.stockStatus)
    : variants.length === 0
      ? 'in_stock'
      : (variants.some((v) => publicStockStatus(v.stockStatus) !== 'out_of_stock')
          ? 'in_stock'
          : 'out_of_stock');

  const isOutOfStock = stockStatus === 'out_of_stock';

  const displayPrice = useMemo(() => {
    if (selectedVariant?.price != null) return selectedVariant.price;
    return product?.salePrice ?? product?.basePrice ?? 0;
  }, [selectedVariant, product]);

  const originalPrice = useMemo(() => {
    if (selectedVariant?.price != null && product?.salePrice == null) return product?.basePrice ?? null;
    if (product?.salePrice && product.salePrice < (product.basePrice ?? 0)) return product.basePrice;
    return null;
  }, [selectedVariant, product]);

  const handleAddToCart = async () => {
    if (!product || isOutOfStock) return;
    if (!selectedVariant) return;
    // Route through the store so state updates reactively (badge + cart page)
    // for both guest (localStorage) and authenticated (server cart) sessions.
    // Previously this wrote localStorage directly, so an authenticated add
    // never hit the server cart and the badge only refreshed on reload (F5).
    const qty = Math.min(MAX_QUANTITY, quantity);
    try {
      await addItem(selectedVariant.id, qty);
      setAdded(true);
      window.setTimeout(() => setAdded(false), 2000);
    } catch {
      // Surface nothing here; store keeps prior state on failure.
    }
  };

  if (loading) {
    return <ProductDetailSkeleton />;
  }

  if (error || !product) {
    return (
      <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-md px-md py-xxl text-center">
        <h1 className="headline-lg text-on-surface">{t('product.notFound')}</h1>
        <p className="body-md text-on-surface-variant">{error || ''}</p>
        <Link to="/products">
          <Button variant="primary" size="md">
            {t('common.continueShopping')}
          </Button>
        </Link>
      </div>
    );
  }

  const badge = STOCK_BADGE[stockStatus];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="mx-auto w-full max-w-[1280px] px-md py-lg sm:px-lg"
    >
      {/* Breadcrumb */}
      <nav className="mb-md body-sm text-on-surface-variant" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-xs">
          <li>
            <Link to="/" className="hover:text-primary">{t('nav.home')}</Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link to="/products" className="hover:text-primary">{t('nav.products')}</Link>
          </li>
          {product.category && (
            <>
              <li aria-hidden>/</li>
              <li className="text-on-surface">{product.category.name}</li>
            </>
          )}
        </ol>
      </nav>

      {/* Main product section */}
      <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
        <ImageGallery images={product.images ?? []} altText={product.name} />

        <div className="flex flex-col gap-md">
          {product.brand && (
            <p className="label-md uppercase text-on-surface-variant">{product.brand.name}</p>
          )}
          <h1 className="headline-lg text-on-surface">{product.name}</h1>

          {typeof product.averageRating === 'number' && product.averageRating > 0 && (
            <div className="flex items-center gap-sm">
              <StarRating rating={product.averageRating} size="md" />
              <span className="body-sm text-on-surface-variant">
                {product.averageRating.toFixed(1)} ({product._count?.reviews ?? 0})
              </span>
            </div>
          )}

          <div className="flex items-baseline gap-md">
            <span className="headline-lg text-primary">{formatPrice(displayPrice)}</span>
            {originalPrice && originalPrice > displayPrice && (
              <>
                <span className="body-md text-on-surface-variant line-through">
                  {formatPrice(originalPrice)}
                </span>
                <span className="rounded border border-error px-2 py-0.5 text-sm font-medium text-error">
                  -{Math.round(((Number(originalPrice) - Number(displayPrice)) / Number(originalPrice)) * 100)}%
                </span>
              </>
            )}
          </div>

          <Badge variant={badge.variant} className="self-start">
            {t(badge.labelKey)}
          </Badge>

          {/* Only surface the variant picker for products with real choices
              (>1 variant). Single-variant products still transact on their
              default variant — stock/cart always run on the variant, never on
              the product — but show no selector, matching the reference. */}
          {variants.length > 1 && (
            <VariantSelector
              variants={variants}
              selectedId={selectedVariantId}
              onSelect={(v) => setSelectedVariantId(v.id)}
            />
          )}

          <div className="flex flex-wrap items-end gap-md">
            <QuantitySelector
              value={quantity}
              onChange={setQuantity}
              min={1}
              max={MAX_QUANTITY}
            />
            <Button
              variant="primary"
              size="md"
              onClick={handleAddToCart}
              disabled={isOutOfStock || !selectedVariant}
              className="min-w-[180px]"
            >
              {t('product.addToCart')}
            </Button>
          </div>
        </div>
      </div>

      {/* Info + specs: description (left, collapsible) alongside the technical
          spec table (right, collapsible), matching the reference layout. On
          narrow screens they stack. */}
      {(product.description || (product.specs && product.specs.length > 0)) && (
        <div className="mt-xxl grid grid-cols-1 items-start gap-lg lg:grid-cols-[1.6fr_1fr]">
          {product.description ? (
            <CollapsibleSection title={t('product.description')}>
              <article
                className="product-description"
                // Backend sanitizes; client guard strips residual script/iframe/on-handlers.
                dangerouslySetInnerHTML={{ __html: safeHtml(product.description) }}
              />
            </CollapsibleSection>
          ) : (
            <div aria-hidden />
          )}

          {product.specs && product.specs.length > 0 && (
            <ProductSpecs specs={product.specs} />
          )}
        </div>
      )}

      {/* Reviews */}
      <div className="mt-xxl">
        <ProductReviews
          productId={product.id}
          averageRating={product.averageRating}
          reviewCount={product._count?.reviews}
        />
      </div>

      {/* Related */}
      <div className="mt-xxl">
        <RelatedProducts categoryId={product.categoryId} excludeProductId={product.id} />
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {added && (
          <div className="fixed top-6 left-1/2 z-50 -translate-x-1/2">
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="flex items-center gap-md rounded-lg bg-inverse-surface px-lg py-md text-inverse-on-surface shadow-lg"
            >
              <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="body-md font-medium">{t('product.addedToCart')}</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-md py-lg sm:px-lg">
      <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
        <Skeleton className="aspect-square w-full rounded-xl" />
        <div className="flex flex-col gap-md">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
      <div className="mt-xxl grid grid-cols-1 gap-md md:grid-cols-2">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    </div>
  );
}
