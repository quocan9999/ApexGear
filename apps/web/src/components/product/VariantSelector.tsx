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
  // Each group lists every value found across variants paired with the first
  // variant that carries it. Note: multiple variants can share the same value
  // (e.g. same color, different sizes); the pairing below is best-effort — see
  // resolveAttributeValue() for the better match used at click time.
  const attributeGroups = useMemo(() => {
    const map = new Map<string, Map<string, ProductVariant>>();
    variants.forEach((v) => {
      const attrs = v.attributes ?? {};
      Object.entries(attrs).forEach(([key, value]) => {
        const inner = map.get(key) ?? new Map<string, ProductVariant>();
        if (!inner.has(value)) inner.set(value, v);
        map.set(key, inner);
      });
    });
    return Array.from(map.entries()).map(([key, inner]) => ({
      key,
      options: Array.from(inner.entries()).map(([value, variant]) => ({ value, variant })),
    }));
  }, [variants]);

  const fallbackLabel = (v: ProductVariant) => {
    if (v.name) return v.name;
    const attrSummary = Object.values(v.attributes ?? {}).filter(Boolean).join(' / ');
    return attrSummary || v.sku;
  };

  // Best-effort match: when selecting an attribute value, pick the variant that
  // carries that value AND keeps as many of the currently selected attribute
  // values as possible. Falls back to the first variant that has the value and
  // is in stock, then any variant with that value.
  const resolveAttributeValue = (
    key: string,
    value: string,
    currentSelected?: ProductVariant | null,
  ): ProductVariant | null => {
    const candidates = variants.filter((v) => v.attributes?.[key] === value);
    if (candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0];

    const currentAttrs = currentSelected?.attributes ?? {};
    const score = (v: ProductVariant) => {
      const attrs = v.attributes ?? {};
      let s = 0;
      for (const [k, val] of Object.entries(currentAttrs)) {
        if (k === key) continue;
        if (attrs[k] === val) s += 1;
      }
      return s;
    };

    const inStock = candidates.filter((v) => v.stockStatus !== 'OUT_OF_STOCK');
    const pool = inStock.length > 0 ? inStock : candidates;
    const best = [...pool].sort((a, b) => score(b) - score(a))[0];
    return best ?? pool[0];
  };

  if (variants.length === 0) {
    return null;
  }

  const currentVariant = variants.find((v) => v.id === selectedId) ?? null;

  const renderButtonGroup = (
    label: string,
    options: { value: string; variant: ProductVariant }[],
  ) => {
    const selectedAttrValue = options.find((o) => o.variant.id === selectedId)?.value;
    return (
      <div className="flex flex-col gap-sm" role="radiogroup" aria-label={label}>
        <span className="label-md text-on-surface">{label}</span>
        <div className="flex flex-wrap gap-sm">
          {options.map((opt) => {
            const isSelected = opt.value === selectedAttrValue;
            // OOS is per the *original* paired variant — a value may also be
            // available via another in-stock variant with the same value. We
            // disable the option only if every variant carrying this value is
            // OOS, otherwise the user can still pick it via resolveAttributeValue.
            const valueOOS = variants
              .filter((v) => v.attributes?.[label] === opt.value)
              .every((v) => v.stockStatus === 'OUT_OF_STOCK');
            const isOut = valueOOS;
            return (
              <button
                key={`${label}:${opt.value}`}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-disabled={isOut}
                aria-label={`${label}: ${opt.value}${isOut ? ' ' + t('product.outOfStockSuffix') : ''}`}
                disabled={isOut}
                onClick={() => {
                  if (isOut) return;
                  const picked = resolveAttributeValue(label, opt.value, currentVariant);
                  if (picked) onSelect(picked);
                }}
                className={cn(
                  'rounded-md border px-md py-xs label-md transition-all',
                  'disabled:opacity-50 disabled:line-through disabled:cursor-not-allowed',
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
        attributeGroups.map((g) => renderButtonGroup(g.key, g.options))
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
                aria-disabled={isOut}
                aria-label={isOut ? `${fallbackLabel(v)} ${t('product.outOfStockSuffix')}` : fallbackLabel(v)}
                onClick={() => {
                  if (isOut) return;
                  onSelect(v);
                }}
                disabled={isOut}
                className={cn(
                  'rounded-md border px-md py-xs label-md transition-all',
                  'disabled:cursor-not-allowed',
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
