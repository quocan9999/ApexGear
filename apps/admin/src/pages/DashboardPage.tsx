/* Hallmark · genre: modern-minimal · macrostructure: Bento Grid · design-system: DESIGN.md (Lumina Tech)
 * tone: technical SaaS admin · mood: modern + motion + tech · enrichment: none
 * constraints: no gradient · no pixel · CSS motion only · designed-as-app
 * pre-emit critique: P5 H5 E5 S4 R5 V4
 */
import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge, Spinner, StatCard, StatCardSkeleton } from '../components/ui';
import { dashboardService } from '../services/dashboard.service';
import { inventoryService } from '../services/inventory.service';
import { ordersService } from '../services/orders.service';
import { formatDateTime, formatPrice } from '../utils/format';
import { cn } from '../utils/cn';
import type { DashboardStats, InventoryItem, Order, RevenuePoint } from '../types';
import { orderStatusVariant } from './orders/OrderListPage';

const RevenueChart = lazy(() =>
  import('../components/charts/RevenueChart').then((mod) => ({
    default: mod.RevenueChart,
  })),
);

type Range = 7 | 30;

const RANGE_OPTIONS: ReadonlyArray<Range> = [7, 30];

function formatCount(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}

function IconRevenue() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5m0 14h16M8 15l3-4 3 2 4-6" />
    </svg>
  );
}

function IconOrders() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10M7 12h10M7 17h6" />
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <circle cx="9" cy="8" r="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5" />
      <circle cx="17" cy="9" r="2.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 19c0-1.8-1.3-3.3-3.2-3.8" />
    </svg>
  );
}

function IconLowStock() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 4.7 2.8 18a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.7a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}

