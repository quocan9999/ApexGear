import { useTranslation } from 'react-i18next';
import { formatPrice } from '../../utils/format';
import Button from '../ui/Button';

interface CartSummaryProps {
  subtotal: number;
  discount: number;
  shippingFee?: number;
  total: number;
  onCheckout: () => void;
  checkoutDisabled?: boolean;
}

export default function CartSummary({
  subtotal,
  discount,
  shippingFee,
  total,
  onCheckout,
  checkoutDisabled,
}: CartSummaryProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-md rounded-xl bg-surface-container-lowest p-lg">
      <h2 className="headline-md text-on-surface">{t('cart.summaryTitle')}</h2>

      {discount > 0 && (
        <dl className="flex flex-col gap-sm">
          <div className="flex items-center justify-between">
            <dt className="body-md text-on-surface-variant">{t('cart.discount')}</dt>
            <dd className="body-md text-primary">-{formatPrice(discount)}</dd>
          </div>
        </dl>
      )}

      <div className={`flex items-center justify-between ${discount > 0 ? 'border-t border-outline-variant pt-md' : ''}`}>
        <span className="body-md font-semibold text-on-surface">{t('cart.total')}</span>
        <span className="headline-md text-primary">
          {formatPrice(total)}
        </span>
      </div>

      <Button
        type="button"
        variant="primary"
        size="lg"
        onClick={onCheckout}
        disabled={checkoutDisabled}
        className="w-full"
      >
        {t('cart.checkout')}
      </Button>
    </div>
  );
}
