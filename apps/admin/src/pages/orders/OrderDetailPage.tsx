import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Button,
  Modal,
  Spinner,
  Table,
  Textarea,
  type TableColumn,
} from '../../components/ui';
import { ordersService } from '../../services/orders.service';
import type { Order, OrderItem, OrderStatus } from '../../types';
import { formatDateTime, formatPrice } from '../../utils/format';
import {
  getAllowedTransitions,
  requiresCancelReason,
} from '../../utils/order-transitions';
import { orderStatusVariant, paymentStatusVariant } from './OrderListPage';

export function OrderDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const [reasonOpen, setReasonOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [reasonError, setReasonError] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    if (!id) {
      setError(t('orders.notFound'));
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await ordersService.getById(id);
      setOrder(data);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: string }).message)
          : t('common.genericError');
      setError(message);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  const transitions = useMemo(
    () => (order ? getAllowedTransitions(order.status) : []),
    [order],
  );

  const applyStatus = async (status: OrderStatus, reason?: string) => {
    if (!order) return;
    setUpdating(true);
    setActionError(null);
    try {
      const updated = await ordersService.updateStatus(order.id, {
        status,
        ...(reason ? { cancelReason: reason } : {}),
      });
      setOrder(updated);
      setReasonOpen(false);
      setPendingStatus(null);
      setCancelReason('');
      setReasonError(null);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: string }).message)
          : t('common.genericError');
      setActionError(message);
    } finally {
      setUpdating(false);
    }
  };

  const handleTransitionClick = (status: OrderStatus) => {
    setActionError(null);
    if (requiresCancelReason(status)) {
      setPendingStatus(status);
      setCancelReason('');
      setReasonError(null);
      setReasonOpen(true);
      return;
    }
    void applyStatus(status);
  };

  const handleReasonSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!pendingStatus) return;
    const trimmed = cancelReason.trim();
    if (!trimmed) {
      setReasonError(t('orders.reasonRequired'));
      return;
    }
    await applyStatus(pendingStatus, trimmed);
  };

  const itemColumns = useMemo<TableColumn<OrderItem>[]>(
    () => [
      {
        key: 'product',
        header: t('orders.items.product'),
        render: (row) => (
          <div className="min-w-0">
            <div className="label-md text-on-surface">{row.productName}</div>
            {row.variantInfo && (
              <div className="body-sm text-on-surface-variant">{row.variantInfo}</div>
            )}
          </div>
        ),
      },
      {
        key: 'price',
        header: t('orders.items.price'),
        render: (row) => formatPrice(row.price),
      },
      {
        key: 'quantity',
        header: t('orders.items.quantity'),
        render: (row) => new Intl.NumberFormat('vi-VN').format(row.quantity),
      },
      {
        key: 'lineTotal',
        header: t('orders.items.lineTotal'),
        render: (row) => formatPrice(row.price * row.quantity),
      },
    ],
    [t],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-xl" role="status">
        <Spinner label={t('common.loading')} />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col gap-md">
        <Link to="/orders" className="label-sm text-primary hover:underline self-start">
          {t('orders.backToList')}
        </Link>
        <p className="body-md text-error" role="alert">
          {error ?? t('orders.notFound')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-col gap-sm border-b border-outline-variant pb-md md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-xs">
          <Link to="/orders" className="label-sm text-primary hover:underline self-start">
            {t('orders.backToList')}
          </Link>
          <h2 id="order-detail-title" className="headline-lg text-on-surface">
            {t('orders.detailTitle', { orderNumber: order.orderNumber })}
          </h2>
          <p className="body-sm text-on-surface-variant">
            {t('orders.createdAtLabel', { date: formatDateTime(order.createdAt) })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-sm">
          <Badge variant={orderStatusVariant(order.status)}>
            {t(`orders.status.${order.status}`)}
          </Badge>
          <Badge variant={paymentStatusVariant(order.paymentStatus)}>
            {t(`orders.paymentStatus.${order.paymentStatus}`)}
          </Badge>
          <Badge variant="default">{t(`orders.paymentMethod.${order.paymentMethod}`)}</Badge>
        </div>
      </div>

      {actionError && (
        <p className="body-md text-error" role="alert">
          {actionError}
        </p>
      )}

      {transitions.length > 0 && (
        <section
          className="flex flex-col gap-sm rounded-xl bg-surface-container-lowest p-md shadow-level-1"
          aria-label={t('orders.transitions')}
        >
          <h3 className="body-lg font-semibold text-on-surface">{t('orders.transitions')}</h3>
          <div className="flex flex-wrap gap-sm">
            {transitions.map((next) => {
              const isDanger = requiresCancelReason(next);
              return (
                <Button
                  key={next}
                  type="button"
                  variant={isDanger ? 'danger' : 'primary'}
                  isLoading={updating && !reasonOpen}
                  loadingLabel={t('common.loading')}
                  disabled={updating}
                  onClick={() => handleTransitionClick(next)}
                >
                  {t(`orders.actions.${next}`)}
                </Button>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
        <section className="flex flex-col gap-sm rounded-xl bg-surface-container-lowest p-md shadow-level-1">
          <h3 className="body-lg font-semibold text-on-surface">{t('orders.shipping.title')}</h3>
          <dl className="grid grid-cols-1 gap-sm body-md text-on-surface">
            <div>
              <dt className="body-sm text-on-surface-variant">{t('orders.shipping.name')}</dt>
              <dd>{order.shippingName}</dd>
            </div>
            <div>
              <dt className="body-sm text-on-surface-variant">{t('orders.shipping.phone')}</dt>
              <dd>{order.shippingPhone}</dd>
            </div>
            <div>
              <dt className="body-sm text-on-surface-variant">{t('orders.shipping.address')}</dt>
              <dd>
                {order.shippingAddress}, {order.shippingWard}, {order.shippingProvince}
              </dd>
            </div>
            {order.note && (
              <div>
                <dt className="body-sm text-on-surface-variant">{t('orders.shipping.note')}</dt>
                <dd>{order.note}</dd>
              </div>
            )}
            {order.cancelReason && (
              <div>
                <dt className="body-sm text-on-surface-variant">{t('orders.shipping.cancelReason')}</dt>
                <dd>{order.cancelReason}</dd>
              </div>
            )}
          </dl>
          {order.user && (
            <p className="body-sm text-on-surface-variant">
              {t('orders.customerAccount', {
                name: order.user.name,
                email: order.user.email,
              })}
            </p>
          )}
        </section>

        <section className="flex flex-col gap-sm rounded-xl bg-surface-container-lowest p-md shadow-level-1">
          <h3 className="body-lg font-semibold text-on-surface">{t('orders.totals.title')}</h3>
          <dl className="flex flex-col gap-sm body-md text-on-surface">
            <div className="flex items-center justify-between">
              <dt className="text-on-surface-variant">{t('orders.totals.subtotal')}</dt>
              <dd>{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-on-surface-variant">{t('orders.totals.shippingFee')}</dt>
              <dd>{formatPrice(order.shippingFee)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-on-surface-variant">{t('orders.totals.discount')}</dt>
              <dd>-{formatPrice(order.discount)}</dd>
            </div>
            <div className="flex items-center justify-between border-t border-outline-variant pt-sm label-md">
              <dt>{t('orders.totals.total')}</dt>
              <dd>{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="flex flex-col gap-md rounded-xl bg-surface-container-lowest p-md shadow-level-1">
        <h3 className="body-lg font-semibold text-on-surface">{t('orders.items.title')}</h3>
        <Table
          columns={itemColumns}
          data={order.items}
          rowKey="id"
          caption={t('orders.items.title')}
          emptyState={t('common.empty')}
        />
      </section>

      <Modal
        isOpen={reasonOpen}
        onClose={() => {
          if (updating) return;
          setReasonOpen(false);
          setPendingStatus(null);
          setReasonError(null);
        }}
        title={
          pendingStatus === 'REFUNDED'
            ? t('orders.reasonModal.refundTitle')
            : t('orders.reasonModal.cancelTitle')
        }
      >
        <form className="flex flex-col gap-md" onSubmit={(event) => void handleReasonSubmit(event)}>
          {reasonError && (
            <p className="body-md text-error" role="alert">
              {reasonError}
            </p>
          )}
          <Textarea
            label={t('orders.reasonModal.reason')}
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            rows={4}
            required
          />
          <div className="flex justify-end gap-sm pt-sm">
            <Button
              type="button"
              variant="outline"
              disabled={updating}
              onClick={() => {
                if (!updating) {
                  setReasonOpen(false);
                  setPendingStatus(null);
                  setReasonError(null);
                }
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" isLoading={updating} loadingLabel={t('common.loading')}>
              {t('common.confirm')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default OrderDetailPage;
