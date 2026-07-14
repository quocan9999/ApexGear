import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { ordersService } from '../services/orders.service';
import { formatPrice, formatDate } from '../utils/format';
import OrderStatusBadge from '../components/order/OrderStatusBadge';
import OrderTimeline from '../components/order/OrderTimeline';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import type { Order } from '../types';

export default function OrderDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    ordersService
      .getById(id)
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
  }, [id, t]);

  useEffect(() => load(), [load]);

  const handleCancel = async () => {
    if (!id) return;
    setCancelling(true);
    setCancelError(null);
    try {
      const updated = await ordersService.cancel(id);
      setOrder(updated);
      setConfirmOpen(false);
    } catch (err) {
      const message = (err as { message?: string }).message ?? t('orders.cancelError');
      setCancelError(message);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1280px] px-md py-lg sm:px-lg">
        <Skeleton className="h-8 w-48 rounded-md" />
        <Skeleton className="mt-md h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto w-full max-w-[1280px] px-md py-lg sm:px-lg">
        <div className="rounded-xl bg-surface-container-lowest p-lg text-center">
          <p className="body-md text-error">{error ?? t('common.error')}</p>
          <Link to="/orders" className="mt-md inline-block">
            <Button variant="outline">{t('orders.backToList')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const canCancel = order.status === 'PENDING';
  const canPay =
    order.paymentMethod === 'SEPAY' &&
    order.paymentStatus === 'UNPAID' &&
    order.status === 'PENDING';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="mx-auto w-full max-w-[1280px] px-md py-lg sm:px-lg"
    >
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <div className="flex items-center gap-sm">
          <h1 className="headline-md text-on-surface">{order.orderNumber}</h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <Link to="/orders" className="body-sm text-primary">
          {t('orders.backToList')}
        </Link>
      </div>
      <p className="mt-2xs body-sm text-on-surface-variant">
        {t('orders.placedOn')}: {formatDate(order.createdAt)}
      </p>

      <div className="mt-lg grid gap-lg lg:grid-cols-3">
        <div className="flex flex-col gap-lg lg:col-span-2">
          {/* Items */}
          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-md">
            <h2 className="title-md text-on-surface">{t('orders.items')}</h2>
            <ul className="mt-sm flex flex-col divide-y divide-outline-variant">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-sm py-sm">
                  <div>
                    <p className="body-md text-on-surface">{item.productName}</p>
                    {item.variantInfo && (
                      <p className="body-sm text-on-surface-variant">{item.variantInfo}</p>
                    )}
                    <p className="body-sm text-on-surface-variant">
                      {formatPrice(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <span className="body-md font-medium text-on-surface">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Shipping snapshot */}
          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-md">
            <h2 className="title-md text-on-surface">{t('orders.shippingInfo')}</h2>
            <div className="mt-sm flex flex-col gap-2xs body-sm text-on-surface-variant">
              <p className="text-on-surface">{order.shippingName}</p>
              <p>{order.shippingPhone}</p>
              <p>
                {order.shippingAddress}, {order.shippingWard}, {order.shippingDistrict},{' '}
                {order.shippingProvince}
              </p>
              {order.note && (
                <p>
                  {t('orders.note')}: {order.note}
                </p>
              )}
            </div>
          </section>

          {/* Timeline */}
          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-md">
            <h2 className="title-md text-on-surface">{t('orders.timelineTitle')}</h2>
            <div className="mt-md">
              <OrderTimeline order={order} />
            </div>
          </section>
        </div>

        {/* Summary + actions */}
        <aside className="flex h-fit flex-col gap-sm rounded-xl border border-outline-variant bg-surface-container-lowest p-md">
          <h2 className="title-md text-on-surface">{t('orders.summary')}</h2>
          <dl className="flex flex-col gap-2xs">
            <div className="flex items-center justify-between">
              <dt className="body-sm text-on-surface-variant">{t('orders.paymentMethod')}</dt>
              <dd className="body-sm text-on-surface">{t(`orders.paymentMethods.${order.paymentMethod}`)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="body-sm text-on-surface-variant">{t('orders.subtotal')}</dt>
              <dd className="body-sm text-on-surface">{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="body-sm text-on-surface-variant">{t('orders.shippingFee')}</dt>
              <dd className="body-sm text-on-surface">{formatPrice(order.shippingFee)}</dd>
            </div>
            {order.discount > 0 && (
              <div className="flex items-center justify-between">
                <dt className="body-sm text-on-surface-variant">{t('orders.discount')}</dt>
                <dd className="body-sm text-on-surface">-{formatPrice(order.discount)}</dd>
              </div>
            )}
            <div className="mt-xs flex items-center justify-between border-t border-outline-variant pt-xs">
              <dt className="body-md font-medium text-on-surface">{t('orders.total')}</dt>
              <dd className="title-md text-primary">{formatPrice(order.total)}</dd>
            </div>
          </dl>

          {canPay && (
            <Link to={`/checkout/success/${order.id}`} className="mt-sm">
              <Button variant="primary" className="w-full">
                {t('orders.pay')}
              </Button>
            </Link>
          )}

          {canCancel && (
            <Button
              variant="outline"
              className="mt-sm w-full text-error"
              onClick={() => {
                setCancelError(null);
                setConfirmOpen(true);
              }}
            >
              {t('orders.cancel')}
            </Button>
          )}
        </aside>
      </div>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-md"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-dialog-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-md rounded-xl bg-surface-container-lowest p-lg"
          >
            <h3 id="cancel-dialog-title" className="title-md text-on-surface">
              {t('orders.cancel')}
            </h3>
            <p className="mt-sm body-md text-on-surface-variant">{t('orders.cancelConfirm')}</p>
            {cancelError && <p className="mt-sm body-sm text-error">{cancelError}</p>}
            <div className="mt-lg flex justify-end gap-sm">
              <Button
                variant="ghost"
                onClick={() => setConfirmOpen(false)}
                disabled={cancelling}
              >
                {t('orders.dismiss')}
              </Button>
              <Button
                variant="primary"
                onClick={handleCancel}
                isLoading={cancelling}
              >
                {t('orders.confirm')}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
