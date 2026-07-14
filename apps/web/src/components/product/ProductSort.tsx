import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';

export type SortKey = 'newest' | 'priceAsc' | 'priceDesc' | 'nameAsc';

interface ProductSortProps {
  value: SortKey;
  onChange: (value: SortKey) => void;
  className?: string;
}

const OPTIONS: { value: SortKey; key: string }[] = [
  { value: 'newest', key: 'product.sortOptions.newest' },
  { value: 'priceAsc', key: 'product.sortOptions.priceAsc' },
  { value: 'priceDesc', key: 'product.sortOptions.priceDesc' },
  { value: 'nameAsc', key: 'product.sortOptions.nameAsc' },
];

export default function ProductSort({ value, onChange, className }: ProductSortProps) {
  const { t } = useTranslation();

  return (
    <label className={cn('flex items-center gap-sm', className)}>
      <span className="label-md text-on-surface-variant whitespace-nowrap">
        {t('product.sort')}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as SortKey)}
          className={cn(
            'h-10 appearance-none rounded-md border bg-surface-container-lowest pl-md pr-xl body-sm',
            'border-outline-variant text-on-surface',
            'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
          )}
          aria-label={t('product.sort')}
        >
          {OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.key)}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          fill="currentColor"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 011.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </label>
  );
}
