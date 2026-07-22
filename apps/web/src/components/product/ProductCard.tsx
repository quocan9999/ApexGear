import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import { formatPrice } from '../../utils/format';
import { getCloudinaryUrl } from '../../utils/cloudinary';
import StarRating from '../ui/StarRating';
import Badge from '../ui/Badge';
import { publicStockStatus } from './VariantSelector';
import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export default function ProductCard({ product, className }: ProductCardProps) {
  const { t } = useTranslation();
  const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
  const isOutOfStock = product.variants?.every((v) => publicStockStatus(v) === 'out_of_stock');

  return (
    <Link
      to={`/products/${product.slug}`}
      className={cn(
        'group block rounded-xl bg-surface-container-lowest p-lg',
        'shadow-[var(--shadow-level-1)] hover:shadow-[var(--shadow-level-2)]',
        'transition-shadow duration-300',
        className,
      )}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-container-low mb-md">
        {primaryImage ? (
          <img
            src={getCloudinaryUrl(primaryImage.url, 'medium')}
            alt={primaryImage.alt || product.name}
            className="h-full w-full object-contain p-sm"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-outline">
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {isOutOfStock && (
          <Badge variant="error" className="absolute top-sm right-sm">
            {t('common.outOfStock')}
          </Badge>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-xs">
        {product.brand && (
          <p className="label-sm text-outline uppercase">{product.brand.name}</p>
        )}
        <h3 className="body-md font-medium text-on-surface line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        {product.averageRating !== undefined && product.averageRating > 0 && (
          <div className="flex items-center gap-xs">
            <StarRating rating={product.averageRating} />
            <span className="body-sm text-outline">
              ({product._count?.reviews || 0})
            </span>
          </div>
        )}
        <div className="flex flex-wrap items-baseline gap-x-sm gap-y-0 mt-xs">
          <span className="headline-md text-primary">
            {formatPrice(product.salePrice ?? product.basePrice)}
          </span>
          {product.salePrice && product.salePrice < product.basePrice && (
            <span className="body-sm text-outline line-through">
              {formatPrice(product.basePrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