function Panel({
  title,
  action,
  children,
  index,
  className,
  'aria-label': ariaLabel,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  index: number;
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <section
      aria-label={ariaLabel ?? title}
      className={cn(
        'admin-reveal admin-hover-lift flex min-w-0 flex-col gap-md rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-md shadow-level-1 md:p-lg',
        className,
      )}
      style={{ ['--i' as string]: index }}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="body-lg font-semibold text-on-surface">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [days, setDays] = useState<Range>(7);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStock, setLowStock] = useState<InventoryItem[]>([]);
  const lowStockTotal = stats?.lowStockCount ?? 0;

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      dashboardService.getStats(),
      dashboardService.getRevenue(7),
      ordersService.list({ limit: 5 }).catch(() => ({ data: [] })),
      inventoryService.lowStock({ limit: 5 }).catch(() => ({ data: [] })),
    ])
      .then(([nextStats, nextRevenue, ordersPage, lowStockPage]) => {
        if (cancelled) return;
        setStats(nextStats);
        setRevenue(nextRevenue);
        setRecentOrders(ordersPage.data);
        setLowStock(lowStockPage.data);
      })
      .catch(() => {
        if (cancelled) return;
        setStats({
          totalOrders: 0,
          totalRevenue: 0,
          totalProducts: 0,
          totalUsers: 0,
          pendingOrders: 0,
          lowStockCount: 0,
        });
        setRevenue([]);
        setRecentOrders([]);
        setLowStock([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleRangeChange = async (next: Range) => {
    if (next === days) return;
    setDays(next);
    setRevenueLoading(true);
    try {
      const data = await dashboardService.getRevenue(next);
      setRevenue(data);
    } catch {
      setRevenue([]);
    } finally {
      setRevenueLoading(false);
    }
  };

  const pendingHint =
    stats && stats.pendingOrders > 0
      ? `${formatCount(stats.pendingOrders)} ${t('orders.status.PENDING').toLowerCase()}`
      : undefined;

  const rangePills = (
    <div
      className="inline-flex items-center gap-xs rounded-full border border-outline-variant bg-surface-container-lowest p-xs shadow-level-1"
      role="group"
      aria-label={t('dashboard.chart.rangeLabel')}
    >
      {RANGE_OPTIONS.map((value) => {
        const isActive = value === days;
        return (
          <button
            key={value}
            type="button"
            onClick={() => void handleRangeChange(value)}
            aria-pressed={isActive}
            className={cn(
              'label-sm rounded-full px-md py-sm transition-[color,background-color,transform] duration-[var(--dur-short)] ease-[var(--ease-out)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              isActive
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface active:scale-[0.98]',
            )}
          >
            {t(value === 7 ? 'dashboard.range.7days' : 'dashboard.range.30days')}
          </button>
        );
      })}
    </div>
  );

  const topLowStock = lowStock.slice(0, 3);
  const lowStockMore = lowStockTotal - topLowStock.length;

  return (
    <div className="flex flex-col gap-lg">
      {/* Command strip — no pills, just title */}
      <div
        className="admin-reveal flex flex-col gap-md border-b border-outline-variant pb-md md:flex-row md:items-end md:justify-between"
        style={{ ['--i' as string]: 0 }}
      >
        <div className="min-w-0">
          <h2 id="dashboard-page-title" className="headline-lg text-on-surface md:text-headline-xl">
            {t('pages.dashboard.title')}
          </h2>
          <p className="mt-1 body-md text-on-surface-variant">{t('pages.dashboard.description')}</p>
        </div>
      </div>

      {/* KPI grid — 4 cols, skeleton while loading, sparkline when data ready */}
      <section
        aria-label={t('pages.dashboard.title')}
        className="grid grid-cols-1 gap-md sm:grid-cols-2 xl:grid-cols-4"
      >
        {!stats ? (
          <>
            <StatCardSkeleton index={1} featured />
            <StatCardSkeleton index={2} />
            <StatCardSkeleton index={3} />
            <StatCardSkeleton index={4} />
          </>
        ) : (
          <>
            <StatCard
              index={1}
              featured
              tone="primary"
              label={t('dashboard.stats.totalRevenue')}
              value={formatPrice(stats.totalRevenue)}
              icon={<IconRevenue />}
            />
            <StatCard
              index={2}
              label={t('dashboard.stats.totalOrders')}
              value={`${formatCount(stats.totalOrders)} ${t('dashboard.ordersSuffix')}`}
              hint={pendingHint}
              icon={<IconOrders />}
              to="/orders"
            />
            <StatCard
              index={3}
              tone="warning"
              label={t('dashboard.stats.lowStock')}
              value={`${formatCount(stats.lowStockCount)} ${t('dashboard.lowStockSuffix')}`}
              icon={<IconLowStock />}
              to="/inventory"
            />
            <StatCard
              index={4}
              label={t('dashboard.stats.totalUsers')}
              value={`${formatCount(stats.totalUsers)} ${t('dashboard.usersSuffix')}`}
              icon={<IconUsers />}
              to="/users"
            />
          </>
        )}
      </section>

      {/* Revenue chart — full bleed panel, range pills in header */}
      <Panel title={t('dashboard.chart.title')} index={6} action={revenue.length > 0 ? rangePills : undefined} aria-label={t('dashboard.chart.title')}>
        <div className="relative min-h-[280px] rounded-lg border border-outline-variant/60 bg-surface-container-low/40 p-sm md:p-md">
          {revenueLoading ? (
            <div
              className="flex items-center justify-center"
              style={{ height: 320 }}
              role="status"
              aria-label={t('dashboard.chart.loading')}
            >
              <Spinner label={t('dashboard.chart.loading')} />
            </div>
          ) : (
            <Suspense
              fallback={
                <div
                  className="flex items-center justify-center"
                  style={{ height: 320 }}
                  role="status"
                  aria-label={t('dashboard.chart.loading')}
                >
                  <Spinner label={t('dashboard.chart.loading')} />
                </div>
              }
            >
              <RevenueChart data={revenue} height={320} />
            </Suspense>
          )}
        </div>
      </Panel>

      {/* Operations split */}
      <div className="grid grid-cols-1 gap-md xl:grid-cols-5">
        <Panel
          className="xl:col-span-3"
          index={7}
          title={t('dashboard.recentOrders.title')}
          action={
            <Link
              to="/orders"
              className="label-sm font-semibold text-primary transition-colors hover:text-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {t('dashboard.recentOrders.viewAll')}
            </Link>
          }
        >
          {recentOrders.length === 0 ? (
            <p className="body-md text-on-surface-variant">{t('dashboard.recentOrders.empty')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left body-sm">
                <caption className="sr-only">{t('dashboard.recentOrders.title')}</caption>
                <thead className="border-b border-outline-variant body-sm text-on-surface-variant">
                  <tr>
                    <th className="px-2 py-2.5 font-semibold">
                      {t('dashboard.recentOrders.orderNumber')}
                    </th>
                    <th className="px-2 py-2.5 font-semibold">
                      {t('dashboard.recentOrders.customer')}
                    </th>
                    <th className="px-2 py-2.5 font-semibold">
                      {t('dashboard.recentOrders.total')}
                    </th>
                    <th className="px-2 py-2.5 font-semibold">
                      {t('dashboard.recentOrders.status')}
                    </th>
                    <th className="px-2 py-2.5 font-semibold">
                      {t('dashboard.recentOrders.createdAt')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-outline-variant/70 transition-colors last:border-b-0 hover:bg-surface-container-low/80"
                    >
                      <td className="px-2 py-2.5">
                        <Link
                          to={`/orders/${order.id}`}
                          className="label-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-2 py-2.5 text-on-surface">{order.shippingName}</td>
                      <td className="px-2 py-2.5 font-medium text-on-surface">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-2 py-2.5">
                        <Badge variant={orderStatusVariant(order.status)}>
                          {t(`orders.status.${order.status}`)}
                        </Badge>
                      </td>
                      <td className="px-2 py-2.5 text-on-surface-variant">
                        {formatDateTime(order.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel
          className="xl:col-span-2"
          index={8}
          title={t('dashboard.lowStockList.title')}
          action={
            <Link
              to="/inventory"
              className="label-sm font-semibold text-primary transition-colors hover:text-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {t('nav.inventory')}
            </Link>
          }
        >
          {topLowStock.length === 0 ? (
            <p className="body-md text-on-surface-variant">{t('dashboard.lowStockList.empty')}</p>
          ) : (
            <ul className="flex flex-col gap-sm">
              {topLowStock.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-outline-variant/70 bg-surface-container-low/50 px-3 py-2.5 transition-colors hover:border-outline hover:bg-surface-container-low"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={cn(
                        'mt-0.5 h-2 w-2 shrink-0 rounded-full',
                        item.stockAvailable <= 1 ? 'bg-error' : 'bg-warning',
                      )}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="label-sm truncate text-on-surface">{item.product.name}</p>
                      <p className="body-sm text-on-surface-variant">{item.sku}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="label-md font-semibold text-warning">{item.stockAvailable}</p>
                    <p className="label-sm text-on-surface-variant">
                      / {item.lowStockThreshold}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {lowStockMore > 0 && (
            <Link
              to="/inventory"
              className="label-sm mt-xs self-start font-semibold text-primary transition-colors hover:text-primary-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {t('dashboard.lowStockList.viewMore', { count: lowStockMore })}
            </Link>
          )}
        </Panel>
      </div>
    </div>
  );
}

export default DashboardPage;
