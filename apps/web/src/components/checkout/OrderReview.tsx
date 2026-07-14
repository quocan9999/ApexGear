import { useTranslation } from 'react-i18next';
import { formatPrice } from '../../utils/format';
import type { Address, BackendCartItem, PaymentMethod } from '../../types';

interface OrderReviewProps {
  items: BackendCartItem[];
  address: Address;
  paymentMethod: PaymentMethod;
  subtotal: number;
  discount: number;
  shippingFee?: number;
  total: number;
  couponCode?: string;
}

function unitPrice(item: BackendCartItem): number {
  const { variant } = item;
  if (variant.price != null) return variant.price;
  return variant.product.salePrice ?? variant.product.basePrice ?? 0;
}

export default function OrderReview({
  items,
  address,
  paymentMethod,
  subtotal,
  discount,
  shippingFee,
  total,
  couponCode,
}: OrderReviewProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-lg">
      <section className="rounded-xl border border-outline-variant p-md">
        <h3 className="label-md text-on-surface-variant">{t('checkout.review.shipTo')}</h3>
        <p className="mt-xs body-md font-semibold text-on-surface">
          {address.name} <span className="font-normal text-on-surface-variant">{address.phone}</span>
        </p>
        <p className="body-sm text-on-surface-variant">
          {address.detail}, {address.wardName}, {address.districtName}, {address.provinceName}
        </p>
      </section>

      <section className="rounded-xl border border-outline-variant p-md">
        <h3 className="label-md text-on-surface-variant">{t('checkout.review.paymentMethod')}</h3>
        <p className="mt-xs body-md text-on-surface">
          {paymentMethod === 'COD' ? t('checkout.payment.cod') : t('checkout.payment.sepay')}
        </p>
      </section>

      <section className="rounded-xl border border-outline-variant p-md">
        <h3 className="label-md text-on-surface-variant">{t('checkout.review.items')}</h3>
        <ul className="mt-sm flex flex-col gap-sm">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-sm">
              <span className="body-sm text-on-surface">
                {item.variant.product.name}
                {item.variant.name ? ` · ${item.variant.name}` : ''}
                <span className="text-on-surface-variant"> × {item.quantity}</span>
              </span>
              <span className="body-sm text-on-surface">
                {formatPrice(unitPrice(item) * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <dl className="flex flex-col gap-sm">
        <div className="flex items-center justify-between">
          <dt className="body-md text-on-surface-variant">{t('checkout.review.subtotal')}</dt>
          <dd className="body-md text-on-surface">{formatPrice(subtotal)}</dd>
        </div>
        {discount > 0 && (
          <div className="flex items-center justify-between">
            <dt className="body-md text-on-surface-variant">
              {t('checkout.review.discount')}
              {couponCode ? ` (${couponCode})` : ''}
            </dt>
            <dd className="body-md text-primary">-{formatPrice(discount)}</dd>
          </div>
        )}
        <div className="flex items-center justify-between">
          <dt className="body-md text-on-surface-variant">{t('checkout.review.shipping')}</dt>
          <dd className="body-md text-on-surface">
            {shippingFee === undefined
              ? t('checkout.review.shippingComputed')
              : formatPrice(shippingFee)}
          </dd>
        </div>
        <div className="flex items-center justify-between border-t border-outline-variant pt-md">
          <span className="body-md font-semibold text-on-surface">{t('checkout.review.total')}</span>
          <span className="headline-md text-primary">{formatPrice(total)}</span>
        </div>
      </dl>
    </div>
  );
}
