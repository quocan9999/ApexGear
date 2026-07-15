import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge, Spinner } from '../components/ui';
import { dashboardService } from '../services/dashboard.service';
import { ordersService } from '../services/orders.service';
import { formatDateTime, formatPrice } from '../utils/format';
import type { DashboardStats, Order, RevenuePoint } from '../types';
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

interface StatCardProps {
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
  icon: string;
}

function StatCard({ label, value, iconBg, iconColor, icon }: StatCardProps) {
  return (
    <div className="flex flex-col gap-sm rounded-xl bg-surface-container-lowest p-md shadow-level-1 transition-shadow">
      <div className="flex items-start justify-between">
        <span className="label-md text-on-surface-variant">{label}</span>
        <span
          className={`flex h-8 w-8 items-center justify-center rounded text-[18px] leading-none ${iconBg} ${iconColor}`}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
      <div className="headline-md text-on-surface">{value}</div>
    </div>
  );
}

export function DashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [days, setDays] = useState<Range>(7);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      dashboardService.getStats(),
      dashboardService.getRevenue(7),
      ordersService.list({ limit: 5 }).catch(() => ({ data: [] })),
    ])
      .then(([nextStats, nextRevenue, ordersPage]) => {
        if (cancelled) return;
        setStats(nextStats);
        setRevenue(nextRevenue);
        setRecentOrders(ordersPage.data);
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

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-col gap-sm border-b border-outline-variant pb-md md:flex-row md:items-center md:justify-between">
        <h2 id="dashboard-page-title" className="headline-lg text-on-surface md:text-headline-xl">
          {t('pages.dashboard.title')}
        </h2>
        <div
          className="inline-flex items-center gap-xs self-start rounded-lg border border-outline-variant bg-surface-container-lowest p-xs"
          role="group"
          aria-label={t('pages.dashboard.title')}
        >
          {RANGE_OPTIONS.map((value) => {
            const isActive = value === days;
            return (
              <button
                key={value}
                type="button"
                onClick={() => void handleRangeChange(value)}
                aria-pressed={isActive}
                className={
                  isActive
                    ? 'label-sm rounded px-md py-sm bg-primary-container text-on-primary-container transition-colors'
                    : 'label-sm rounded px-md py-sm text-on-surface-variant transition-colors hover:bg-surface-container-high'
                }
              >
                {t(value === 7 ? 'dashboard.range.7days' : 'dashboard.range.30days')}
              </button>
            );
          })}
        </div>
      </div>

      <section
        aria-label={t('pages.dashboard.title')}
        className="grid grid-cols-1 gap-md md:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          label={t('dashboard.stats.totalRevenue')}
          value={stats ? formatPrice(stats.totalRevenue) : '—'}
          iconBg="bg-primary-container/20"
          iconColor="text-primary"
          icon="₫"
        />
        <StatCard
          label={t('dashboard.stats.totalOrders')}
          value={
            stats
              ? `${formatCount(stats.totalOrders)} ${t('dashboard.ordersSuffix')}`
              : '—'
          }
          iconBg="bg-primary-container/20"
          iconColor="text-primary"
          icon="#"
        />
        <StatCard
          label={t('dashboard.stats.lowStock')}
          value={
            stats
              ? `${formatCount(stats.lowStockCount)} ${t('dashboard.lowStockSuffix')}`
              : '—'
          }
          iconBg="bg-warning/15"
          iconColor="text-warning"
          icon="!"
        />
        <StatCard
          label={t('dashboard.stats.totalUsers')}
          value={
            stats
              ? `${formatCount(stats.totalUsers)} ${t('dashboard.usersSuffix')}`
              : '—'
          }
          iconBg="bg-primary-container/20"
          iconColor="text-primary"
          icon="@"
        />
      </section>

      <section
        className="flex flex-col gap-md rounded-xl bg-surface-container-lowest p-md shadow-level-1 md:p-lg"
        aria-label={t('dashboard.chart.title')}
      >
        <h3 className="body-lg font-semibold text-on-surface">
          {t('dashboard.chart.title')}
        </h3>
        <div className="relative">
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
      </section>

      <section
        className="flex flex-col gap-md rounded-xl bg-surface-container-lowest p-md shadow-level-1 md:p-lg"
        aria-label={t('dashboard.recentOrders.title')}
      >
        <div className="flex items-center justify-between">
          <h3 className="body-lg font-semibold text-on-surface">
            {t('dashboard.recentOrders.title')}
          </h3>
          <Link to="/orders" className="label-sm text-primary hover:underline">
            {t('dashboard.recentOrders.viewAll')}
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="body-md text-on-surface-variant">{t('dashboard.recentOrders.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left body-sm">
              <caption className="sr-only">{t('dashboard.recentOrders.title')}</caption>
              <thead className="border-b border-outline-variant body-sm text-on-surface-variant">
                <tr>
                  <th className="px-2 py-2 font-semibold">{t('dashboard.recentOrders.orderNumber')}</th>
                  <th className="px-2 py-2 font-semibold">{t('dashboard.recentOrders.customer')}</th>
                  <th className="px-2 py-2 font-semibold">{t('dashboard.recentOrders.total')}</th>
                  <th className="px-2 py-2 font-semibold">{t('dashboard.recentOrders.status')}</th>
                  <th className="px-2 py-2 font-semibold">{t('dashboard.recentOrders.createdAt')}</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-outline-variant last:border-b-0">
                    <td className="px-2 py-2">
                      <Link
                        to={`/orders/${order.id}`}
                        className="label-sm text-primary hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-2 py-2 text-on-surface">{order.shippingName}</td>
                    <td className="px-2 py-2 text-on-surface">{formatPrice(order.total)}</td>
                    <td className="px-2 py-2">
                      <Badge variant={orderStatusVariant(order.status)}>
                        {t(`orders.status.${order.status}`)}
                      </Badge>
                    </td>
                    <td className="px-2 py-2 text-on-surface-variant">
                      {formatDateTime(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default DashboardPage;