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

      <dl className="flex flex-col gap-sm">
        <div className="flex items-center justify-between">
          <dt className="body-md text-on-surface-variant">{t('cart.subtotal')}</dt>
          <dd className="body-md text-on-surface">{formatPrice(subtotal)}</dd>
        </div>

        {discount > 0 && (
          <div className="flex items-center justify-between">
            <dt className="body-md text-on-surface-variant">{t('cart.discount')}</dt>
            <dd className="body-md text-primary">-{formatPrice(discount)}</dd>
          </div>
        )}

        <div className="flex items-center justify-between">
          <dt className="body-md text-on-surface-variant">{t('cart.shipping')}</dt>
          <dd className="body-md text-on-surface">
            {shippingFee === undefined ? t('cart.shippingAtCheckout') : formatPrice(shippingFee)}
          </dd>
        </div>
      </dl>

      <div className="flex items-center justify-between border-t border-outline-variant pt-md">
        <span className="body-md font-semibold text-on-surface">{t('cart.total')}</span>
        <span className="headline-md text-primary">
          {shippingFee === undefined ? t('cart.shippingAtCheckout') : formatPrice(total)}
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
