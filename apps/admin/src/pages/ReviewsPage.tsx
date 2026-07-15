import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Button,
  Pagination,
  Select,
  Spinner,
  Table,
  type TableColumn,
} from '../components/ui';
import { reviewsService } from '../services/reviews.service';
import type { PageMeta, Review, ReviewStatus } from '../types';
import { formatDateTime } from '../utils/format';
import type { BadgeVariant } from '../components/ui/Badge';

const DEFAULT_META: PageMeta = { page: 1, limit: 20, total: 0, totalPages: 0 };

const STATUSES: ReviewStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];

function statusVariant(status: ReviewStatus): BadgeVariant {
  switch (status) {
    case 'APPROVED':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'REJECTED':
      return 'error';
    default:
      return 'default';
  }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-warning" aria-label={`${rating}/5`}>
      {'★'.repeat(rating)}
      {'☆'.repeat(5 - rating)}
    </span>
  );
}

export function ReviewsPage() {
  const { t } = useTranslation();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [meta, setMeta] = useState<PageMeta>(DEFAULT_META);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await reviewsService.list({
        page,
        limit: 20,
        ...(statusFilter ? { status: statusFilter as ReviewStatus } : {}),
      });
      setReviews(result.data);
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
      setReviews([]);
      setMeta(DEFAULT_META);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, t]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const handleApprove = async (reviewId: string) => {
    setActionLoading((prev) => ({ ...prev, [reviewId]: true }));
    try {
      await reviewsService.updateStatus(reviewId, 'APPROVED');
      await loadReviews();
    } catch {
      // Keep UI for retry.
    } finally {
      setActionLoading((prev) => ({ ...prev, [reviewId]: false }));
    }
  };

  const handleReject = async (reviewId: string) => {
    setActionLoading((prev) => ({ ...prev, [reviewId]: true }));
    try {
      await reviewsService.updateStatus(reviewId, 'REJECTED');
      await loadReviews();
    } catch {
      // Keep UI for retry.
    } finally {
      setActionLoading((prev) => ({ ...prev, [reviewId]: false }));
    }
  };

  const columns = useMemo<TableColumn<Review>[]>(
    () => [
      {
        key: 'product',
        header: t('reviews.columns.product'),
        render: (row) => row.product?.name ?? '—',
      },
      {
        key: 'user',
        header: t('reviews.columns.user'),
        render: (row) => (
          <div className="min-w-0">
            <div className="label-md text-on-surface">{row.user?.name}</div>
            <div className="body-sm text-on-surface-variant">{row.user?.email}</div>
          </div>
        ),
      },
      {
        key: 'rating',
        header: t('reviews.columns.rating'),
        render: (row) => <StarRating rating={row.rating} />,
      },
      {
        key: 'comment',
        header: t('reviews.columns.comment'),
        cellClassName: 'max-w-xs',
        render: (row) => (
          <span className="body-sm text-on-surface line-clamp-2">{row.comment ?? '—'}</span>
        ),
      },
      {
        key: 'status',
        header: t('common.status'),
        render: (row) => (
          <Badge variant={statusVariant(row.status)}>
            {t(`reviews.status.${row.status}`)}
          </Badge>
        ),
      },
      {
        key: 'createdAt',
        header: t('reviews.columns.date'),
        render: (row) => formatDateTime(row.createdAt),
      },
      {
        key: 'actions',
        header: t('common.actions'),
        cellClassName: 'whitespace-nowrap',
        render: (row) =>
          row.status === 'PENDING' ? (
            <div className="flex items-center gap-xs">
              <Button
                type="button"
                size="sm"
                variant="primary"
                isLoading={actionLoading[row.id]}
                loadingLabel={t('common.loading')}
                disabled={actionLoading[row.id]}
                onClick={() => void handleApprove(row.id)}
              >
                {t('reviews.approve')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                isLoading={actionLoading[row.id]}
                loadingLabel={t('common.loading')}
                disabled={actionLoading[row.id]}
                onClick={() => void handleReject(row.id)}
                className="border-error text-error hover:bg-error/5"
              >
                {t('reviews.reject')}
              </Button>
            </div>
          ) : (
            <Badge variant={statusVariant(row.status)}>
              {t(`reviews.status.${row.status}`)}
            </Badge>
          ),
      },
    ],
    [actionLoading, t],
  );

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-col gap-sm border-b border-outline-variant pb-md">
        <h2 id="reviews-page-title" className="headline-lg text-on-surface">
          {t('pages.reviews.title')}
        </h2>
      </div>

      <div className="md:w-64">
        <Select
          label={t('reviews.filters.status')}
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="">{t('reviews.filters.allStatuses')}</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {t(`reviews.status.${value}`)}
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
            data={reviews}
            rowKey="id"
            caption={t('pages.reviews.title')}
            emptyState={t('common.empty')}
          />
          <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

export default ReviewsPage;
