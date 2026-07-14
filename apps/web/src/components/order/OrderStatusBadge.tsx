import { useTranslation } from 'react-i18next';
import Badge from '../ui/Badge';
import type { OrderStatus } from '../../types';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

type BadgeVariant = 'default' | 'success' | 'warning' | 'error';

// Note: the shared Badge component only exposes default|success|warning|error
// (no info/accent), so the brief's PENDING/CONFIRMED=info and SHIPPING=accent
// cannot be matched exactly. We use `default` (neutral) for PENDING/CONFIRMED
// and SHIPPING — amber `warning` would misread as a problem state for in-transit.
const statusVariant: Record<OrderStatus, BadgeVariant> = {
  PENDING: 'default',
  CONFIRMED: 'default',
  SHIPPING: 'default',
  DELIVERED: 'success',
  COMPLETED: 'success',
  CANCELLED: 'error',
  REFUNDED: 'error',
};

export default function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const { t } = useTranslation();
  return <Badge variant={statusVariant[status]}>{t(`orderStatus.${status}`)}</Badge>;
}
