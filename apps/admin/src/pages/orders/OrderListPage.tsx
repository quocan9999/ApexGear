import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Input,
  Pagination,
  Select,
  Spinner,
  Table,
  type TableColumn,
} from '../../components/ui';
import { ordersService } from '../../services/orders.service';
import type {
  Order,
  OrderStatus,
  PageMeta,
  PaymentMethod,
  PaymentStatus,
} from '../../types';
import type { BadgeVariant } from '../../components/ui/Badge';
import { formatDateTime, formatPrice } from '../../utils/format';

const DEFAULT_META: PageMeta = { page: 1, limit: 20, total: 0, totalPages: 0 };

const ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'SHIPPING',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
  'REFUNDED',
];

const PAYMENT_STATUSES: PaymentStatus[] = ['UNPAID', 'PAID', 'REFUNDED'];
const PAYMENT_METHODS: PaymentMethod[] = ['COD', 'SEPAY'];

export function orderStatusVariant(status: OrderStatus): BadgeVariant {
  switch (status) {
    case 'PENDING':
      return 'warning';
    case 'CONFIRMED':
    case 'SHIPPING':
      return 'primary';
    case 'DELIVERED':
    case 'COMPLETED':
      return 'success';
    case 'CANCELLED':
    case 'REFUNDED':
      return 'error';
    default:
      return 'default';
  }
}

export function paymentStatusVariant(status: PaymentStatus): BadgeVariant {
  switch (status) {
    case 'PAID':
      return 'success';
    case 'UNPAID':
      return 'warning';
    case 'REFUNDED':
      return 'error';
    default:
      return 'default';
  }
}

export function OrderListPage() {
  const { t } = useTranslation();

  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<PageMeta>(DEFAULT_META);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ordersService.list({
        page,
        limit: 20,
        search: search || undefined,
        status: (status as OrderStatus) || undefined,
        paymentStatus: (paymentStatus as PaymentStatus) || undefined,
        paymentMethod: (paymentMethod as PaymentMethod) || undefined,
      });
      setOrders(result.data);
      setMeta({
        page: result.meta?.page ?? page,
        limit: result.meta?.limit ?? 20,
        total: result.meta?.total ?? result.data.length,
        totalPages: result.meta?.totalPages ?? 1,
      });
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: string }).message)
          : t('common.genericError');
      setError(message);
      setOrders([]);
      setMeta(DEFAULT_META);
    } finally {
      setLoading(false);
    }
  }, [page, paymentMethod, paymentStatus, search, status, t]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const columns = useMemo<TableColumn<Order>[]>(
    () => [
      {
        key: 'orderNumber',
        header: t('orders.columns.orderNumber'),
        render: (row) => (
          <Link
            to={`/orders/${row.id}`}
            className="label-md text-primary hover:underline"
          >
            {row.orderNumber}
          </Link>
        ),
      },
      {
        key: 'customer',
        header: t('orders.columns.customer'),
        render: (row) => (
          <div className="min-w-0">
            <div className="label-md text-on-surface">{row.shippingName}</div>
            <div className="body-sm text-on-surface-variant">{row.shippingPhone}</div>
          </div>
        ),
      },
      {
        key: 'total',
        header: t('orders.columns.total'),
        render: (row) => formatPrice(row.total),
      },
      {
        key: 'status',
        header: t('orders.columns.status'),
        render: (row) => (
          <Badge variant={orderStatusVariant(row.status)}>
            {t(`orders.status.${row.status}`)}
          </Badge>
        ),
      },
      {
        key: 'paymentStatus',
        header: t('orders.columns.paymentStatus'),
        render: (row) => (
          <Badge variant={paymentStatusVariant(row.paymentStatus)}>
            {t(`orders.paymentStatus.${row.paymentStatus}`)}
          </Badge>
        ),
      },
      {
        key: 'createdAt',
        header: t('orders.columns.createdAt'),
        render: (row) => formatDateTime(row.createdAt),
      },
      {
        key: 'actions',
        header: t('common.actions'),
        cellClassName: 'whitespace-nowrap',
        render: (row) => (
          <Link to={`/orders/${row.id}`} className="label-sm text-primary hover:underline">
            {t('orders.viewDetail')}
          </Link>
        ),
      },
    ],
    [t],
  );

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-col gap-sm border-b border-outline-variant pb-md">
        <h2 id="orders-page-title" className="headline-lg text-on-surface">
          {t('pages.orders.title')}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-md md:grid-cols-2 xl:grid-cols-4">
        <Input
          label={t('common.search')}
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder={t('orders.searchPlaceholder')}
        />
        <Select
          label={t('orders.filters.status')}
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="">{t('orders.filters.allStatuses')}</option>
          {ORDER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {t(`orders.status.${value}`)}
            </option>
          ))}
        </Select>
        <Select
          label={t('orders.filters.paymentStatus')}
          value={paymentStatus}
          onChange={(event) => {
            setPaymentStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="">{t('orders.filters.allPaymentStatuses')}</option>
          {PAYMENT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {t(`orders.paymentStatus.${value}`)}
            </option>
          ))}
        </Select>
        <Select
          label={t('orders.filters.paymentMethod')}
          value={paymentMethod}
          onChange={(event) => {
            setPaymentMethod(event.target.value);
            setPage(1);
          }}
        >
          <option value="">{t('orders.filters.allPaymentMethods')}</option>
          {PAYMENT_METHODS.map((value) => (
            <option key={value} value={value}>
              {t(`orders.paymentMethod.${value}`)}
            </option>
          ))}
        </Select>
      </div>

      {error && (
        <p className="body-md text-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-xl" role="status">
          <Spinner label={t('common.loading')} />
        </div>
      ) : (
        <>
          <Table
            columns={columns}
            data={orders}
            rowKey="id"
            caption={t('pages.orders.title')}
            emptyState={t('common.empty')}
          />
          <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

export default OrderListPage;
