import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { ordersService } from '../services/orders.service';
import OrderCard from '../components/order/OrderCard';
import Pagination from '../components/ui/Pagination';
import Skeleton from '../components/ui/Skeleton';
import { cn } from '../utils/cn';
import type { Order, OrderStatus } from '../types';

const PAGE_SIZE = 10;

const STATUS_FILTERS: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'SHIPPING',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
  'REFUNDED',
];

export default function OrdersPage() {
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<OrderStatus | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    ordersService
      .getAll({ page, limit: PAGE_SIZE, status })
      .then((res) => {
        if (cancelled) return;
        setOrders(res.data);
        const meta = res.meta;
        const computedPages =
          meta?.totalPages ??
          (meta?.total != null ? Math.max(1, Math.ceil(meta.total / (meta.limit ?? PAGE_SIZE))) : 1);
        setTotalPages(computedPages);
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
  }, [page, status, t]);

  useEffect(() => load(), [load]);

  const handleFilter = (next: OrderStatus | undefined) => {
    setStatus(next);
    setPage(1);
  };

  const tabBase =
    'shrink-0 rounded-full px-md py-xs body-sm font-medium transition-colors border';
  const tabIdle =
    'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low';
  const tabActive = 'border-primary bg-primary text-on-primary';

  return (
    <div className="mx-auto w-full max-w-[1280px] px-md py-lg sm:px-lg">
      <h1 className="headline-md text-on-surface">{t('orders.title')}</h1>

      <div className="mt-md flex gap-xs overflow-x-auto pb-xs" role="tablist" aria-label={t('orders.title')}>
        <button
          type="button"
          role="tab"
          aria-selected={status === undefined}
          onClick={() => handleFilter(undefined)}
          className={cn(tabBase, status === undefined ? tabActive : tabIdle)}
        >
          {t('orders.filterAll')}
        </button>
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={status === s}
            onClick={() => handleFilter(s)}
            className={cn(tabBase, status === s ? tabActive : tabIdle)}
          >
            {t(`orderStatus.${s}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-lg flex flex-col gap-sm">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="mt-lg rounded-xl bg-surface-container-lowest p-lg text-center">
          <p className="body-md text-error">{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="mt-lg rounded-xl bg-surface-container-lowest p-lg text-center"
        >
          <p className="body-md text-on-surface-variant">{t('orders.empty')}</p>
        </motion.div>
      ) : (
        <>
          <div className="mt-lg flex flex-col gap-sm">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            className="mt-lg"
          />
        </>
      )}
    </div>
  );
}
