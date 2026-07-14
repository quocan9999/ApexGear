import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';

interface QuantitySelectorProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export default function QuantitySelector({
  value,
  onChange,
  min = 1,
  max,
  className,
}: QuantitySelectorProps) {
  const { t } = useTranslation();
  const safeMax = max && max > 0 ? max : undefined;
  const effectiveMax = safeMax ?? Number.POSITIVE_INFINITY;
  const clamped = Math.min(Math.max(value, min), effectiveMax);

  const decrement = () => {
    onChange(Math.max(min, clamped - 1));
  };
  const increment = () => {
    onChange(Math.min(effectiveMax, clamped + 1));
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = Number(e.target.value.replace(/[^0-9]/g, ''));
    if (!Number.isFinite(raw)) {
      onChange(min);
      return;
    }
    onChange(Math.min(Math.max(raw, min), effectiveMax));
  };

  return (
    <div className={cn('flex flex-col gap-sm', className)}>
      <label htmlFor="quantity-input" className="label-md text-on-surface">
        {t('product.quantity')}
      </label>
      <div className="inline-flex h-12 items-center rounded-lg border border-outline-variant bg-surface-container-lowest">
        <button
          type="button"
          onClick={decrement}
          disabled={clamped <= min}
          aria-label="Decrease quantity"
          className="flex h-full w-12 items-center justify-center text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path fillRule="evenodd" d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" clipRule="evenodd" />
          </svg>
        </button>
        <input
          id="quantity-input"
          type="text"
          inputMode="numeric"
          value={clamped}
          onChange={handleInput}
          aria-label={t('product.quantity')}
          className="h-full w-16 border-x border-outline-variant bg-transparent text-center body-md text-on-surface focus:outline-none"
        />
        <button
          type="button"
          onClick={increment}
          disabled={safeMax !== undefined && clamped >= safeMax}
          aria-label="Increase quantity"
          className="flex h-full w-12 items-center justify-center text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-50"
        >
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path fillRule="evenodd" d="M10 4a.75.75 0 01.75.75v4.5h4.5a.75.75 0 010 1.5h-4.5v4.5a.75.75 0 01-1.5 0v-4.5h-4.5a.75.75 0 010-1.5h4.5v-4.5A.75.75 0 0110 4z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}
