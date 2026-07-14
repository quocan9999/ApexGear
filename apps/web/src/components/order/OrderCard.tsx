import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { formatPrice, formatDate } from '../../utils/format';
import OrderStatusBadge from './OrderStatusBadge';
import type { Order } from '../../types';

interface OrderCardProps {
  order: Order;
}

export default function OrderCard({ order }: OrderCardProps) {
  const { t } = useTranslation();
  const itemCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <Link
        to={`/orders/${order.id}`}
        className="flex flex-col gap-sm rounded-xl border border-outline-variant bg-surface-container-lowest p-md transition-colors hover:bg-surface-container-low sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-col gap-2xs">
          <div className="flex items-center gap-sm">
            <span className="body-md font-semibold text-on-surface">{order.orderNumber}</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="body-sm text-on-surface-variant">
            {t('orders.placedOn')}: {formatDate(order.createdAt)}
          </p>
          <p className="body-sm text-on-surface-variant">
            {t('orders.itemCount', { count: itemCount })}
          </p>
        </div>
        <div className="flex items-center justify-between gap-md sm:flex-col sm:items-end">
          <span className="title-md text-primary">{formatPrice(order.total)}</span>
          <span className="body-sm text-primary">{t('orders.viewDetail')}</span>
        </div>
      </Link>
    </motion.div>
  );
}
