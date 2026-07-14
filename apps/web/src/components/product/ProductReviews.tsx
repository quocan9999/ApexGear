import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import { formatDate } from '../../utils/format';
import StarRating from '../ui/StarRating';
import Button from '../ui/Button';
import Skeleton from '../ui/Skeleton';
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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Review form
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
  }, [productId, page, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await reviewsService.create({
        productId,
        rating,
        comment: comment.trim() || undefined,
      });
      setComment('');
      setRating(5);
      setShowForm(false);
      // Reload first page to surface the new review (if approved backend-side).
      setPage(1);
      const res = await reviewsService.getByProduct(productId, { page: 1, limit: PAGE_SIZE });
      setReviews(res.data ?? []);
      setTotalPages(res.meta?.totalPages ?? 1);
    } catch (err: any) {
      setSubmitError(err?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

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

      {/* Write a review form (authenticated only) */}
      {isAuthenticated ? (
        <div className="rounded-xl bg-surface-container-lowest p-md">
          {!showForm ? (
            <Button variant="outline" size="md" onClick={() => setShowForm(true)}>
              Viết đánh giá
            </Button>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-md">
              <div className="flex items-center gap-sm">
                <span className="label-md text-on-surface">Đánh giá:</span>
                <StarPicker value={rating} onChange={setRating} />
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="Chia sẻ trải nghiệm của bạn..."
                className={cn(
                  'w-full rounded-md border bg-surface-container-lowest px-md py-sm body-sm',
                  'border-outline-variant placeholder:text-outline',
                  'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
                )}
              />
              {submitError && (
                <p className="body-sm text-red-600">{submitError}</p>
              )}
              <div className="flex gap-sm">
                <Button type="submit" size="md" isLoading={submitting} disabled={submitting}>
                  Gửi đánh giá
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => {
                    setShowForm(false);
                    setComment('');
                    setRating(5);
                    setSubmitError(null);
                  }}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            </form>
          )}
        </div>
      ) : (
        <p className="body-sm text-on-surface-variant">
          Đăng nhập để viết đánh giá.
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
        <p className="body-md text-red-600">{error}</p>
      ) : reviews.length === 0 ? (
        <p className="body-md text-on-surface-variant">
          Chưa có đánh giá nào.
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
            Trước
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
            Sau
          </Button>
        </div>
      )}
    </section>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={n === value}
          aria-label={`${n} stars`}
          onClick={() => onChange(n)}
          className={cn(
            'transition-transform hover:scale-110',
            n <= value ? 'text-amber-400' : 'text-outline-variant',
          )}
        >
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}
