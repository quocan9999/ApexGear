import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '../../utils/format';
import { getCloudinaryUrl } from '../../utils/cloudinary';
import QuantitySelector from '../product/QuantitySelector';
import type { BackendCartItem } from '../../types';

interface CartLineItemProps {
  item: BackendCartItem;
  onQuantityChange: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

const MAX_QUANTITY = 99;

function resolveUnitPrice(item: BackendCartItem): number {
  const { variant } = item;
  if (variant.price != null) return variant.price;
  return variant.product.salePrice ?? variant.product.basePrice ?? 0;
}

function resolveImageUrl(item: BackendCartItem): string | null {
  const images = item.variant.product.images ?? [];
  const primary = images.find((img) => img.isPrimary) ?? images[0];
  return primary?.url ?? null;
}

export default function CartLineItem({
  item,
  onQuantityChange,
  onRemove,
  disabled,
}: CartLineItemProps) {
  const { t } = useTranslation();
  const unitPrice = resolveUnitPrice(item);
  const imageUrl = resolveImageUrl(item);
  const { product } = item.variant;

  return (
    <div className="flex gap-md border-b border-outline-variant py-md last:border-b-0">
      <Link
        to={`/products/${product.slug}`}
        className="shrink-0 overflow-hidden rounded-lg bg-surface-container-lowest"
      >
        {imageUrl ? (
          <img
            src={getCloudinaryUrl(imageUrl, 'thumbnail')}
            alt={product.name}
            className="h-24 w-24 object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-24 w-24 bg-surface-container-high" aria-hidden />
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-xs">
        <Link
          to={`/products/${product.slug}`}
          className="body-md font-semibold text-on-surface hover:text-primary"
        >
          {product.name}
        </Link>
        {item.variant.name && (
          <p className="body-sm text-on-surface-variant">{item.variant.name}</p>
        )}
        <p className="body-sm text-on-surface-variant">{formatPrice(unitPrice)}</p>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-sm pt-sm">
          <QuantitySelector
            value={item.quantity}
            onChange={(qty) => onQuantityChange(item.id, qty)}
            min={1}
            max={MAX_QUANTITY}
          />
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            disabled={disabled}
            className="label-md text-error transition-colors hover:underline disabled:opacity-50"
          >
            {t('cart.remove')}
          </button>
        </div>
      </div>
    </div>
  );
}
