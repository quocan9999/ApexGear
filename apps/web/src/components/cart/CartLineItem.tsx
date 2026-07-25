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
  onMaxStockError?: (stock: number) => void;
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
  onMaxStockError,
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
            onChange={(qty) => {
              const stock = item.variant.stockAvailable ?? MAX_QUANTITY;
              if (qty > stock) {
                onMaxStockError?.(stock);
                return;
              }
              onQuantityChange(item.id, qty);
            }}
            min={1}
            max={MAX_QUANTITY}
          />
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            disabled={disabled}
            className="inline-flex items-center gap-xs label-md text-error transition-colors hover:underline disabled:opacity-50"
          >
            <svg
              className="h-4 w-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
              />
            </svg>
            <span>{t('cart.remove')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
