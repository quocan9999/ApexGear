import { useTranslation } from 'react-i18next';
import { formatDate } from '../../utils/format';
import type { Order } from '../../types';

interface OrderTimelineProps {
  order: Order;
}

interface TimelineStep {
  key: string;
  at: string | null;
}

export default function OrderTimeline({ order }: OrderTimelineProps) {
  const { t } = useTranslation();

  const steps: TimelineStep[] = order.cancelledAt
    ? [
        { key: 'created', at: order.createdAt },
        { key: 'cancelled', at: order.cancelledAt },
      ]
    : [
        { key: 'created', at: order.createdAt },
        { key: 'confirmed', at: order.confirmedAt },
        { key: 'shipped', at: order.shippedAt },
        { key: 'delivered', at: order.deliveredAt },
        { key: 'completed', at: order.completedAt },
      ];

  const reached = steps.filter((s) => s.at);

  return (
    <ol className="flex flex-col gap-md">
      {reached.map((step, idx) => {
        const isLast = idx === reached.length - 1;
        const isCancel = step.key === 'cancelled';
        return (
          <li key={step.key} className="flex gap-sm">
            <div className="flex flex-col items-center">
              <span
                className={
                  'mt-1 h-3 w-3 shrink-0 rounded-full ' +
                  (isCancel ? 'bg-error' : 'bg-primary')
                }
                aria-hidden="true"
              />
              {!isLast && <span className="w-px flex-1 bg-outline-variant" aria-hidden="true" />}
            </div>
            <div className="pb-md">
              <p className={'body-md font-medium ' + (isCancel ? 'text-error' : 'text-on-surface')}>
                {t(`orders.timeline.${step.key}`)}
              </p>
              {step.at && (
                <p className="body-sm text-on-surface-variant">{formatDate(step.at)}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
