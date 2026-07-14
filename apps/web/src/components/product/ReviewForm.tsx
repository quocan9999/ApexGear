import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import StarRating from '../ui/StarRating';
import Button from '../ui/Button';
import { reviewsService } from '../../services/reviews.service';

interface ReviewFormProps {
  productId: string;
  onSubmitted: () => void;
  className?: string;
}

const MAX_COMMENT = 2000;

export default function ReviewForm({ productId, onSubmitted, className }: ReviewFormProps) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (rating < 1 || rating > 5) {
      setError(t('reviews.form.ratingRequired'));
      return;
    }

    setSubmitting(true);
    try {
      await reviewsService.create({
        productId,
        rating,
        comment: comment.trim() || undefined,
      });
      setRating(0);
      setComment('');
      setSuccess(true);
      onSubmitted();
    } catch (err) {
      const status = (err as { status?: number } | null)?.status;
      if (status === 409) {
        setError(t('reviews.form.alreadyReviewed'));
      } else {
        const message = (err as { message?: string } | null)?.message;
        setError(message || t('common.error'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'flex flex-col gap-md rounded-xl bg-surface-container-lowest p-md animate-fade-in',
        className,
      )}
    >
      <h3 className="title-md text-on-surface">{t('reviews.form.title')}</h3>

      <div className="flex items-center gap-sm">
        <span className="label-md text-on-surface-variant">{t('reviews.form.rating')}</span>
        <StarRating
          rating={rating}
          size="md"
          onRate={setRating}
          getStarLabel={(n) => t('reviews.form.starLabel', { count: n })}
        />
      </div>

      <label className="flex flex-col gap-2xs">
        <span className="label-md text-on-surface-variant">{t('reviews.form.comment')}</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={MAX_COMMENT}
          placeholder={t('reviews.form.commentPlaceholder')}
          className={cn(
            'w-full rounded-md border bg-surface-container-lowest px-md py-sm body-sm text-on-surface',
            'border-outline-variant placeholder:text-on-surface-variant',
            'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
          )}
        />
      </label>

      {error && (
        <p className="body-sm text-error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="body-sm text-primary" role="status">
          {t('reviews.form.success')}
        </p>
      )}

      <div>
        <Button type="submit" size="md" isLoading={submitting} disabled={submitting}>
          {t('reviews.form.submit')}
        </Button>
      </div>
    </form>
  );
}
