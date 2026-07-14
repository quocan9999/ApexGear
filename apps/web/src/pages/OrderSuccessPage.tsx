import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { ordersService } from '../services/orders.service';
import { formatPrice } from '../utils/format';
import SepayQrPanel from '../components/payment/SepayQrPanel';
import Button from '../components/ui/Button';
import type { Order } from '../types';

type View = 'loading' | 'error' | 'qr' | 'success' | 'expired';

export default function OrderSuccessPage() {
  const { t } = useTranslation();
  const { orderId } = useParams<{ orderId: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    ordersService
      .getById(orderId)
      .then((data) => {
        if (!cancelled) setOrder(data);
      })
      .catch((err: { message?: string }) => {
        if (!cancelled) setError(err.message ?? t('common.error'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId, t]);

  const view: View = (() => {
    if (loading) return 'loading';
    if (error || !order || !orderId) return 'error';
    if (expired) return 'expired';
    const awaitingPayment =
      order.paymentMethod === 'SEPAY' && order.paymentStatus === 'UNPAID' && !paid;
    return awaitingPayment ? 'qr' : 'success';
  })();

  return (
    <div className="mx-auto w-full max-w-[1280px] px-md py-lg sm:px-lg">
      {view === 'loading' && (
        <div
          className="flex min-h-[50vh] items-center justify-center"
          role="status"
          aria-live="polite"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {view === 'error' && (
        <div className="mx-auto max-w-xl rounded-xl bg-surface-container-lowest p-lg text-center">
          <p className="body-md text-error">{error ?? t('common.error')}</p>
          <Link to="/products" className="mt-md inline-block">
            <Button variant="primary" size="lg">
              {t('orderSuccess.continueShopping')}
            </Button>
          </Link>
        </div>
      )}

      {view === 'qr' && order && orderId && (
        <div className="mx-auto max-w-xl">
          <SepayQrPanel
            orderId={orderId}
            onPaid={() => setPaid(true)}
            onExpired={() => setExpired(true)}
          />
        </div>
      )}

      {view === 'expired' && order && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="mx-auto max-w-xl rounded-xl bg-surface-container-lowest p-lg text-center"
        >
          <h1 className="headline-md text-error">{t('payment.expired')}</h1>
          <p className="mt-sm body-md text-on-surface-variant">
            {t('orderSuccess.orderNumber')}: {order.orderNumber}
          </p>
          <Link to="/products" className="mt-lg inline-block">
            <Button variant="primary" size="lg">
              {t('orderSuccess.continueShopping')}
            </Button>
          </Link>
        </motion.div>
      )}

      {view === 'success' && order && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="mx-auto max-w-xl rounded-xl bg-surface-container-lowest p-lg text-center"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/12">
            <svg
              className="h-8 w-8 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>

          <h1 className="mt-md headline-lg text-on-surface">{t('orderSuccess.title')}</h1>
          <p className="mt-sm body-md text-on-surface-variant">
            {paid || order.paymentStatus === 'PAID'
              ? t('orderSuccess.paidMessage')
              : t('orderSuccess.codMessage')}
          </p>

          <dl className="mt-lg flex flex-col gap-sm border-t border-outline-variant pt-lg text-left">
            <div className="flex items-center justify-between">
              <dt className="body-sm text-on-surface-variant">{t('orderSuccess.orderNumber')}</dt>
              <dd className="body-md font-semibold text-on-surface">{order.orderNumber}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="body-sm text-on-surface-variant">{t('orderSuccess.total')}</dt>
              <dd className="title-md text-primary">{formatPrice(order.total)}</dd>
            </div>
          </dl>

          <div className="mt-lg flex flex-wrap justify-center gap-sm">
            <Link to={`/orders/${order.id}`}>
              <Button variant="outline" size="lg">
                {t('orderSuccess.viewOrder')}
              </Button>
            </Link>
            <Link to="/products">
              <Button variant="primary" size="lg">
                {t('orderSuccess.continueShopping')}
              </Button>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}
