import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { formatDate } from '../../utils/format';
import StarRating from '../ui/StarRating';
import Button from '../ui/Button';
import Skeleton from '../ui/Skeleton';
import ReviewForm from './ReviewForm';
import { reviewsService } from '../../services/reviews.service';
import { useAuthStore } from '../../stores/auth.store';
import type { Review } from '../../types';

interface ProductReviewsProps {
  productId: string;
  averageRating?: number;
  reviewCount?: number;
  className?: string;
}

const PAGE_SIZE = 5;

export default function ProductReviews({
  productId,
  averageRating,
  reviewCount,
  className,
}: ProductReviewsProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    reviewsService
      .getByProduct(productId, { page, limit: PAGE_SIZE })
      .then((res) => {
        if (!mounted) return;
        setReviews(res.data ?? []);
        setTotalPages(res.meta?.totalPages ?? 1);
      })
      .catch(() => {
        if (!mounted) return;
        setError(t('common.error'));
        setReviews([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [productId, page, refreshKey, t]);

  const handleSubmitted = useCallback(() => {
    // Return to the first page and refetch so the new review surfaces.
    setPage(1);
    setRefreshKey((k) => k + 1);
  }, []);

  const loginHref = `/login?redirect=${encodeURIComponent(location.pathname + location.search)}`;

  return (
    <section className={cn('flex flex-col gap-md', className)} aria-labelledby="reviews-heading">
      <div className="flex flex-wrap items-end justify-between gap-md">
        <h2 id="reviews-heading" className="headline-md text-on-surface">
          {t('product.reviews')}
        </h2>
        {typeof averageRating === 'number' && averageRating > 0 && (
          <div className="flex items-center gap-sm">
            <StarRating rating={averageRating} size="md" />
            <span className="body-md text-on-surface-variant">
              {averageRating.toFixed(1)}
              {typeof reviewCount === 'number' && ` · ${reviewCount}`}
            </span>
          </div>
        )}
      </div>

      {/* Write a review (authenticated only; not gated on purchase/delivery) */}
      {isAuthenticated ? (
        <ReviewForm productId={productId} onSubmitted={handleSubmitted} />
      ) : (
        <p className="body-sm text-on-surface-variant">
          <Link to={loginHref} className="text-primary hover:underline">
            {t('reviews.form.loginPrompt')}
          </Link>
        </p>
      )}

      {/* Reviews list */}
      {loading ? (
        <ul className="flex flex-col gap-md">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="rounded-xl bg-surface-container-lowest p-md">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-sm h-3 w-24" />
              <Skeleton className="mt-sm h-3 w-full" />
            </li>
          ))}
        </ul>
      ) : error ? (
        <p className="body-md text-error">{error}</p>
      ) : reviews.length === 0 ? (
        <p className="body-md text-on-surface-variant">
          {t('review.noReviewsYet')}
        </p>
      ) : (
        <ul className="flex flex-col gap-md">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="rounded-xl bg-surface-container-lowest p-md"
            >
              <div className="flex items-center justify-between gap-md">
                <div className="flex items-center gap-sm">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-container text-label-md text-on-primary-container">
                    {review.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="label-md text-on-surface">{review.user.name}</span>
                    <span className="body-sm text-on-surface-variant">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                </div>
                <StarRating rating={review.rating} />
              </div>
              {review.comment && (
                <p className="mt-sm body-md text-on-surface">{review.comment}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-sm">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t('review.previous')}
          </Button>
          <span className="body-sm text-on-surface-variant">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            {t('review.next')}
          </Button>
        </div>
      )}
    </section>
  );
}
