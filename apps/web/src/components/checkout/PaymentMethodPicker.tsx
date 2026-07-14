import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import type { PaymentMethod } from '../../types';

interface PaymentMethodPickerProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

const OPTIONS: { method: PaymentMethod; labelKey: string; descKey: string }[] = [
  { method: 'COD', labelKey: 'checkout.payment.cod', descKey: 'checkout.payment.codDesc' },
  { method: 'SEPAY', labelKey: 'checkout.payment.sepay', descKey: 'checkout.payment.sepayDesc' },
];

export default function PaymentMethodPicker({ value, onChange }: PaymentMethodPickerProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-sm">
      {OPTIONS.map(({ method, labelKey, descKey }) => {
        const active = value === method;
        return (
          <label
            key={method}
            className={cn(
              'flex cursor-pointer items-start gap-sm rounded-xl border p-md transition-colors',
              active
                ? 'border-primary bg-surface-container-low'
                : 'border-outline-variant hover:bg-surface-container-lowest',
            )}
          >
            <input
              type="radio"
              name="payment-method"
              className="mt-1 h-4 w-4 accent-primary"
              checked={active}
              onChange={() => onChange(method)}
            />
            <span className="flex flex-col gap-xs">
              <span className="body-md font-semibold text-on-surface">{t(labelKey)}</span>
              <span className="body-sm text-on-surface-variant">{t(descKey)}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}
