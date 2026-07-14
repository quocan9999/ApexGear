import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import type { ProductVariant } from '../../types';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export function publicStockStatus(s: ProductVariant['stockStatus']): StockStatus {
  if (s === 'OUT_OF_STOCK') return 'out_of_stock';
  if (s === 'LOW_STOCK') return 'low_stock';
  return 'in_stock';
}

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedId: string | null;
  onSelect: (variant: ProductVariant) => void;
  className?: string;
}

export default function VariantSelector({
  variants,
  selectedId,
  onSelect,
  className,
}: VariantSelectorProps) {
  const { t } = useTranslation();

  // Group by attribute key (e.g., "Color", "Size") when attributes are present.
  const attributeGroups = useMemo(() => {
    const map = new Map<string, { value: string; variant: ProductVariant }[]>();
    variants.forEach((v) => {
      const attrs = v.attributes ?? {};
      Object.entries(attrs).forEach(([key, value]) => {
        const existing = map.get(key) ?? ([] as { value: string; variant: ProductVariant }[]);
        existing.push({ value, variant: v });
        map.set(key, existing);
      });
    });
    return Array.from(map.entries());
  }, [variants]);

  const fallbackLabel = (v: ProductVariant) => {
    if (v.name) return v.name;
    const attrSummary = Object.values(v.attributes ?? {}).filter(Boolean).join(' / ');
    return attrSummary || v.sku;
  };

  if (variants.length === 0) {
    return null;
  }

  const renderButtonGroup = (label: string, options: { value: string; variant: ProductVariant }[]) => {
    const selectedAttrValue = options.find((o) => o.variant.id === selectedId)?.value;
    return (
      <div className="flex flex-col gap-sm" role="radiogroup" aria-label={label}>
        <span className="label-md text-on-surface">{label}</span>
        <div className="flex flex-wrap gap-sm">
          {options.map((opt) => {
            const isSelected = opt.value === selectedAttrValue;
            const isOut = opt.variant.stockStatus === 'OUT_OF_STOCK';
            return (
              <button
                key={opt.variant.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={`${label}: ${opt.value}${isOut ? ' (out of stock)' : ''}`}
                onClick={() => onSelect(opt.variant)}
                className={cn(
                  'rounded-md border px-md py-xs label-md transition-all',
                  'disabled:opacity-50 disabled:line-through',
                  isSelected
                    ? 'border-primary bg-primary-container text-on-primary-container'
                    : 'border-outline-variant text-on-surface hover:border-primary',
                )}
              >
                {opt.value}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('flex flex-col gap-md', className)}>
      <span className="label-md text-on-surface">{t('product.selectVariant')}</span>
      {attributeGroups.length > 0 ? (
        attributeGroups.map(([key, options]) => renderButtonGroup(key, options))
      ) : (
        <div className="flex flex-wrap gap-sm" role="radiogroup" aria-label={t('product.selectVariant')}>
          {variants.map((v) => {
            const isSelected = v.id === selectedId;
            const isOut = v.stockStatus === 'OUT_OF_STOCK';
            return (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onSelect(v)}
                disabled={isOut}
                className={cn(
                  'rounded-md border px-md py-xs label-md transition-all',
                  isSelected
                    ? 'border-primary bg-primary-container text-on-primary-container'
                    : 'border-outline-variant text-on-surface hover:border-primary',
                  isOut && 'opacity-50 line-through',
                )}
              >
                {fallbackLabel(v)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
